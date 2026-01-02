
-- Fix security warning: Drop SECURITY DEFINER view and recreate as normal view
DROP VIEW IF EXISTS public.leaderboard_stats;

-- Recreate view without SECURITY DEFINER (default is SECURITY INVOKER which is safe)
CREATE VIEW public.leaderboard_stats AS
SELECT 
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.wallet_address,
  COALESCE(p.wallet_balance, 0) as pending_balance,
  COALESCE(ur.claimed_amount, 0) as total_claimed,
  COALESCE(p.wallet_balance, 0) + COALESCE(ur.claimed_amount, 0) as total_earned
FROM profiles p
LEFT JOIN user_rewards ur ON ur.user_id = p.id
ORDER BY COALESCE(p.wallet_balance, 0) + COALESCE(ur.claimed_amount, 0) DESC;

-- Grant select on the view to authenticated users
GRANT SELECT ON public.leaderboard_stats TO authenticated;
GRANT SELECT ON public.leaderboard_stats TO anon;
