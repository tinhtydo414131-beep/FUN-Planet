import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ethers } from "https://esm.sh/ethers@6.9.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reward amounts in CAMLY (with 18 decimals)
const REWARD_AMOUNTS = {
  welcome: ethers.parseUnits("50000", 18), // 50,000 CAMLY for first wallet connect
  playgame: ethers.parseUnits("10000", 18), // 10,000 CAMLY per game complete
  uploadgame: ethers.parseUnits("500000", 18), // 500,000 CAMLY for uploading a game
  daily_checkin: ethers.parseUnits("5000", 18), // 5,000 CAMLY for daily check-in
};

// ERC20 Transfer ABI
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

interface ClaimRequest {
  walletAddress: string;
  claimType: 'welcome' | 'playgame' | 'uploadgame' | 'daily_checkin';
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
    const camlyContractAddress = Deno.env.get('REWARDS_CLAIM_CONTRACT_ADDRESS');

    // Validate environment variables
    if (!treasuryPrivateKey) {
      console.error('REWARDS_SIGNER_PRIVATE_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Treasury key not set' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!camlyContractAddress) {
      console.error('REWARDS_CLAIM_CONTRACT_ADDRESS not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Contract address not set' }),
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
    if (!REWARD_AMOUNTS[claimType]) {
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

    // Step 2: Check claim conditions based on type
    const checksumAddress = ethers.getAddress(walletAddress);

    if (claimType === 'welcome') {
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
    }

    if (claimType === 'uploadgame') {
      if (!gameId) {
        return new Response(
          JSON.stringify({ error: 'gameId required for upload game reward' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if game exists and is approved
      const { data: game, error: gameError } = await supabase
        .from('uploaded_games')
        .select('id, status, uploader_id')
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
        .eq('metadata->>gameId', gameId)
        .limit(1);

      if (existingGameClaim && existingGameClaim.length > 0) {
        return new Response(
          JSON.stringify({ error: 'Reward already claimed for this game' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (claimType === 'daily_checkin') {
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
    }

    // Step 3: Connect to BSC and transfer tokens
    console.log('Connecting to BSC network...');
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
    const treasuryWallet = new ethers.Wallet(treasuryPrivateKey, provider);
    const camlyContract = new ethers.Contract(camlyContractAddress, ERC20_ABI, treasuryWallet);

    // Check treasury balance
    const treasuryBalance = await camlyContract.balanceOf(treasuryWallet.address);
    const rewardAmount = REWARD_AMOUNTS[claimType];

    if (treasuryBalance < rewardAmount) {
      console.error('Insufficient treasury balance:', ethers.formatUnits(treasuryBalance, 18));
      return new Response(
        JSON.stringify({ error: 'Reward pool temporarily unavailable. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Transferring ${ethers.formatUnits(rewardAmount, 18)} CAMLY to ${walletAddress}`);

    // Execute the transfer
    const tx = await camlyContract.transfer(walletAddress, rewardAmount);
    console.log('Transaction submitted:', tx.hash);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);

    // Step 4: Record the transaction in database
    const rewardTypeMap = {
      welcome: 'first_wallet_connect',
      playgame: 'game_complete',
      uploadgame: 'upload_game',
      daily_checkin: 'daily_checkin',
    };

    const { error: insertError } = await supabase
      .from('web3_reward_transactions')
      .insert({
        user_id: userId || null,
        wallet_address: checksumAddress,
        reward_type: rewardTypeMap[claimType],
        amount: Number(ethers.formatUnits(rewardAmount, 18)),
        tx_hash: receipt.hash,
        status: 'completed',
        metadata: {
          claimType,
          gameId: gameId || null,
          message,
          blockNumber: receipt.blockNumber,
        },
      });

    if (insertError) {
      console.error('Failed to record transaction:', insertError);
      // Transaction already succeeded, so we still return success
    }

    // Update user's wallet balance in profiles if userId provided
    if (userId) {
      const { error: balanceError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: userId,
        p_amount: Number(ethers.formatUnits(rewardAmount, 18)),
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
        amount: ethers.formatUnits(rewardAmount, 18),
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
