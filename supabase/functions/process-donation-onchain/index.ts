import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.16.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CAMLY_CONTRACT_ADDRESS = "0x2299d722d65C8f64F5fd6C1C5fB7c79566d6EE23";
const DONATION_WALLET_ADDRESS = "0xaBeB558CC6D34e56eaDB53D248872bEd1e7b77be";
const BSC_RPC_URLS = [
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org",
  "https://bsc-dataseed3.binance.org",
  "https://bsc-dataseed4.binance.org",
];

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth header and verify user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin role using has_role function
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { donation_id, process_all } = await req.json();
    console.log('Processing donation request:', { donation_id, process_all, admin: user.id });

    // Get donations to process
    let donationsToProcess = [];
    
    if (process_all) {
      const { data: donations, error: fetchError } = await supabase
        .from('platform_donations')
        .select('*')
        .eq('is_onchain', false)
        .order('created_at', { ascending: true });
      
      if (fetchError) throw fetchError;
      donationsToProcess = donations || [];
    } else if (donation_id) {
      const { data: donation, error: fetchError } = await supabase
        .from('platform_donations')
        .select('*')
        .eq('id', donation_id)
        .single();
      
      if (fetchError) throw fetchError;
      if (!donation) {
        return new Response(JSON.stringify({ error: 'Donation not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (donation.is_onchain) {
        return new Response(JSON.stringify({ error: 'Donation already processed on-chain' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      donationsToProcess = [donation];
    } else {
      return new Response(JSON.stringify({ error: 'donation_id or process_all required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (donationsToProcess.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No internal donations to process',
        processed: 0 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate total amount needed
    const totalAmount = donationsToProcess.reduce((sum, d) => sum + Number(d.amount), 0);
    console.log(`Processing ${donationsToProcess.length} donations, total: ${totalAmount} CAMLY`);

    // Get private key
    const privateKey = Deno.env.get('CAMLY_REWARD_WALLET_PRIVATE_KEY');
    if (!privateKey) {
      console.error('CAMLY_REWARD_WALLET_PRIVATE_KEY not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Connect to BSC with fallback RPC
    let provider = null;
    for (const rpcUrl of BSC_RPC_URLS) {
      try {
        provider = new ethers.JsonRpcProvider(rpcUrl);
        await provider.getBlockNumber();
        console.log('Connected to BSC via:', rpcUrl);
        break;
      } catch (e) {
        console.warn(`RPC ${rpcUrl} failed, trying next...`);
      }
    }

    if (!provider) {
      throw new Error('Failed to connect to BSC network');
    }

    const wallet = new ethers.Wallet(privateKey, provider);
    const camlyContract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, ERC20_ABI, wallet);

    // Check balances
    const bnbBalance = await provider.getBalance(wallet.address);
    const bnbBalanceFormatted = ethers.formatEther(bnbBalance);
    console.log('Reward wallet BNB balance:', bnbBalanceFormatted);

    if (parseFloat(bnbBalanceFormatted) < 0.001) {
      await notifyAdminLowGas(supabase, bnbBalanceFormatted);
      return new Response(JSON.stringify({ 
        error: 'Insufficient BNB for gas fees',
        bnb_balance: bnbBalanceFormatted 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const decimals = await camlyContract.decimals();
    const camlyBalance = await camlyContract.balanceOf(wallet.address);
    const camlyBalanceFormatted = Number(ethers.formatUnits(camlyBalance, decimals));
    console.log('Reward wallet CAMLY balance:', camlyBalanceFormatted);

    if (camlyBalanceFormatted < totalAmount) {
      await notifyAdminLowCAMLY(supabase, camlyBalanceFormatted, totalAmount);
      return new Response(JSON.stringify({ 
        error: 'Insufficient CAMLY in reward wallet',
        required: totalAmount,
        available: camlyBalanceFormatted 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process each donation
    const results = [];
    for (const donation of donationsToProcess) {
      try {
        const amount = ethers.parseUnits(String(donation.amount), decimals);
        console.log(`Transferring ${donation.amount} CAMLY for donation ${donation.id}...`);

        const tx = await camlyContract.transfer(DONATION_WALLET_ADDRESS, amount);
        console.log('TX sent:', tx.hash);

        const receipt = await tx.wait();
        console.log('TX confirmed:', receipt.hash, 'Block:', receipt.blockNumber);

        // Update donation record
        const { error: updateError } = await supabase
          .from('platform_donations')
          .update({
            is_onchain: true,
            tx_hash: receipt.hash,
            donation_type: 'onchain_processed',
            updated_at: new Date().toISOString()
          })
          .eq('id', donation.id);

        if (updateError) {
          console.error('Failed to update donation:', updateError);
        }

        results.push({
          donation_id: donation.id,
          amount: donation.amount,
          tx_hash: receipt.hash,
          success: true
        });

        // Small delay between transactions
        if (donationsToProcess.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (txError: unknown) {
        const errorMessage = txError instanceof Error ? txError.message : 'Unknown error';
        console.error(`Failed to process donation ${donation.id}:`, txError);
        results.push({
          donation_id: donation.id,
          amount: donation.amount,
          success: false,
          error: errorMessage
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    // Notify admin about results
    await supabase.from('admin_realtime_notifications').insert({
      notification_type: 'donation_processed',
      title: 'Donations Processed On-chain',
      message: `Successfully processed ${successCount}/${donationsToProcess.length} donations to ${DONATION_WALLET_ADDRESS}`,
      priority: failedCount > 0 ? 'high' : 'low',
      data: { results, total_amount: totalAmount }
    });

    return new Response(JSON.stringify({
      success: true,
      processed: successCount,
      failed: failedCount,
      total_amount: totalAmount,
      donation_wallet: DONATION_WALLET_ADDRESS,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Process donation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function notifyAdminLowGas(supabase: any, balance: string) {
  await supabase.from('admin_realtime_notifications').insert({
    notification_type: 'low_gas',
    title: '⛽ Low BNB for Donation Processing',
    message: `Reward wallet has only ${balance} BNB. Need more for gas fees.`,
    priority: 'high',
    data: { bnb_balance: balance }
  });
}

async function notifyAdminLowCAMLY(supabase: any, available: number, required: number) {
  await supabase.from('admin_realtime_notifications').insert({
    notification_type: 'low_camly',
    title: '⚠️ Insufficient CAMLY for Donations',
    message: `Need ${required} CAMLY but only ${available} available in reward wallet.`,
    priority: 'high',
    data: { available, required }
  });
}
