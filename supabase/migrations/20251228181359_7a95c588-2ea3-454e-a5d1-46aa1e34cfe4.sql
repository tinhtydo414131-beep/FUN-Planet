-- =====================================================
-- FIX CRITICAL SECURITY ISSUES - PROFILES & PRIVATE MESSAGES RLS
-- =====================================================

-- STEP 1: Create a secure view for public profile data (limited fields only)
-- This exposes only non-sensitive fields
DROP VIEW IF EXISTS public_profiles;
CREATE VIEW public_profiles AS
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

-- Grant select on the view to authenticated and anon users
GRANT SELECT ON public_profiles TO authenticated, anon;

-- Note: The profiles table already has "Anyone can view profiles" policy
-- which is needed for profile pages to work. However, we recommend using
-- public_profiles view for listing users to avoid exposing email/wallet info.

-- STEP 2: Verify Private Messages RLS is strict
-- Drop and recreate to ensure explicit check
DROP POLICY IF EXISTS "Users can view their own messages" ON private_messages;

-- Recreate with explicit check
CREATE POLICY "Users can view their own messages" 
ON private_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);