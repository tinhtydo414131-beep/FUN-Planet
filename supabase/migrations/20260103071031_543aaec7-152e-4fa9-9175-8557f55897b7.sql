-- Create wallet_history table for tracking wallet changes
CREATE TABLE public.wallet_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  previous_wallet TEXT,
  action TEXT NOT NULL, -- 'connected', 'changed', 'disconnected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_wallet_history_user_id ON public.wallet_history(user_id);
CREATE INDEX idx_wallet_history_action ON public.wallet_history(action);
CREATE INDEX idx_wallet_history_created_at ON public.wallet_history(created_at);

-- Enable RLS
ALTER TABLE public.wallet_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet history
CREATE POLICY "Users can view own wallet history" 
  ON public.wallet_history FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can insert their own wallet history (for RPC function)
CREATE POLICY "Users can insert own wallet history" 
  ON public.wallet_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all wallet history
CREATE POLICY "Admins can view all wallet history" 
  ON public.wallet_history FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing data: create initial 'connected' records for users with wallets
INSERT INTO public.wallet_history (user_id, wallet_address, action)
SELECT id, wallet_address, 'connected'
FROM public.profiles
WHERE wallet_address IS NOT NULL AND wallet_address != '';