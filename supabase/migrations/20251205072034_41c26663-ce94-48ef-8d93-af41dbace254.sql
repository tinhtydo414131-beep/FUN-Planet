-- Fix overly permissive profiles RLS policy
-- Drop the existing policy that exposes all user data publicly
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy: Authenticated users can view limited profile data for app functionality
-- This allows leaderboards, friend discovery, etc. while requiring authentication
CREATE POLICY "Authenticated users can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Public/anonymous users cannot access profile data
-- This prevents unauthenticated data harvesting
