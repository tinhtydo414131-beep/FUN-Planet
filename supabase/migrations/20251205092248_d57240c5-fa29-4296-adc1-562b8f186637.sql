-- Fix profiles table RLS: restrict SELECT to own profile + friends' profiles
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create restrictive policy: users can view own profile or friends' profiles
CREATE POLICY "Users can view own or friends profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.friends
    WHERE (friends.user_id = auth.uid() AND friends.friend_id = profiles.id)
    OR (friends.friend_id = auth.uid() AND friends.user_id = profiles.id)
  )
);

-- Create a secure view for public leaderboards (only non-sensitive data)
CREATE OR REPLACE VIEW public.public_leaderboard AS
SELECT 
  id,
  username,
  avatar_url,
  leaderboard_score,
  total_plays,
  total_likes
FROM public.profiles
ORDER BY leaderboard_score DESC;