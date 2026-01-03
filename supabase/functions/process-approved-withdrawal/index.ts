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

    // Verify the admin user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: isAdmin } = await supabase.rpc('has_role', {
      p_user_id: user.id,
      p_role: 'admin'
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { withdrawal_id } = await req.json();

    if (!withdrawal_id) {
      return new Response(JSON.stringify({ error: 'Missing withdrawal_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Admin ${user.id} processing approved withdrawal: ${withdrawal_id}`);

    // Get the withdrawal request
    const { data: withdrawal, error: fetchError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (fetchError || !withdrawal) {
      return new Response(JSON.stringify({ error: 'Withdrawal not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (withdrawal.status !== 'approved') {
      return new Response(JSON.stringify({ error: `Withdrawal status is ${withdrawal.status}, not approved` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process the on-chain transfer
    try {
      const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
      const wallet = new ethers.Wallet(rewardWalletPrivateKey, provider);
      const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, ERC20_ABI, wallet);

      const decimals = 3;
      const amountWithDecimals = BigInt(Math.floor(withdrawal.amount)) * BigInt(10 ** decimals);

      console.log(`Transferring ${withdrawal.amount} CAMLY to ${withdrawal.wallet_address}`);

      // Execute transfer
      const tx = await contract.transfer(withdrawal.wallet_address, amountWithDecimals);
      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Update withdrawal request status to completed
      await supabase
        .from('withdrawal_requests')
        .update({
          status: 'completed',
          tx_hash: receipt.hash,
          completed_at: new Date().toISOString()
        })
        .eq('id', withdrawal_id);

      // Log the claim in daily_claim_logs
      await supabase
        .from('daily_claim_logs')
        .insert({
          user_id: withdrawal.user_id,
          amount_claimed: withdrawal.amount,
          tx_hash: receipt.hash
        });

      // Also log in camly_claims for history
      await supabase
        .from('camly_claims')
        .insert({
          user_id: withdrawal.user_id,
          wallet_address: withdrawal.wallet_address,
          claim_type: 'arbitrary' as any,
          amount: withdrawal.amount,
          status: 'completed',
          tx_hash: receipt.hash,
          claimed_at: new Date().toISOString(),
        });

      // Notify user
      await supabase
        .from('user_notifications')
        .insert({
          user_id: withdrawal.user_id,
          notification_type: 'withdrawal_completed',
          title: 'Withdrawal Completed',
          message: `Your withdrawal of ${withdrawal.amount.toLocaleString()} CAMLY has been sent to your wallet`,
          data: { withdrawal_id, tx_hash: receipt.hash, amount: withdrawal.amount }
        });

      return new Response(JSON.stringify({ 
        success: true,
        tx_hash: receipt.hash,
        amount: withdrawal.amount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (txError: any) {
      console.error('Transaction error:', txError);
      
      // Mark withdrawal as failed
      await supabase
        .from('withdrawal_requests')
        .update({ status: 'failed' })
        .eq('id', withdrawal_id);

      // Rollback - add back the pending amount
      await supabase.rpc('add_user_pending_reward', {
        p_user_id: withdrawal.user_id,
        p_amount: withdrawal.amount,
        p_source: 'rollback_failed_withdrawal'
      });

      // Notify user
      await supabase
        .from('user_notifications')
        .insert({
          user_id: withdrawal.user_id,
          notification_type: 'withdrawal_failed',
          title: 'Withdrawal Failed',
          message: `Your withdrawal failed due to a blockchain error. The amount has been returned to your pending balance.`,
          data: { withdrawal_id, error: txError.message }
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
    console.error('Error in process-approved-withdrawal:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
