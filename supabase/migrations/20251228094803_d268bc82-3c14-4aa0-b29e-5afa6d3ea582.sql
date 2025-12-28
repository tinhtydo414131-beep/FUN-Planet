-- Create platform_donations table for FUN Planet donations
CREATE TABLE public.platform_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount >= 1000),
  message text,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_donations ENABLE ROW LEVEL SECURITY;

-- Everyone can view donations (for leaderboard)
CREATE POLICY "Anyone can view donations" ON public.platform_donations
  FOR SELECT USING (true);

-- Authenticated users can donate
CREATE POLICY "Authenticated users can donate" ON public.platform_donations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_platform_donations_user ON public.platform_donations(user_id);
CREATE INDEX idx_platform_donations_amount ON public.platform_donations(amount DESC);
CREATE INDEX idx_platform_donations_created ON public.platform_donations(created_at DESC);