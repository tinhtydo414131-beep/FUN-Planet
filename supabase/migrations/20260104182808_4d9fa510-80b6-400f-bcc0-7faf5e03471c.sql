-- Create weekly_summary_logs table for tracking sent summaries
CREATE TABLE public.weekly_summary_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  games_played INTEGER DEFAULT 0,
  camly_earned NUMERIC DEFAULT 0,
  new_achievements INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE public.weekly_summary_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own summaries
CREATE POLICY "Users can view their own weekly summaries"
ON public.weekly_summary_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Admin can insert summaries for all users
CREATE POLICY "Service role can insert weekly summaries"
ON public.weekly_summary_logs
FOR INSERT
WITH CHECK (true);

-- Enable realtime for weekly_summary_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.weekly_summary_logs;