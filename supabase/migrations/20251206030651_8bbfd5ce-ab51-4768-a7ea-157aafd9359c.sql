-- Drop the overly permissive policy that exposes all users' crypto balances
DROP POLICY IF EXISTS "Anyone can view rewards for leaderboard" ON public.web3_rewards;

-- Create a secure leaderboard view that only exposes safe data (username, avatar, balance)
CREATE OR REPLACE VIEW public.camly_leaderboard WITH (security_invoker = true) AS
SELECT 
  p.id as user_id,
  p.username, 
  p.avatar_url, 
  wr.camly_balance
FROM public.web3_rewards wr
JOIN public.profiles p ON wr.user_id = p.id
ORDER BY wr.camly_balance DESC 
LIMIT 100;

-- Grant access to the leaderboard view
GRANT SELECT ON public.camly_leaderboard TO authenticated;
GRANT SELECT ON public.camly_leaderboard TO anon;