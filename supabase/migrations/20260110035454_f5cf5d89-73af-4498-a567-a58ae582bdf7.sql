-- Fix 1: Recreate leaderboard_stats view with SECURITY INVOKER
-- This fixes SUPA_security_definer_view error
DROP VIEW IF EXISTS public.leaderboard_stats;

CREATE OR REPLACE VIEW public.leaderboard_stats
WITH (security_invoker = true) AS
SELECT
    p.id AS user_id,
    p.username,
    p.avatar_url,
    p.wallet_address,
    COALESCE(p.wallet_balance, 0::numeric) AS pending_balance,
    COALESCE(ur.claimed_amount, 0::numeric) AS total_claimed,
    COALESCE(p.wallet_balance, 0::numeric) + COALESCE(ur.claimed_amount, 0::numeric) AS total_earned
FROM profiles p
LEFT JOIN user_rewards ur ON ur.user_id = p.id
ORDER BY (COALESCE(p.wallet_balance, 0::numeric) + COALESCE(ur.claimed_amount, 0::numeric)) DESC;

-- Fix 2: Tighten user_rewards RLS policies
-- Remove overly permissive public SELECT policies
DROP POLICY IF EXISTS "Allow public read for user_rewards" ON public.user_rewards;
DROP POLICY IF EXISTS "Anyone can view rewards for leaderboard" ON public.user_rewards;

-- The remaining policies are:
-- "Users can view their own rewards" - owner access
-- "Admins can view all rewards" - admin access
-- "Users can insert their own rewards" - owner insert
-- "Users can update their own rewards" - owner update

-- Grant SELECT on leaderboard_stats to anon for public leaderboard display
-- This safely exposes only the view's limited data, not the full table
GRANT SELECT ON public.leaderboard_stats TO anon;
GRANT SELECT ON public.leaderboard_stats TO authenticated;