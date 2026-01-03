-- Create secure RPC function to process referral rewards
-- This bypasses RLS since it uses SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.process_referral_reward(
  p_referrer_id UUID,
  p_referred_id UUID,
  p_referral_code TEXT,
  p_reward_amount INTEGER DEFAULT 25000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_referral UUID;
  v_referrer_rewards RECORD;
  v_referred_username TEXT;
BEGIN
  -- 1. Check if referral already exists
  SELECT id INTO v_existing_referral
  FROM referrals
  WHERE referred_id = p_referred_id;
  
  IF v_existing_referral IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Referral already exists');
  END IF;
  
  -- 2. Prevent self-referral
  IF p_referrer_id = p_referred_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;
  
  -- 3. Get referred user's username for transaction description
  SELECT COALESCE(username, 'User') INTO v_referred_username
  FROM profiles
  WHERE id = p_referred_id;
  
  -- 4. Create referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, reward_paid, reward_amount, completed_at)
  VALUES (p_referrer_id, p_referred_id, p_referral_code, true, p_reward_amount, NOW());
  
  -- 5. Update or create referrer's web3_rewards
  SELECT camly_balance, total_referrals, referral_earnings
  INTO v_referrer_rewards
  FROM web3_rewards
  WHERE user_id = p_referrer_id;
  
  IF v_referrer_rewards IS NOT NULL THEN
    UPDATE web3_rewards
    SET 
      camly_balance = COALESCE(camly_balance, 0) + p_reward_amount,
      total_referrals = COALESCE(total_referrals, 0) + 1,
      referral_earnings = COALESCE(referral_earnings, 0) + p_reward_amount
    WHERE user_id = p_referrer_id;
  ELSE
    INSERT INTO web3_rewards (user_id, camly_balance, total_referrals, referral_earnings)
    VALUES (p_referrer_id, p_reward_amount, 1, p_reward_amount);
  END IF;
  
  -- 6. Record transaction for referrer
  INSERT INTO web3_reward_transactions (user_id, amount, reward_type, description)
  VALUES (p_referrer_id, p_reward_amount, 'referral_bonus', 'Mời bạn ' || v_referred_username || ' thành công');
  
  RETURN jsonb_build_object(
    'success', true, 
    'referrer_id', p_referrer_id,
    'reward_amount', p_reward_amount
  );
END;
$$;

-- Fix existing data: Sync referral stats from referrals table to web3_rewards
WITH referral_stats AS (
  SELECT 
    referrer_id,
    COUNT(*) as ref_count,
    COALESCE(SUM(reward_amount), 0) as total_reward
  FROM referrals
  WHERE reward_paid = true
  GROUP BY referrer_id
)
UPDATE web3_rewards w
SET 
  total_referrals = rs.ref_count,
  referral_earnings = rs.total_reward
FROM referral_stats rs
WHERE w.user_id = rs.referrer_id;

-- Insert missing transactions for existing referrals
INSERT INTO web3_reward_transactions (user_id, amount, reward_type, description, created_at)
SELECT 
  r.referrer_id,
  r.reward_amount,
  'referral_bonus',
  'Mời bạn mới thành công (historical)',
  r.created_at
FROM referrals r
WHERE r.reward_paid = true
AND NOT EXISTS (
  SELECT 1 FROM web3_reward_transactions t 
  WHERE t.user_id = r.referrer_id 
  AND t.reward_type = 'referral_bonus'
  AND DATE(t.created_at) = DATE(r.created_at)
);