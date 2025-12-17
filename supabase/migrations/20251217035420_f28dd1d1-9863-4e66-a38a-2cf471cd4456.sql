-- Create daily login rewards table
CREATE TABLE public.daily_login_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT,
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount INTEGER NOT NULL DEFAULT 5000,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint for one claim per user per day
ALTER TABLE public.daily_login_rewards 
ADD CONSTRAINT unique_user_daily_login UNIQUE (user_id, claim_date);

-- Enable RLS
ALTER TABLE public.daily_login_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own daily login rewards"
ON public.daily_login_rewards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily login rewards"
ON public.daily_login_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all daily login rewards"
ON public.daily_login_rewards
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_daily_login_rewards_user_date ON public.daily_login_rewards(user_id, claim_date);
CREATE INDEX idx_daily_login_rewards_date ON public.daily_login_rewards(claim_date);

-- Database function to check and claim daily login reward
CREATE OR REPLACE FUNCTION public.claim_daily_login_reward(p_user_id UUID, p_wallet_address TEXT DEFAULT NULL)
RETURNS TABLE(success BOOLEAN, already_claimed BOOLEAN, amount INTEGER, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reward_amount INTEGER := 5000;
  v_today DATE := CURRENT_DATE;
  v_existing_claim UUID;
BEGIN
  -- Check if already claimed today
  SELECT id INTO v_existing_claim
  FROM daily_login_rewards
  WHERE user_id = p_user_id AND claim_date = v_today;
  
  IF v_existing_claim IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, TRUE, 0, 'Already claimed today'::TEXT;
    RETURN;
  END IF;
  
  -- Insert the daily login reward
  INSERT INTO daily_login_rewards (user_id, wallet_address, claim_date, amount)
  VALUES (p_user_id, p_wallet_address, v_today, v_reward_amount);
  
  -- Add to pending rewards
  PERFORM add_user_pending_reward(p_user_id, v_reward_amount, 'daily_login');
  
  -- Log the transaction
  INSERT INTO web3_reward_transactions (user_id, reward_type, amount, description, wallet_address)
  VALUES (p_user_id, 'daily_login', v_reward_amount, 'Daily Login Reward from Father Universe', p_wallet_address);
  
  RETURN QUERY SELECT TRUE, FALSE, v_reward_amount, 'Daily login reward claimed!'::TEXT;
END;
$$;

-- Function to check if user can claim daily login reward
CREATE OR REPLACE FUNCTION public.can_claim_daily_login(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM daily_login_rewards
    WHERE user_id = p_user_id AND claim_date = CURRENT_DATE
  );
END;
$$;

-- Function to get daily login stats for admin
CREATE OR REPLACE FUNCTION public.get_daily_login_stats(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(total_claims BIGINT, total_amount BIGINT, unique_users BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_claims,
    COALESCE(SUM(amount), 0)::BIGINT as total_amount,
    COUNT(DISTINCT user_id)::BIGINT as unique_users
  FROM daily_login_rewards
  WHERE claim_date = p_date;
END;
$$;