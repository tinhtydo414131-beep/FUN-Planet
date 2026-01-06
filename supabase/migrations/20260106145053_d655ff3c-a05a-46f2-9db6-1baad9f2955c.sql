-- Phase 1: Behavior-based Rewards Table
-- Stores rewards for kindness, sharing, cooperation, learning behaviors

CREATE TABLE public.behavior_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  behavior_type TEXT NOT NULL CHECK (behavior_type IN ('kindness', 'sharing', 'cooperation', 'learning', 'game_complete', 'milestone')),
  amount INTEGER NOT NULL DEFAULT 0,
  detected_by TEXT DEFAULT 'ai_angel' CHECK (detected_by IN ('ai_angel', 'parent', 'community', 'system')),
  game_id UUID REFERENCES public.uploaded_games(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.behavior_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own behavior rewards
CREATE POLICY "Users can view own behavior rewards"
ON public.behavior_rewards
FOR SELECT
USING (auth.uid() = user_id);

-- System can insert behavior rewards (via service role or triggers)
CREATE POLICY "System can insert behavior rewards"
ON public.behavior_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_behavior_rewards_user_id ON public.behavior_rewards(user_id);
CREATE INDEX idx_behavior_rewards_type ON public.behavior_rewards(behavior_type);
CREATE INDEX idx_behavior_rewards_created ON public.behavior_rewards(created_at DESC);

-- Add comment
COMMENT ON TABLE public.behavior_rewards IS '5D Light Economy: Rewards for VALUE (kindness, sharing, cooperation, learning) not TIME';