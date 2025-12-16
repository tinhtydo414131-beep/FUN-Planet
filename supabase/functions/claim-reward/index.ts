import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ethers } from "https://esm.sh/ethers@6.9.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reward amounts in CAMLY (with 18 decimals)
const REWARD_AMOUNTS: Record<string, bigint> = {
  welcome: ethers.parseUnits("50000", 18),
  playgame: ethers.parseUnits("10000", 18),
  uploadgame: ethers.parseUnits("500000", 18),
  daily_checkin: ethers.parseUnits("5000", 18),
  claim_pending: BigInt(0), // Will be calculated from pending rewards
};

// ERC20 Transfer ABI
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

interface ClaimRequest {
  walletAddress: string;
  claimType: 'welcome' | 'playgame' | 'uploadgame' | 'daily_checkin' | 'claim_pending';
  signature: string;
  message: string;
  gameId?: string;
  userId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const treasuryPrivateKey = Deno.env.get('REWARDS_SIGNER_PRIVATE_KEY');
    const camlyContractAddress = Deno.env.get('REWARDS_CLAIM_CONTRACT_ADDRESS') || '0x0910320181889feFDE0BB1Ca63962b0A8882e413';

    // Validate environment variables
    if (!treasuryPrivateKey) {
      console.error('REWARDS_SIGNER_PRIVATE_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Treasury key not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { walletAddress, claimType, signature, message, gameId, userId }: ClaimRequest = await req.json();

    // Validate required fields
    if (!walletAddress || !claimType || !signature || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: walletAddress, claimType, signature, message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate wallet address format
    if (!ethers.isAddress(walletAddress)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate claim type
    if (!(claimType in REWARD_AMOUNTS)) {
      return new Response(
        JSON.stringify({ error: 'Invalid claim type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${claimType} claim for wallet: ${walletAddress}`);

    // Step 1: Verify the signature
    let recoveredAddress: string;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.error(`Signature mismatch: expected ${walletAddress}, got ${recoveredAddress}`);
        return new Response(
          JSON.stringify({ error: 'Signature verification failed: Address mismatch' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (sigError) {
      console.error('Signature verification error:', sigError);
      return new Response(
        JSON.stringify({ error: 'Invalid signature format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Signature verified for wallet: ${walletAddress}`);

    // Step 2: Check claim conditions and calculate reward amount
    const checksumAddress = ethers.getAddress(walletAddress);
    let rewardAmount: bigint;

    if (claimType === 'claim_pending') {
      // Claim all pending rewards for this wallet
      const { data: pendingRewards, error: pendingError } = await supabase
        .from('pending_rewards')
        .select('id, amount')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('claimed', false);

      if (pendingError) {
        console.error('Error fetching pending rewards:', pendingError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch pending rewards' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!pendingRewards || pendingRewards.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No pending rewards to claim' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate total pending amount
      const totalPending = pendingRewards.reduce((sum, r) => sum + Number(r.amount), 0);
      rewardAmount = ethers.parseUnits(totalPending.toString(), 18);
      
      console.log(`Claiming ${totalPending} pending CAMLY for wallet ${walletAddress}`);
    } else if (claimType === 'welcome') {
      // Check if user has already claimed welcome reward
      const { data: existingClaim, error: checkError } = await supabase
        .from('web3_reward_transactions')
        .select('id')
        .eq('wallet_address', checksumAddress)
        .eq('reward_type', 'first_wallet_connect')
        .limit(1);

      if (checkError) {
        console.error('Database error checking existing claim:', checkError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify claim eligibility' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (existingClaim && existingClaim.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Welcome reward already claimed for this wallet' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      rewardAmount = REWARD_AMOUNTS[claimType];
    } else if (claimType === 'uploadgame') {
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'gameId required for upload game reward' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if game exists and is approved
      const { data: game, error: gameError } = await supabase
        .from('uploaded_games')
        .select('id, status, user_id')
        .eq('id', gameId)
        .single();

      if (gameError || !game) {
        return new Response(
          JSON.stringify({ error: 'Game not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (game.status !== 'approved') {
        return new Response(
          JSON.stringify({ error: 'Game must be approved before claiming reward' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if reward already claimed for this game
      const { data: existingGameClaim } = await supabase
        .from('web3_reward_transactions')
        .select('id')
        .eq('wallet_address', checksumAddress)
        .eq('reward_type', 'upload_game')
        .limit(1);

      if (existingGameClaim && existingGameClaim.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Reward already claimed for this game' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      rewardAmount = REWARD_AMOUNTS[claimType];
    } else if (claimType === 'daily_checkin') {
      // Check if user already checked in today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingCheckin } = await supabase
        .from('web3_reward_transactions')
        .select('id')
        .eq('wallet_address', checksumAddress)
        .eq('reward_type', 'daily_checkin')
        .gte('created_at', `${today}T00:00:00Z`)
        .limit(1);

      if (existingCheckin && existingCheckin.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Daily check-in already claimed today' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      rewardAmount = REWARD_AMOUNTS[claimType];
    } else {
      rewardAmount = REWARD_AMOUNTS[claimType];
    }

    // Step 3: Connect to BSC and transfer tokens
    console.log('Connecting to BSC network...');
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
    const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
    const camlyContract = new ethers.Contract(camlyContractAddress, ERC20_ABI, treasuryWallet);

    // Check treasury balance
    const treasuryBalance = await camlyContract.balanceOf(treasuryWallet.address);

    if (treasuryBalance < rewardAmount) {
      console.error('Insufficient treasury balance:', ethers.formatUnits(treasuryBalance, 18));
      return new Response(
        JSON.stringify({ error: 'Reward pool temporarily unavailable. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const formattedAmount = ethers.formatUnits(rewardAmount, 18);
    console.log(`Transferring ${formattedAmount} CAMLY to ${walletAddress}`);

    // Execute the transfer
    const tx = await camlyContract.transfer(walletAddress, rewardAmount);
    console.log('Transaction submitted:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);

    // Step 4: Record the transaction and update pending rewards
    const rewardTypeMap: Record<string, string> = {
      welcome: 'first_wallet_connect',
      playgame: 'game_complete',
      uploadgame: 'upload_game',
      daily_checkin: 'daily_checkin',
      claim_pending: 'pending_claim',
    };

    // Insert transaction record
    const { error: insertError } = await supabase
      .from('web3_reward_transactions')
      .insert({
        user_id: userId || null,
        wallet_address: checksumAddress,
        reward_type: rewardTypeMap[claimType],
        amount: Number(formattedAmount),
        tx_hash: receipt.hash,
        transaction_hash: receipt.hash,
        status: 'completed',
        claimed_to_wallet: true,
        metadata: {
          claimType,
          gameId: gameId || null,
          message,
          blockNumber: receipt.blockNumber,
        },
      });

    if (insertError) {
      console.error('Failed to record transaction:', insertError);
    }

    // Mark pending rewards as claimed if this was a pending claim
    if (claimType === 'claim_pending') {
      const { error: updateError } = await supabase
        .from('pending_rewards')
        .update({
          claimed: true,
          claimed_at: new Date().toISOString(),
          tx_hash: receipt.hash,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('claimed', false);

      if (updateError) {
        console.error('Failed to update pending rewards:', updateError);
      }
    }

    // Update user's wallet balance in profiles if userId provided
    if (userId) {
      const { error: balanceError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: Number(formattedAmount),
        p_operation: 'add',
      });

      if (balanceError) {
        console.error('Failed to update wallet balance:', balanceError);
      }
    }

    console.log(`Successfully claimed ${claimType} reward for ${walletAddress}`);

    return new Response(
      JSON.stringify({
        success: true,
        txHash: receipt.hash,
        amount: formattedAmount,
        claimType,
        walletAddress,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Claim reward error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
