-- Fix SECURITY DEFINER view issue
-- Recreate view with SECURITY INVOKER (default, but explicit)
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id, 
  username, 
  avatar_url, 
  cover_url,
  bio,
  created_at,
  total_plays,
  total_likes,
  total_friends,
  leaderboard_score
FROM profiles;

-- Grant select on the view
GRANT SELECT ON public_profiles TO authenticated, anon;