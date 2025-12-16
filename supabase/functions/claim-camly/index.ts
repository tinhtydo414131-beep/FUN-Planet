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

// Reward amounts (in token units - multiply by 10^3 for decimals)
const REWARD_AMOUNTS = {
  first_wallet: 50000,    // 50,000 CAMLY
  game_completion: 10000, // 10,000 CAMLY
  game_upload: 500000,    // 500,000 CAMLY
};

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

    const { walletAddress, claimType, gameId } = await req.json();

    // Validate inputs
    if (!walletAddress || !claimType) {
      return new Response(JSON.stringify({ error: 'Missing walletAddress or claimType' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!['first_wallet', 'game_completion', 'game_upload'].includes(claimType)) {
      return new Response(JSON.stringify({ error: 'Invalid claim type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check user profile for age (child safety)
    const { data: profile } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', user.id)
      .single();

    // Check parent-child links for parental approval requirement
    const { data: childLink } = await supabase
      .from('parent_child_links')
      .select('*')
      .eq('child_id', user.id)
      .eq('status', 'approved')
      .maybeSingle();

    const requiresParentApproval = !!childLink;

    // Check if already claimed (for first_wallet, check ever; for others, check today)
    if (claimType === 'first_wallet') {
      const { data: existingClaim } = await supabase
        .from('camly_claims')
        .select('id')
        .eq('user_id', user.id)
        .eq('claim_type', 'first_wallet')
        .eq('status', 'completed')
        .maybeSingle();

      if (existingClaim) {
        return new Response(JSON.stringify({ error: 'First wallet reward already claimed' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Check if claimed today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayClaim } = await supabase
        .from('camly_claims')
        .select('id')
        .eq('user_id', user.id)
        .eq('claim_type', claimType)
        .gte('created_at', today)
        .in('status', ['pending', 'completed'])
        .maybeSingle();

      if (todayClaim) {
        return new Response(JSON.stringify({ error: 'Already claimed today' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // For game_upload, verify the user is admin or it's triggered by admin
    if (claimType === 'game_upload') {
      const { data: isAdmin } = await supabase.rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
      
      // game_upload claims are typically triggered by admin approval
      // The gameId must be provided and the game must be approved
      if (!gameId) {
        return new Response(JSON.stringify({ error: 'Game ID required for upload reward' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: game } = await supabase
        .from('uploaded_games')
        .select('user_id, status')
        .eq('id', gameId)
        .single();

      if (!game || game.status !== 'approved') {
        return new Response(JSON.stringify({ error: 'Game not approved' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if this game already has a claim
      const { data: existingGameClaim } = await supabase
        .from('camly_claims')
        .select('id')
        .eq('game_id', gameId)
        .eq('claim_type', 'game_upload')
        .eq('status', 'completed')
        .maybeSingle();

      if (existingGameClaim) {
        return new Response(JSON.stringify({ error: 'Reward already claimed for this game' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const rewardAmount = REWARD_AMOUNTS[claimType as keyof typeof REWARD_AMOUNTS];

    // Create pending claim record
    const { data: claim, error: insertError } = await supabase
      .from('camly_claims')
      .insert({
        user_id: user.id,
        wallet_address: walletAddress,
        claim_type: claimType,
        amount: rewardAmount,
        status: requiresParentApproval ? 'pending_approval' : 'pending',
        parent_approval_required: requiresParentApproval,
        game_id: gameId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create claim' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If requires parent approval, return pending status
    if (requiresParentApproval) {
      return new Response(JSON.stringify({ 
        success: true, 
        status: 'pending_approval',
        message: 'Claim requires parental approval',
        claimId: claim.id,
        amount: rewardAmount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process the transfer
    try {
      const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
      const wallet = new ethers.Wallet(rewardWalletPrivateKey, provider);
      const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, ERC20_ABI, wallet);

      // Get decimals (CAMLY has 3 decimals)
      const decimals = 3;
      const amountWithDecimals = BigInt(rewardAmount) * BigInt(10 ** decimals);

      console.log(`Transferring ${rewardAmount} CAMLY to ${walletAddress}`);

      // Execute transfer
      const tx = await contract.transfer(walletAddress, amountWithDecimals);
      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.hash);

      // Update claim record
      await supabase
        .from('camly_claims')
        .update({
          status: 'completed',
          tx_hash: receipt.hash,
          claimed_at: new Date().toISOString(),
        })
        .eq('id', claim.id);

      // Also update wallet balance in profiles
      await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: rewardAmount,
        p_operation: 'add'
      });

      return new Response(JSON.stringify({ 
        success: true, 
        status: 'completed',
        txHash: receipt.hash,
        amount: rewardAmount,
        claimId: claim.id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (txError: any) {
      console.error('Transaction error:', txError);
      
      // Update claim as failed
      await supabase
        .from('camly_claims')
        .update({
          status: 'failed',
        })
        .eq('id', claim.id);

      return new Response(JSON.stringify({ 
        error: 'Transaction failed', 
        details: txError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in claim-camly:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
