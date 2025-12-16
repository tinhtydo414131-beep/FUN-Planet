-- Add missing columns to web3_reward_transactions table
ALTER TABLE public.web3_reward_transactions 
ADD COLUMN IF NOT EXISTS wallet_address text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tx_hash text;

-- Create index for wallet_address lookups
CREATE INDEX IF NOT EXISTS idx_web3_reward_transactions_wallet_address 
ON public.web3_reward_transactions(wallet_address);

-- Create index for reward_type and created_at for daily check-in queries
CREATE INDEX IF NOT EXISTS idx_web3_reward_transactions_type_date 
ON public.web3_reward_transactions(reward_type, created_at);

-- Create a pending_rewards table to track unclaimed rewards
CREATE TABLE IF NOT EXISTS public.pending_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  source text NOT NULL, -- 'game_play', 'upload', 'bonus', etc.
  game_id uuid REFERENCES public.uploaded_games(id) ON DELETE SET NULL,
  claimed boolean NOT NULL DEFAULT false,
  claimed_at timestamp with time zone,
  tx_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on pending_rewards
ALTER TABLE public.pending_rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pending_rewards
CREATE POLICY "Users can view their own pending rewards by wallet" 
ON public.pending_rewards 
FOR SELECT 
USING (wallet_address = (SELECT wallet_address FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can view their own pending rewards by user_id" 
ON public.pending_rewards 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "System can insert pending rewards" 
ON public.pending_rewards 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own pending rewards" 
ON public.pending_rewards 
FOR UPDATE 
USING (user_id = auth.uid() OR wallet_address = (SELECT wallet_address FROM public.profiles WHERE id = auth.uid()));

-- Create function to add pending rewards
CREATE OR REPLACE FUNCTION public.add_pending_reward(
  p_wallet_address text,
  p_amount numeric,
  p_source text,
  p_user_id uuid DEFAULT NULL,
  p_game_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_id uuid;
BEGIN
  INSERT INTO pending_rewards (wallet_address, user_id, amount, source, game_id)
  VALUES (p_wallet_address, p_user_id, p_amount, p_source, p_game_id)
  RETURNING id INTO v_reward_id;
  
  RETURN v_reward_id;
END;
$$;

-- Create function to get total pending rewards for a wallet
CREATE OR REPLACE FUNCTION public.get_pending_rewards_total(p_wallet_address text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM pending_rewards
  WHERE wallet_address = p_wallet_address AND claimed = false;
  
  RETURN v_total;
END;
$$;

-- Create function to mark rewards as claimed
CREATE OR REPLACE FUNCTION public.claim_pending_rewards(
  p_wallet_address text,
  p_tx_hash text
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total numeric;
BEGIN
  -- Get total before claiming
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM pending_rewards
  WHERE wallet_address = p_wallet_address AND claimed = false;
  
  -- Mark all pending rewards as claimed
  UPDATE pending_rewards
  SET claimed = true,
      claimed_at = now(),
      tx_hash = p_tx_hash,
      updated_at = now()
  WHERE wallet_address = p_wallet_address AND claimed = false;
  
  RETURN v_total;
END;
$$;