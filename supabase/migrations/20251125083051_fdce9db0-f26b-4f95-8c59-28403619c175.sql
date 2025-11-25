-- Create game_progress table to track user's level completion for each game
CREATE TABLE public.game_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  game_id UUID NOT NULL,
  highest_level_completed INTEGER NOT NULL DEFAULT 0,
  total_stars INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Add foreign key to profiles table
ALTER TABLE public.game_progress
ADD CONSTRAINT game_progress_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key to games table
ALTER TABLE public.game_progress
ADD CONSTRAINT game_progress_game_id_fkey 
FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own progress" 
ON public.game_progress 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own progress" 
ON public.game_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress" 
ON public.game_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_game_progress_updated_at
BEFORE UPDATE ON public.game_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better query performance
CREATE INDEX idx_game_progress_user_game ON public.game_progress(user_id, game_id);