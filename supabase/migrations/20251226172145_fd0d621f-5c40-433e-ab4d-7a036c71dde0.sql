-- Create table for Angel AI stories (Story Mode)
CREATE TABLE public.angel_ai_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  theme TEXT NOT NULL DEFAULT 'fairy_tale',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for Daily Quiz completions
CREATE TABLE public.daily_quiz_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quiz_date DATE DEFAULT CURRENT_DATE,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 5,
  camly_earned INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, quiz_date)
);

-- Create table for Angel AI achievements
CREATE TABLE public.angel_ai_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

-- Enable RLS on all tables
ALTER TABLE public.angel_ai_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quiz_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.angel_ai_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for angel_ai_stories
CREATE POLICY "Users can view their own stories" ON public.angel_ai_stories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stories" ON public.angel_ai_stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories" ON public.angel_ai_stories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories" ON public.angel_ai_stories
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for daily_quiz_completions
CREATE POLICY "Users can view their own quiz completions" ON public.daily_quiz_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz completions" ON public.daily_quiz_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz completions" ON public.daily_quiz_completions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for angel_ai_achievements
CREATE POLICY "Users can view their own achievements" ON public.angel_ai_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can unlock their own achievements" ON public.angel_ai_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get user's current quiz streak
CREATE OR REPLACE FUNCTION public.get_quiz_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_streak INTEGER := 0;
  v_date DATE := CURRENT_DATE;
BEGIN
  LOOP
    IF EXISTS (
      SELECT 1 FROM daily_quiz_completions 
      WHERE user_id = p_user_id AND quiz_date = v_date
    ) THEN
      v_streak := v_streak + 1;
      v_date := v_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  RETURN v_streak;
END;
$$;

-- Function to complete quiz and award CAMLY
CREATE OR REPLACE FUNCTION public.complete_daily_quiz(
  p_user_id UUID,
  p_score INTEGER,
  p_total_questions INTEGER DEFAULT 5
)
RETURNS TABLE(camly_earned INTEGER, new_streak INTEGER, already_completed BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_id UUID;
  v_streak INTEGER;
  v_camly INTEGER;
BEGIN
  -- Check if already completed today
  SELECT id INTO v_existing_id
  FROM daily_quiz_completions
  WHERE user_id = p_user_id AND quiz_date = CURRENT_DATE;
  
  IF v_existing_id IS NOT NULL THEN
    RETURN QUERY SELECT 0, 0, TRUE;
    RETURN;
  END IF;
  
  -- Calculate streak
  v_streak := get_quiz_streak(p_user_id) + 1;
  
  -- Calculate CAMLY reward (base 1000 + 200 per correct + streak bonus)
  v_camly := 1000 + (p_score * 200) + (v_streak * 100);
  
  -- Insert completion
  INSERT INTO daily_quiz_completions (user_id, score, total_questions, camly_earned, streak_count)
  VALUES (p_user_id, p_score, p_total_questions, v_camly, v_streak);
  
  -- Add to pending rewards
  PERFORM add_user_pending_reward(p_user_id, v_camly, 'daily_quiz');
  
  RETURN QUERY SELECT v_camly, v_streak, FALSE;
END;
$$;