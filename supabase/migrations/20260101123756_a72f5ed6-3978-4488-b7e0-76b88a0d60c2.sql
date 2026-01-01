
-- ========================================
-- COMPREHENSIVE SECURITY MIGRATION
-- Protect CAMLY coin reward system from spam/fraud
-- ========================================

-- 1. Create table to track claimed referral tiers (replace localStorage)
CREATE TABLE IF NOT EXISTS public.claimed_referral_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier_id TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tier_id)
);

ALTER TABLE public.claimed_referral_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own claimed tiers" ON public.claimed_referral_tiers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claimed tiers" ON public.claimed_referral_tiers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. Create table to track game cleanup rewards (daily limit)
CREATE TABLE IF NOT EXISTS public.game_cleanup_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL,
  reward_amount INTEGER NOT NULL DEFAULT 10000,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(user_id, game_id)
);

ALTER TABLE public.game_cleanup_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cleanup rewards" ON public.game_cleanup_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert cleanup rewards" ON public.game_cleanup_rewards
  FOR INSERT WITH CHECK (true);

-- 3. Create table to track upload rewards (prevent duplicate per game)
CREATE TABLE IF NOT EXISTS public.upload_game_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL,
  reward_amount INTEGER NOT NULL DEFAULT 500000,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

ALTER TABLE public.upload_game_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own upload rewards" ON public.upload_game_rewards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert upload rewards" ON public.upload_game_rewards
  FOR INSERT WITH CHECK (true);

-- ========================================
-- SECURE RPC: claim_game_complete_safe
-- Prevents: duplicate claims, spam, race conditions
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_game_complete_safe(
  p_game_id UUID,
  p_level INTEGER,
  p_game_title TEXT DEFAULT 'Game'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_existing_claim UUID;
  v_last_claim_time TIMESTAMP WITH TIME ZONE;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_reward_amount INTEGER := 10000;
  v_cooldown_seconds INTEGER := 5;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check for existing claim today with same game/level
  SELECT id INTO v_existing_claim
  FROM camly_coin_transactions
  WHERE user_id = v_user_id
    AND transaction_type = 'game_complete'
    AND transaction_date = CURRENT_DATE
    AND description LIKE '%level ' || p_level || ' in%'
    AND description LIKE '%' || p_game_title || '%'
  LIMIT 1;

  IF v_existing_claim IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed today for this level');
  END IF;

  -- Check cooldown (5 seconds between any game_complete claims)
  SELECT MAX(created_at) INTO v_last_claim_time
  FROM camly_coin_transactions
  WHERE user_id = v_user_id
    AND transaction_type = 'game_complete';

  IF v_last_claim_time IS NOT NULL AND 
     v_last_claim_time > now() - (v_cooldown_seconds || ' seconds')::INTERVAL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please wait before claiming again', 'cooldown', v_cooldown_seconds);
  END IF;

  -- Lock user row to prevent race conditions
  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Update balance
  v_new_balance := v_current_balance + v_reward_amount;
  
  UPDATE profiles
  SET wallet_balance = v_new_balance
  WHERE id = v_user_id;

  -- Log transaction
  INSERT INTO camly_coin_transactions (user_id, amount, transaction_type, description, transaction_date)
  VALUES (v_user_id, v_reward_amount, 'game_complete', 'Completed level ' || p_level || ' in ' || p_game_title, CURRENT_DATE);

  RETURN jsonb_build_object(
    'success', true, 
    'reward', v_reward_amount, 
    'new_balance', v_new_balance
  );
END;
$$;

-- ========================================
-- SECURE RPC: claim_game_win_safe
-- Prevents: excessive coins, multiple claims per session
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_game_win_safe(
  p_game_id UUID,
  p_coins INTEGER,
  p_game_title TEXT DEFAULT 'Game'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_max_coins INTEGER := 1000000;
  v_daily_win_count INTEGER;
  v_max_daily_wins INTEGER := 20;
  v_validated_coins INTEGER;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Validate coins amount (max 1M per claim)
  v_validated_coins := LEAST(GREATEST(p_coins, 0), v_max_coins);

  -- Check daily win count for this game
  SELECT COUNT(*) INTO v_daily_win_count
  FROM camly_coin_transactions
  WHERE user_id = v_user_id
    AND transaction_type = 'game_win'
    AND transaction_date = CURRENT_DATE
    AND description LIKE '%' || p_game_title || '%';

  IF v_daily_win_count >= v_max_daily_wins THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily win limit reached for this game');
  END IF;

  -- Lock and update balance
  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  v_new_balance := v_current_balance + v_validated_coins;
  
  UPDATE profiles
  SET wallet_balance = v_new_balance
  WHERE id = v_user_id;

  -- Log transaction
  INSERT INTO camly_coin_transactions (user_id, amount, transaction_type, description, transaction_date)
  VALUES (v_user_id, v_validated_coins, 'game_win', 'Won game: ' || p_game_title, CURRENT_DATE);

  RETURN jsonb_build_object(
    'success', true, 
    'reward', v_validated_coins, 
    'new_balance', v_new_balance
  );
END;
$$;

-- ========================================
-- SECURE RPC: claim_game_cleanup_safe
-- Prevents: farming cleanup rewards (max 3/day)
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_game_cleanup_safe(
  p_game_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_reward_amount INTEGER := 10000;
  v_daily_count INTEGER;
  v_max_daily INTEGER := 3;
  v_existing_claim UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if already claimed for this game
  SELECT id INTO v_existing_claim
  FROM game_cleanup_rewards
  WHERE user_id = v_user_id AND game_id = p_game_id;

  IF v_existing_claim IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed cleanup reward for this game');
  END IF;

  -- Check daily limit
  SELECT COUNT(*) INTO v_daily_count
  FROM game_cleanup_rewards
  WHERE user_id = v_user_id AND claim_date = CURRENT_DATE;

  IF v_daily_count >= v_max_daily THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily cleanup reward limit reached (max 3)');
  END IF;

  -- Lock and update balance
  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  v_new_balance := v_current_balance + v_reward_amount;
  
  UPDATE profiles
  SET wallet_balance = v_new_balance
  WHERE id = v_user_id;

  -- Record cleanup reward claim
  INSERT INTO game_cleanup_rewards (user_id, game_id, reward_amount, claim_date)
  VALUES (v_user_id, p_game_id, v_reward_amount, CURRENT_DATE);

  -- Log transaction
  INSERT INTO camly_coin_transactions (user_id, amount, transaction_type, description, transaction_date)
  VALUES (v_user_id, v_reward_amount, 'game_cleanup', 'Phần thưởng dọn dẹp kho game', CURRENT_DATE);

  RETURN jsonb_build_object(
    'success', true, 
    'reward', v_reward_amount, 
    'new_balance', v_new_balance,
    'daily_remaining', v_max_daily - v_daily_count - 1
  );
END;
$$;

-- ========================================
-- SECURE RPC: claim_upload_reward_safe
-- Prevents: duplicate reward per game upload
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_upload_reward_safe(
  p_game_id UUID,
  p_game_title TEXT DEFAULT 'Game'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_reward_amount INTEGER := 500000;
  v_existing_claim UUID;
  v_game_exists BOOLEAN;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify game exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM uploaded_games 
    WHERE id = p_game_id AND user_id = v_user_id
  ) INTO v_game_exists;

  IF NOT v_game_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Game not found or not owned by user');
  END IF;

  -- Check if already claimed for this game
  SELECT id INTO v_existing_claim
  FROM upload_game_rewards
  WHERE user_id = v_user_id AND game_id = p_game_id;

  IF v_existing_claim IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed upload reward for this game');
  END IF;

  -- Lock and update balance
  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  v_new_balance := v_current_balance + v_reward_amount;
  
  UPDATE profiles
  SET wallet_balance = v_new_balance
  WHERE id = v_user_id;

  -- Record upload reward claim
  INSERT INTO upload_game_rewards (user_id, game_id, reward_amount)
  VALUES (v_user_id, p_game_id, v_reward_amount);

  -- Log transaction
  INSERT INTO camly_coin_transactions (user_id, amount, transaction_type, description, transaction_date)
  VALUES (v_user_id, v_reward_amount, 'reward', '🎮 Creator reward: ' || p_game_title, CURRENT_DATE);

  RETURN jsonb_build_object(
    'success', true, 
    'reward', v_reward_amount, 
    'new_balance', v_new_balance
  );
END;
$$;

-- ========================================
-- SECURE RPC: claim_challenge_reward_safe
-- Prevents: client-side manipulation of challenge rewards
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_challenge_reward_safe(
  p_challenge_id UUID,
  p_reward_amount INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_progress RECORD;
  v_challenge RECORD;
  v_validated_reward INTEGER;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get challenge info
  SELECT cc.prize_amount INTO v_challenge
  FROM daily_combo_challenges dc
  JOIN combo_challenges cc ON dc.challenge_id = cc.id
  WHERE dc.id = p_challenge_id AND dc.is_active = true;

  IF v_challenge IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found or inactive');
  END IF;

  -- Validate reward amount matches server-side value
  v_validated_reward := COALESCE(v_challenge.prize_amount, p_reward_amount);

  -- Check user progress
  SELECT * INTO v_progress
  FROM user_challenge_progress
  WHERE user_id = v_user_id AND daily_challenge_id = p_challenge_id
  FOR UPDATE;

  IF v_progress IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No progress found for this challenge');
  END IF;

  IF v_progress.completed_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not completed yet');
  END IF;

  IF v_progress.prize_claimed = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prize already claimed');
  END IF;

  -- Lock and update balance
  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  v_new_balance := v_current_balance + v_validated_reward;
  
  UPDATE profiles
  SET wallet_balance = v_new_balance
  WHERE id = v_user_id;

  -- Mark prize as claimed
  UPDATE user_challenge_progress
  SET prize_claimed = true
  WHERE user_id = v_user_id AND daily_challenge_id = p_challenge_id;

  -- Log transaction
  INSERT INTO camly_coin_transactions (user_id, amount, transaction_type, description, transaction_date)
  VALUES (v_user_id, v_validated_reward, 'challenge_reward', 'Daily challenge prize', CURRENT_DATE);

  RETURN jsonb_build_object(
    'success', true, 
    'reward', v_validated_reward, 
    'new_balance', v_new_balance
  );
END;
$$;

-- ========================================
-- SECURE RPC: claim_combo_prize_safe
-- Prevents: duplicate combo prize claims
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_combo_prize_safe(
  p_prize_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_prize RECORD;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get and lock prize record
  SELECT * INTO v_prize
  FROM combo_period_winners
  WHERE id = p_prize_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_prize IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prize not found');
  END IF;

  IF v_prize.claimed = true THEN
    RETURN jsonb_build_object('success', false, 'error', 'Prize already claimed');
  END IF;

  -- Lock and update balance
  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  v_new_balance := v_current_balance + v_prize.prize_amount;
  
  UPDATE profiles
  SET wallet_balance = v_new_balance
  WHERE id = v_user_id;

  -- Mark prize as claimed
  UPDATE combo_period_winners
  SET claimed = true
  WHERE id = p_prize_id;

  -- Log transaction
  INSERT INTO camly_coin_transactions (user_id, amount, transaction_type, description, transaction_date)
  VALUES (v_user_id, v_prize.prize_amount, 'combo_prize', 'Combo period winner prize (' || v_prize.period_type || ')', CURRENT_DATE);

  RETURN jsonb_build_object(
    'success', true, 
    'reward', v_prize.prize_amount, 
    'new_balance', v_new_balance
  );
END;
$$;

-- ========================================
-- SECURE RPC: claim_referral_tier_safe
-- Prevents: localStorage manipulation for tier rewards
-- ========================================
CREATE OR REPLACE FUNCTION public.claim_referral_tier_safe(
  p_tier_id TEXT,
  p_tier_reward INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_total_referrals INTEGER;
  v_required_referrals INTEGER;
  v_existing_claim UUID;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Map tier_id to required referrals
  v_required_referrals := CASE p_tier_id
    WHEN 'bronze' THEN 3
    WHEN 'silver' THEN 10
    WHEN 'gold' THEN 25
    WHEN 'platinum' THEN 50
    WHEN 'diamond' THEN 100
    WHEN 'master' THEN 250
    WHEN 'legend' THEN 500
    ELSE 999999
  END;

  -- Check user's actual referral count
  SELECT COALESCE(total_referrals, 0) INTO v_total_referrals
  FROM web3_rewards
  WHERE user_id = v_user_id;

  IF v_total_referrals < v_required_referrals THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough referrals for this tier');
  END IF;

  -- Check if already claimed
  SELECT id INTO v_existing_claim
  FROM claimed_referral_tiers
  WHERE user_id = v_user_id AND tier_id = p_tier_id;

  IF v_existing_claim IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tier already claimed');
  END IF;

  -- Lock and update balance
  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  v_new_balance := v_current_balance + p_tier_reward;
  
  UPDATE profiles
  SET wallet_balance = v_new_balance
  WHERE id = v_user_id;

  -- Record tier claim
  INSERT INTO claimed_referral_tiers (user_id, tier_id, reward_amount)
  VALUES (v_user_id, p_tier_id, p_tier_reward);

  -- Also update web3_rewards for sync
  UPDATE web3_rewards
  SET camly_balance = COALESCE(camly_balance, 0) + p_tier_reward,
      referral_earnings = COALESCE(referral_earnings, 0) + p_tier_reward
  WHERE user_id = v_user_id;

  -- Log transaction
  INSERT INTO web3_reward_transactions (user_id, amount, reward_type, description)
  VALUES (v_user_id, p_tier_reward, 'referral_tier_bonus', 'Đạt cấp ' || p_tier_id || ' - Thưởng ' || p_tier_reward::TEXT || ' Camly');

  RETURN jsonb_build_object(
    'success', true, 
    'reward', p_tier_reward, 
    'new_balance', v_new_balance,
    'tier_id', p_tier_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.claim_game_complete_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_game_win_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_game_cleanup_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_upload_reward_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_challenge_reward_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_combo_prize_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_referral_tier_safe TO authenticated;
