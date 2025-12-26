import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reward amounts (in token units)
const REWARD_AMOUNTS = {
  first_wallet: 50000,    // 50,000 CAMLY
  game_completion: 10000, // 10,000 CAMLY
  game_upload: 500000,    // 500,000 CAMLY
  referral: 25000,        // 25,000 CAMLY per referral
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
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

    const normalizedWalletAddress = walletAddress.toLowerCase();

    // Check if already claimed based on claim type
    if (claimType === 'first_wallet') {
      // Check if this WALLET ADDRESS has ever claimed first_wallet reward (regardless of user)
      const { data: walletClaimed } = await supabase
        .from('camly_claims')
        .select('id')
        .eq('wallet_address', normalizedWalletAddress)
        .eq('claim_type', 'first_wallet')
        .in('status', ['completed', 'pending_balance'])
        .maybeSingle();

      if (walletClaimed) {
        return new Response(JSON.stringify({ 
          error: 'Địa chỉ ví này đã nhận thưởng kết nối lần đầu rồi!' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Also check if user has already claimed with any wallet
      const { data: userClaimed } = await supabase
        .from('camly_claims')
        .select('id')
        .eq('user_id', user.id)
        .eq('claim_type', 'first_wallet')
        .in('status', ['completed', 'pending_balance'])
        .maybeSingle();

      if (userClaimed) {
        return new Response(JSON.stringify({ 
          error: 'Bạn đã nhận thưởng kết nối ví lần đầu rồi!' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (claimType === 'game_completion') {
      // Check if user has completed at least 1 game (highest_level_completed >= 1)
      const { data: gameProgress } = await supabase
        .from('game_progress')
        .select('id, highest_level_completed')
        .eq('user_id', user.id)
        .gte('highest_level_completed', 1)
        .limit(1);

      if (!gameProgress || gameProgress.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'Bạn cần hoàn thành ít nhất 1 game để nhận thưởng này!' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check if claimed today
      const today = new Date().toISOString().split('T')[0];
      const { data: todayClaim } = await supabase
        .from('camly_claims')
        .select('id')
        .eq('user_id', user.id)
        .eq('claim_type', claimType)
        .gte('created_at', today)
        .in('status', ['pending', 'completed', 'pending_balance'])
        .maybeSingle();

      if (todayClaim) {
        return new Response(JSON.stringify({ error: 'Bạn đã nhận thưởng game hôm nay rồi!' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // For game_upload, verify the game is approved
    if (claimType === 'game_upload') {
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
        .in('status', ['completed', 'pending_balance'])
        .maybeSingle();

      if (existingGameClaim) {
        return new Response(JSON.stringify({ error: 'Reward already claimed for this game' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const rewardAmount = REWARD_AMOUNTS[claimType as keyof typeof REWARD_AMOUNTS];

    // Add to user's pending balance instead of immediate transfer
    const { data: newPending, error: pendingError } = await supabase
      .rpc('add_user_pending_reward', {
        p_user_id: user.id,
        p_amount: rewardAmount,
        p_source: claimType
      });

    if (pendingError) {
      console.error('Error adding pending reward:', pendingError);
      return new Response(JSON.stringify({ error: 'Failed to add reward to pending balance' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update wallet address in user_rewards
    await supabase
      .from('user_rewards')
      .update({ wallet_address: normalizedWalletAddress })
      .eq('user_id', user.id);

    // Create claim record with status 'pending_balance'
    const { data: claim, error: insertError } = await supabase
      .from('camly_claims')
      .insert({
        user_id: user.id,
        wallet_address: normalizedWalletAddress,
        claim_type: claimType,
        amount: rewardAmount,
        status: 'pending_balance', // New status - reward added to pending
        game_id: gameId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
    }

    console.log(`Added ${rewardAmount} CAMLY to pending balance for user ${user.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      status: 'pending_balance',
      message: `${rewardAmount.toLocaleString()} Camly coin đã được thêm vào số dư chờ nhận!`,
      amount: rewardAmount,
      newPendingBalance: newPending,
      claimId: claim?.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in claim-camly:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
