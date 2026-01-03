-- Create wallet_reset_requests table for users who need admin help to change wallet
CREATE TABLE public.wallet_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_wallet TEXT,
  requested_wallet TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.wallet_reset_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own wallet reset requests"
ON public.wallet_reset_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own requests
CREATE POLICY "Users can create wallet reset requests"
ON public.wallet_reset_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all requests (using admin_blocked_users to check if user is admin - they can insert there)
CREATE POLICY "Admins can view all wallet reset requests"
ON public.wallet_reset_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update requests
CREATE POLICY "Admins can update wallet reset requests"
ON public.wallet_reset_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_wallet_reset_requests_status ON public.wallet_reset_requests(status);
CREATE INDEX idx_wallet_reset_requests_user_id ON public.wallet_reset_requests(user_id);