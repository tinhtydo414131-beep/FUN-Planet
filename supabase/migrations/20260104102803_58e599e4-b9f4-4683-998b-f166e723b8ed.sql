-- Create table for game achievements (separate from angel_ai_achievements)
CREATE TABLE public.game_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  progress INTEGER DEFAULT 0,
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS
ALTER TABLE public.game_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own achievements" 
ON public.game_achievements FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock their own achievements" 
ON public.game_achievements FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements" 
ON public.game_achievements FOR UPDATE 
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_game_achievements_user_id ON public.game_achievements(user_id);
CREATE INDEX idx_game_achievements_type ON public.game_achievements(achievement_type);