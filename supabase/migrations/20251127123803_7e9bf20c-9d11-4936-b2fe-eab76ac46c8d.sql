-- Allow anyone to view game progress for public profiles
CREATE POLICY "Anyone can view game progress"
ON public.game_progress
FOR SELECT
USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own progress" ON public.game_progress;