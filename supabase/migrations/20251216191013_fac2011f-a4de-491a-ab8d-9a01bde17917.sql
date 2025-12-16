-- Create claim types enum
CREATE TYPE public.claim_type AS ENUM ('first_wallet', 'game_completion', 'game_upload');

-- Create claims tracking table
CREATE TABLE public.camly_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  claim_type claim_type NOT NULL,
  amount NUMERIC NOT NULL,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  game_id UUID REFERENCES uploaded_games(id),
  parent_approval_required BOOLEAN DEFAULT false,
  parent_approved_at TIMESTAMP WITH TIME ZONE,
  parent_approved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.camly_claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own claims"
ON public.camly_claims FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims"
ON public.camly_claims FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update claims"
ON public.camly_claims FOR UPDATE
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all claims"
ON public.camly_claims FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_camly_claims_user_type ON public.camly_claims(user_id, claim_type);
CREATE INDEX idx_camly_claims_wallet ON public.camly_claims(wallet_address);
CREATE INDEX idx_camly_claims_status ON public.camly_claims(status);

-- Function to check if user has claimed today
CREATE OR REPLACE FUNCTION public.has_claimed_today(p_user_id UUID, p_claim_type claim_type)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM camly_claims
    WHERE user_id = p_user_id
    AND claim_type = p_claim_type
    AND status IN ('pending', 'completed')
    AND created_at >= CURRENT_DATE
  );
END;
$$;

-- Function to check if user has ever claimed first wallet reward
CREATE OR REPLACE FUNCTION public.has_claimed_first_wallet(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM camly_claims
    WHERE user_id = p_user_id
    AND claim_type = 'first_wallet'
    AND status = 'completed'
  );
END;
$$;