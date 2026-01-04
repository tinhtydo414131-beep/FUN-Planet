import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.16.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CAMLY Token contract on BSC
const CAMLY_CONTRACT_ADDRESS = Deno.env.get('CAMLY_CONTRACT_ADDRESS') || "0x0910320181889fefde0bb1ca63962b0a8882e413";
const BSC_RPC_URL = "https://bsc-dataseed1.binance.org/";

// ERC20 Transfer ABI
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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const rewardWalletPrivateKey = Deno.env.get('CAMLY_REWARD_WALLET_PRIVATE_KEY');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[AUTH] No authorization header');
      return new Response(JSON.stringify({ success: false, error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[AUTH] Failed to get user:', authError?.message);
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      console.error('[AUTH] User is not admin:', user.id);
      return new Response(JSON.stringify({ success: false, error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { withdrawal_id } = await req.json();

    if (!withdrawal_id) {
      return new Response(JSON.stringify({ success: false, error: 'Missing withdrawal_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[PROCESS] Admin ${user.id} processing withdrawal: ${withdrawal_id}`);

    // Get the withdrawal request
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      console.error('[FETCH] Withdrawal not found:', fetchError?.message);
      return new Response(JSON.stringify({ success: false, error: 'Withdrawal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (withdrawal.status !== 'approved') {
      console.error('[STATUS] Invalid status:', withdrawal.status);
      return new Response(JSON.stringify({ success: false, error: `Withdrawal status is ${withdrawal.status}, not approved` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!rewardWalletPrivateKey) {
      console.error('[CONFIG] Missing CAMLY_REWARD_WALLET_PRIVATE_KEY');
      await markWithdrawalFailed(supabase, withdrawal_id, 'Server config error: Missing wallet key', withdrawal);
      return new Response(JSON.stringify({ success: false, error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Connect to BSC
    console.log('[RPC] Connecting to BSC...');
    let provider;
    try {
      provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
      await provider.getBlockNumber();
      console.log('[RPC] Connected to BSC');
    } catch (rpcError: any) {
      console.error('[RPC] Connection failed:', rpcError.message);
      await markWithdrawalFailed(supabase, withdrawal_id, 'RPC connection failed', withdrawal);
      return new Response(JSON.stringify({ success: false, error: 'Blockchain connection failed' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize wallet
    console.log('[WALLET] Initializing wallet...');
    let wallet;
    try {
      wallet = new ethers.Wallet(rewardWalletPrivateKey, provider);
      console.log('[WALLET] Address:', wallet.address);
    } catch (walletError: any) {
      console.error('[WALLET] Failed:', walletError.message);
      await markWithdrawalFailed(supabase, withdrawal_id, 'Wallet initialization failed', withdrawal);
      return new Response(JSON.stringify({ success: false, error: 'Wallet initialization failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check BNB balance for gas
    console.log('[GAS] Checking BNB balance...');
    try {
      const bnbBalance = await provider.getBalance(wallet.address);
      const bnbEther = ethers.formatEther(bnbBalance);
      console.log('[GAS] BNB balance:', bnbEther);
      
      if (parseFloat(bnbEther) < 0.001) {
        console.error('[GAS] Insufficient BNB for gas');
        await markWithdrawalFailed(supabase, withdrawal_id, 'Insufficient BNB for gas', withdrawal);
        await notifyAdminLowGas(supabase, wallet.address, bnbEther);
        return new Response(JSON.stringify({ success: false, error: 'Insufficient gas (BNB)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (gasError: any) {
      console.error('[GAS] Check failed:', gasError.message);
    }

    // Initialize contract and check CAMLY balance
    console.log('[TOKEN] Initializing CAMLY contract...');
    const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, ERC20_ABI, wallet);
    const decimals = 3;

    try {
      const balance = await contract.balanceOf(wallet.address);
      const balanceFormatted = Number(balance) / (10 ** decimals);
      console.log('[BALANCE] CAMLY:', balanceFormatted);
      
      if (balanceFormatted < withdrawal.amount) {
        console.error('[BALANCE] Insufficient CAMLY. Required:', withdrawal.amount, 'Available:', balanceFormatted);
        await markWithdrawalFailed(supabase, withdrawal_id, `Insufficient CAMLY. Required: ${withdrawal.amount}, Available: ${balanceFormatted}`, withdrawal);
        await notifyAdminLowCAMLY(supabase, withdrawal.amount, balanceFormatted);
        return new Response(JSON.stringify({ success: false, error: 'Insufficient CAMLY in reward wallet' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } catch (balError: any) {
      console.error('[BALANCE] Check failed:', balError.message);
    }

    // Send transaction
    console.log('[TX] Sending transfer...');
    console.log('[TX] To:', withdrawal.wallet_address);
    console.log('[TX] Amount:', withdrawal.amount);

    const amountWithDecimals = BigInt(Math.floor(withdrawal.amount)) * BigInt(10 ** decimals);
    
    let tx;
    try {
      tx = await contract.transfer(withdrawal.wallet_address, amountWithDecimals);
      console.log('[TX] Sent:', tx.hash);
    } catch (txError: any) {
      console.error('[TX] Failed:', txError.message);
      console.error('[TX] Code:', txError.code);
      console.error('[TX] Reason:', txError.reason);
      
      await markWithdrawalFailed(supabase, withdrawal_id, `TX failed: ${txError.reason || txError.message}`, withdrawal);
      return new Response(JSON.stringify({ success: false, error: 'Transaction failed', details: txError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Wait for confirmation
    console.log('[TX] Waiting for confirmation...');
    let receipt;
    try {
      receipt = await tx.wait(1);
      console.log('[TX] Confirmed in block:', receipt.blockNumber);
    } catch (waitError: any) {
      console.error('[TX] Confirmation failed:', waitError.message);
      await markWithdrawalFailed(supabase, withdrawal_id, 'TX confirmation timeout. Hash: ' + tx.hash, withdrawal);
      return new Response(JSON.stringify({ success: false, error: 'Transaction confirmation timeout', tx_hash: tx.hash }), {
        status: 504,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update withdrawal status to completed
    console.log('[DB] Updating status to completed...');
    await supabase
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        tx_hash: tx.hash,
        completed_at: new Date().toISOString(),
        admin_notes: (withdrawal.admin_notes || '') + ` | Completed TX: ${tx.hash}`
      })
      .eq('id', withdrawal_id);

    // Log the claim
    await supabase.from('daily_claim_logs').insert({
      user_id: withdrawal.user_id,
      amount_claimed: withdrawal.amount,
      tx_hash: tx.hash
    });

    // Log in camly_claims
    await supabase.from('camly_claims').insert({
      user_id: withdrawal.user_id,
      wallet_address: withdrawal.wallet_address,
      claim_type: 'withdrawal' as any,
      amount: withdrawal.amount,
      status: 'completed',
      tx_hash: tx.hash,
      claimed_at: new Date().toISOString(),
    });

    // Notify user
    await supabase.from('notifications').insert({
      user_id: withdrawal.user_id,
      title: 'Withdrawal Complete! 🎉',
      message: `Your withdrawal of ${Number(withdrawal.amount).toLocaleString()} CAMLY has been sent to your wallet.`,
      type: 'withdrawal_completed'
    });

    console.log('[SUCCESS] Withdrawal processed:', tx.hash);

    return new Response(JSON.stringify({ 
      success: true,
      tx_hash: tx.hash,
      amount: withdrawal.amount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[ERROR] Unexpected:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Helper: Mark withdrawal as failed and rollback
async function markWithdrawalFailed(supabase: any, withdrawalId: string, reason: string, withdrawal: any) {
  console.log('[ROLLBACK] Marking failed:', reason);
  
  await supabase
    .from('withdrawal_requests')
    .update({
      status: 'failed',
      admin_notes: (withdrawal.admin_notes || '') + ` | Failed: ${reason}`,
      completed_at: new Date().toISOString()
    })
    .eq('id', withdrawalId);

  // Return amount to user
  await supabase.rpc('add_user_pending_reward', {
    p_user_id: withdrawal.user_id,
    p_amount: withdrawal.amount,
    p_source: 'withdrawal_failed_rollback'
  });

  // Notify user
  await supabase.from('notifications').insert({
    user_id: withdrawal.user_id,
    title: 'Withdrawal Failed',
    message: `Your withdrawal of ${Number(withdrawal.amount).toLocaleString()} CAMLY failed. The amount has been returned to your balance.`,
    type: 'withdrawal_failed'
  });

  // Notify admin
  await supabase.from('admin_realtime_notifications').insert({
    notification_type: 'withdrawal_failed',
    title: 'Withdrawal Failed',
    message: `Withdrawal ${withdrawalId} failed: ${reason}`,
    priority: 'high',
    data: { withdrawal_id: withdrawalId, reason, user_id: withdrawal.user_id, amount: withdrawal.amount }
  });
}

// Helper: Notify admin about low gas
async function notifyAdminLowGas(supabase: any, walletAddress: string, balance: string) {
  await supabase.from('admin_realtime_notifications').insert({
    notification_type: 'low_gas',
    title: '⛽ Low BNB for Gas',
    message: `Reward wallet ${walletAddress.slice(0, 8)}... has only ${balance} BNB. Please refill!`,
    priority: 'high',
    data: { wallet: walletAddress, balance }
  });
}

// Helper: Notify admin about low CAMLY
async function notifyAdminLowCAMLY(supabase: any, required: number, available: number) {
  await supabase.from('admin_realtime_notifications').insert({
    notification_type: 'low_camly',
    title: '💰 Insufficient CAMLY',
    message: `Reward wallet needs ${required.toLocaleString()} CAMLY but only has ${available.toLocaleString()}. Please refill!`,
    priority: 'high',
    data: { required, available }
  });
}