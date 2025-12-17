-- Create user_rewards table to track pending and claimed amounts
CREATE TABLE public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  pending_amount NUMERIC NOT NULL DEFAULT 0,
  claimed_amount NUMERIC NOT NULL DEFAULT 0,
  total_earned NUMERIC NOT NULL DEFAULT 0,
  daily_claimed NUMERIC NOT NULL DEFAULT 0,
  last_claim_date DATE,
  last_claim_amount NUMERIC DEFAULT 0,
  last_claim_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create daily claim tracking table
CREATE TABLE public.daily_claim_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  claim_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_claimed NUMERIC NOT NULL DEFAULT 0,
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_claim_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards"
ON public.user_rewards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
ON public.user_rewards FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
ON public.user_rewards FOR UPDATE
USING (auth.uid() = user_id);

-- Admin can view all rewards
CREATE POLICY "Admins can view all rewards"
ON public.user_rewards FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for daily_claim_logs
CREATE POLICY "Users can view their own claim logs"
ON public.daily_claim_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claim logs"
ON public.daily_claim_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admin can view all logs
CREATE POLICY "Admins can view all claim logs"
ON public.daily_claim_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_user_rewards_user_id ON public.user_rewards(user_id);
CREATE INDEX idx_user_rewards_wallet ON public.user_rewards(wallet_address);
CREATE INDEX idx_daily_claim_logs_user_date ON public.daily_claim_logs(user_id, claim_date);

-- Function to get or create user rewards record
CREATE OR REPLACE FUNCTION public.get_or_create_user_rewards(p_user_id UUID)
RETURNS public.user_rewards
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rewards public.user_rewards;
BEGIN
  SELECT * INTO v_rewards FROM user_rewards WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_rewards (user_id) VALUES (p_user_id) RETURNING * INTO v_rewards;
  END IF;
  
  RETURN v_rewards;
END;
$$;

-- Function to add pending reward
CREATE OR REPLACE FUNCTION public.add_user_pending_reward(
  p_user_id UUID,
  p_amount NUMERIC,
  p_source TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_pending NUMERIC;
BEGIN
  -- Get or create user rewards
  PERFORM get_or_create_user_rewards(p_user_id);
  
  -- Update pending amount
  UPDATE user_rewards
  SET 
    pending_amount = pending_amount + p_amount,
    total_earned = total_earned + p_amount,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING pending_amount INTO v_new_pending;
  
  RETURN v_new_pending;
END;
$$;

-- Function to claim from pending balance with daily limit check
CREATE OR REPLACE FUNCTION public.claim_from_pending(
  p_user_id UUID,
  p_amount NUMERIC,
  p_wallet_address TEXT
)
RETURNS TABLE(success BOOLEAN, new_pending NUMERIC, new_claimed NUMERIC, daily_remaining NUMERIC, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_pending NUMERIC;
  v_daily_limit NUMERIC := 5000000; -- 5 million CAMLY per day
  v_today_claimed NUMERIC;
  v_last_claim_date DATE;
BEGIN
  -- Get or create user rewards
  PERFORM get_or_create_user_rewards(p_user_id);
  
  -- Get current state
  SELECT pending_amount, daily_claimed, last_claim_date
  INTO v_current_pending, v_today_claimed, v_last_claim_date
  FROM user_rewards
  WHERE user_id = p_user_id;
  
  -- Reset daily claimed if new day
  IF v_last_claim_date IS NULL OR v_last_claim_date < CURRENT_DATE THEN
    v_today_claimed := 0;
  END IF;
  
  -- Check if amount exceeds pending
  IF p_amount > v_current_pending THEN
    RETURN QUERY SELECT FALSE, v_current_pending, 0::NUMERIC, (v_daily_limit - v_today_claimed), 'Insufficient pending balance'::TEXT;
    RETURN;
  END IF;
  
  -- Check daily limit
  IF (v_today_claimed + p_amount) > v_daily_limit THEN
    RETURN QUERY SELECT FALSE, v_current_pending, 0::NUMERIC, (v_daily_limit - v_today_claimed), 'Daily limit exceeded'::TEXT;
    RETURN;
  END IF;
  
  -- Process the claim
  UPDATE user_rewards
  SET 
    pending_amount = pending_amount - p_amount,
    claimed_amount = claimed_amount + p_amount,
    daily_claimed = CASE WHEN last_claim_date = CURRENT_DATE THEN daily_claimed + p_amount ELSE p_amount END,
    last_claim_date = CURRENT_DATE,
    last_claim_amount = p_amount,
    last_claim_at = now(),
    wallet_address = p_wallet_address,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Return success with new values
  RETURN QUERY 
  SELECT 
    TRUE,
    (v_current_pending - p_amount),
    p_amount,
    (v_daily_limit - v_today_claimed - p_amount),
    NULL::TEXT;
END;
$$;

-- Function to get daily remaining limit
CREATE OR REPLACE FUNCTION public.get_daily_claim_remaining(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_daily_limit NUMERIC := 5000000;
  v_today_claimed NUMERIC;
  v_last_claim_date DATE;
BEGIN
  SELECT daily_claimed, last_claim_date INTO v_today_claimed, v_last_claim_date
  FROM user_rewards WHERE user_id = p_user_id;
  
  IF NOT FOUND OR v_last_claim_date IS NULL OR v_last_claim_date < CURRENT_DATE THEN
    RETURN v_daily_limit;
  END IF;
  
  RETURN GREATEST(0, v_daily_limit - COALESCE(v_today_claimed, 0));
END;
$$;

-- Trigger to update updated_at
CREATE TRIGGER update_user_rewards_updated_at
BEFORE UPDATE ON public.user_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();