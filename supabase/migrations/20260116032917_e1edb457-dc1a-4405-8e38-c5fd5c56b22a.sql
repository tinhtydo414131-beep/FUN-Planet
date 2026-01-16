-- Create RPC function to get public ranking data (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_public_ranking(limit_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  wallet_balance numeric,
  pending_amount numeric,
  claimed_amount numeric,
  total_camly numeric,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    COALESCE(p.username, 'Unknown')::text,
    p.avatar_url::text,
    COALESCE(p.wallet_balance, 0)::numeric,
    COALESCE(ur.pending_amount, 0)::numeric,
    COALESCE(ur.claimed_amount, 0)::numeric,
    (COALESCE(ur.pending_amount, 0) + COALESCE(ur.claimed_amount, 0))::numeric as total_camly,
    p.created_at
  FROM profiles p
  LEFT JOIN user_rewards ur ON p.id = ur.user_id
  ORDER BY total_camly DESC
  LIMIT limit_count;
END;
$$;

-- Grant execute to both anon and authenticated roles for leaderboard access
GRANT EXECUTE ON FUNCTION public.get_public_ranking(int) TO anon, authenticated;