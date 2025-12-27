-- =====================================================
-- CAMLY Playtime Reward System - Database Tables
-- =====================================================

-- 1. User Game Plays - Track individual game sessions
CREATE TABLE public.user_game_plays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'uploaded', -- 'uploaded' or 'builtin'
  first_play_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_play_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_play_seconds INTEGER NOT NULL DEFAULT 0,
  session_count INTEGER NOT NULL DEFAULT 1,
  new_game_reward_claimed BOOLEAN NOT NULL DEFAULT false,
  new_game_reward_amount INTEGER NOT NULL DEFAULT 0,
  total_time_rewards INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id, game_type)
);

-- 2. Daily Play Rewards - Track daily limits by age group
CREATE TABLE public.daily_play_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_date DATE NOT NULL DEFAULT CURRENT_DATE,
  new_game_rewards_earned INTEGER NOT NULL DEFAULT 0,
  new_game_count INTEGER NOT NULL DEFAULT 0,
  time_rewards_earned INTEGER NOT NULL DEFAULT 0,
  total_play_minutes INTEGER NOT NULL DEFAULT 0,
  age_group TEXT DEFAULT '18+',
  daily_cap INTEGER NOT NULL DEFAULT 60000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, reward_date)
);

-- 3. Creator Earnings - Track passive income for game creators
CREATE TABLE public.creator_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  game_id UUID NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'uploaded',
  upload_bonus_claimed BOOLEAN NOT NULL DEFAULT false,
  upload_bonus_amount INTEGER NOT NULL DEFAULT 0,
  first_plays_count INTEGER NOT NULL DEFAULT 0,
  first_play_earnings INTEGER NOT NULL DEFAULT 0,
  total_play_minutes INTEGER NOT NULL DEFAULT 0,
  royalty_earnings INTEGER NOT NULL DEFAULT 0,
  milestone_100_claimed BOOLEAN NOT NULL DEFAULT false,
  milestone_500_claimed BOOLEAN NOT NULL DEFAULT false,
  milestone_1000_claimed BOOLEAN NOT NULL DEFAULT false,
  total_milestone_earnings INTEGER NOT NULL DEFAULT 0,
  daily_earnings_today INTEGER NOT NULL DEFAULT 0,
  last_daily_reset DATE DEFAULT CURRENT_DATE,
  total_earnings INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_id, game_id, game_type)
);

-- 4. Play Sessions - Track individual sessions for anti-abuse
CREATE TABLE public.play_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL,
  game_type TEXT NOT NULL DEFAULT 'uploaded',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  rewards_earned INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_game_plays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_play_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_game_plays
CREATE POLICY "Users can view their own game plays"
  ON public.user_game_plays FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game plays"
  ON public.user_game_plays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game plays"
  ON public.user_game_plays FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for daily_play_rewards
CREATE POLICY "Users can view their own daily rewards"
  ON public.daily_play_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily rewards"
  ON public.daily_play_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily rewards"
  ON public.daily_play_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for creator_earnings
CREATE POLICY "Creators can view their own earnings"
  ON public.creator_earnings FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "System can insert creator earnings"
  ON public.creator_earnings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update creator earnings"
  ON public.creator_earnings FOR UPDATE
  USING (true);

-- RLS Policies for play_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.play_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.play_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.play_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert default reward_multiplier into admin_settings
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('reward_multiplier', '{"player": 1.0, "creator": 1.0, "enabled": true}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert reward configuration
INSERT INTO public.admin_settings (setting_key, setting_value)
VALUES ('playtime_rewards_config', '{
  "player": {
    "new_game_bonus": 10000,
    "max_new_game_bonuses": 2,
    "camly_per_minute": 500,
    "min_session_seconds": 60,
    "afk_timeout_seconds": 120,
    "cooldown_seconds": 60
  },
  "creator": {
    "upload_bonus": 500000,
    "first_play_bonus": 100,
    "royalty_per_minute": 50,
    "daily_cap": 200000,
    "milestones": {
      "100": 50000,
      "500": 150000,
      "1000": 300000
    }
  },
  "age_limits": {
    "3-6": {"max_minutes": 30, "max_camly": 15000},
    "7-12": {"max_minutes": 60, "max_camly": 30000},
    "13-17": {"max_minutes": 90, "max_camly": 45000},
    "18+": {"max_minutes": 120, "max_camly": 60000}
  }
}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX idx_user_game_plays_user_id ON public.user_game_plays(user_id);
CREATE INDEX idx_user_game_plays_game_id ON public.user_game_plays(game_id);
CREATE INDEX idx_daily_play_rewards_user_date ON public.daily_play_rewards(user_id, reward_date);
CREATE INDEX idx_creator_earnings_creator_id ON public.creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_game_id ON public.creator_earnings(game_id);
CREATE INDEX idx_play_sessions_user_id ON public.play_sessions(user_id);
CREATE INDEX idx_play_sessions_game_id ON public.play_sessions(game_id);

-- Enable realtime for play_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.play_sessions;