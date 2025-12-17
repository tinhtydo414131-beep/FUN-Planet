import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@6.13.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CAMLY Token contract on BSC
const CAMLY_CONTRACT_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const BSC_RPC_URL = "https://bsc-dataseed1.binance.org/";

const DAILY_LIMIT = 5000000; // 5 million CAMLY per day

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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const rewardWalletPrivateKey = Deno.env.get('CAMLY_REWARD_WALLET_PRIVATE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { walletAddress, amount, parentSignature } = await req.json();

    // Validate inputs
    if (!walletAddress || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid walletAddress or amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`User ${user.id} requesting claim of ${amount} CAMLY to ${walletAddress}`);

    // Check if user is a child requiring parent approval
    const { data: childLink } = await supabase
      .from('parent_child_links')
      .select('parent_id')
      .eq('child_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    if (childLink && !parentSignature) {
      return new Response(JSON.stringify({ 
        error: 'Parent approval required',
        requiresParentApproval: true,
        parentId: childLink.parent_id
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the claim_from_pending function to validate and process
    const { data: claimResult, error: claimError } = await supabase
      .rpc('claim_from_pending', {
        p_user_id: user.id,
        p_amount: amount,
        p_wallet_address: walletAddress
      });

    if (claimError) {
      console.error('Claim validation error:', claimError);
      return new Response(JSON.stringify({ error: 'Failed to process claim' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = claimResult[0];
    
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: result.error_message,
        pending: result.new_pending,
        dailyRemaining: result.daily_remaining
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process the on-chain transfer
    try {
      const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
      const wallet = new ethers.Wallet(rewardWalletPrivateKey, provider);
      const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, ERC20_ABI, wallet);

      // Get decimals (CAMLY has 3 decimals)
      const decimals = 3;
      const amountWithDecimals = BigInt(Math.floor(amount)) * BigInt(10 ** decimals);

      console.log(`Transferring ${amount} CAMLY to ${walletAddress}`);

      // Execute transfer
      const tx = await contract.transfer(walletAddress, amountWithDecimals);
      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Log the claim in daily_claim_logs
      await supabase
        .from('daily_claim_logs')
        .insert({
          user_id: user.id,
          amount_claimed: amount,
          tx_hash: receipt.hash
        });

      // Also log in camly_claims for history
      await supabase
        .from('camly_claims')
        .insert({
          user_id: user.id,
          wallet_address: walletAddress,
          claim_type: 'arbitrary' as any,
          amount: amount,
          status: 'completed',
          tx_hash: receipt.hash,
          claimed_at: new Date().toISOString(),
        });

      // Update wallet balance in profiles
      await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: amount,
        p_operation: 'add'
      });

      return new Response(JSON.stringify({ 
        success: true, 
        txHash: receipt.hash,
        amount: amount,
        newPending: result.new_pending,
        dailyRemaining: result.daily_remaining
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (txError: any) {
      console.error('Transaction error:', txError);
      
      // Rollback the database changes by adding back the pending amount
      await supabase.rpc('add_user_pending_reward', {
        p_user_id: user.id,
        p_amount: amount,
        p_source: 'rollback'
      });

      return new Response(JSON.stringify({ 
        error: 'Transaction failed', 
        details: txError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in claim-arbitrary:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
