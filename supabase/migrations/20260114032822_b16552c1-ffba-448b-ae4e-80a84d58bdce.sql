-- Gem Fusion Quest Progress Table
CREATE TABLE public.gem_fusion_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Player Stats
  lives INT DEFAULT 5,
  stars INT DEFAULT 0,
  coins INT DEFAULT 100,
  
  -- Progress
  current_level INT DEFAULT 1,
  current_world INT DEFAULT 1,
  unlocked_worlds INT[] DEFAULT ARRAY[1],
  
  -- Boosters
  booster_hammer INT DEFAULT 3,
  booster_extra_moves INT DEFAULT 2,
  booster_rainbow INT DEFAULT 1,
  booster_fish_swarm INT DEFAULT 2,
  
  -- Settings
  sound_enabled BOOLEAN DEFAULT true,
  music_enabled BOOLEAN DEFAULT true,
  
  -- Daily Rewards
  last_daily_reward TIMESTAMPTZ,
  daily_streak INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Level Progress Table
CREATE TABLE public.gem_fusion_level_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  level_id INT NOT NULL,
  stars INT DEFAULT 0,
  high_score INT DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, level_id)
);

-- Enable RLS
ALTER TABLE public.gem_fusion_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gem_fusion_level_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gem_fusion_progress
CREATE POLICY "Users can view own progress" ON public.gem_fusion_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.gem_fusion_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.gem_fusion_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for gem_fusion_level_progress
CREATE POLICY "Users can view own level progress" ON public.gem_fusion_level_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own level progress" ON public.gem_fusion_level_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own level progress" ON public.gem_fusion_level_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_gem_fusion_progress_updated_at
  BEFORE UPDATE ON public.gem_fusion_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();