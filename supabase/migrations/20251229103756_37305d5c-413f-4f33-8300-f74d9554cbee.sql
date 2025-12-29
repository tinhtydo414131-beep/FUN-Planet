-- Add columns for duplicate prevention
ALTER TABLE public.web3_reward_transactions 
ADD COLUMN IF NOT EXISTS leaderboard_score INTEGER,
ADD COLUMN IF NOT EXISTS claim_date DATE DEFAULT CURRENT_DATE;

-- Create a function to check for duplicate ranking claims
CREATE OR REPLACE FUNCTION public.check_duplicate_ranking_claim(
  p_user_id UUID,
  p_score INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if user already claimed ranking reward with this score today
  SELECT EXISTS (
    SELECT 1 FROM web3_reward_transactions
    WHERE user_id = p_user_id
      AND reward_type = 'ranking_reward'
      AND leaderboard_score = p_score
      AND claim_date = CURRENT_DATE
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$;

-- Create a function to safely claim ranking reward with duplicate check
CREATE OR REPLACE FUNCTION public.claim_ranking_reward_safe(
  p_user_id UUID,
  p_score INTEGER,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_last_claim TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check for duplicate claim (same score, same day)
  IF EXISTS (
    SELECT 1 FROM web3_reward_transactions
    WHERE user_id = p_user_id
      AND reward_type = 'ranking_reward'
      AND leaderboard_score = p_score
      AND claim_date = CURRENT_DATE
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already claimed ranking reward for this score today');
  END IF;
  
  -- Check for rate limiting (60 second cooldown between claims)
  SELECT MAX(created_at) INTO v_last_claim
  FROM web3_reward_transactions
  WHERE user_id = p_user_id
    AND reward_type = 'ranking_reward'
    AND created_at > NOW() - INTERVAL '60 seconds';
  
  IF v_last_claim IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please wait 60 seconds between claims');
  END IF;
  
  -- Get current balance
  SELECT COALESCE(camly_balance, 0) INTO v_current_balance
  FROM web3_rewards
  WHERE user_id = p_user_id;
  
  v_new_balance := COALESCE(v_current_balance, 0) + p_amount;
  
  -- Update or insert rewards
  INSERT INTO web3_rewards (user_id, camly_balance)
  VALUES (p_user_id, v_new_balance)
  ON CONFLICT (user_id) DO UPDATE SET camly_balance = v_new_balance;
  
  -- Record transaction with score for duplicate prevention
  INSERT INTO web3_reward_transactions (
    user_id, 
    amount, 
    reward_type, 
    description,
    leaderboard_score,
    claim_date
  )
  VALUES (
    p_user_id, 
    p_amount, 
    'ranking_reward', 
    'Ranking reward: ' || p_score || ' points × 100 = ' || p_amount::TEXT || ' Camly',
    p_score,
    CURRENT_DATE
  );
  
  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance, 'claimed_amount', p_amount);
END;
$$;

-- Create unique index for duplicate prevention (partial index)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ranking_claim_per_day
ON public.web3_reward_transactions (user_id, leaderboard_score, claim_date)
WHERE reward_type = 'ranking_reward' AND leaderboard_score IS NOT NULL;