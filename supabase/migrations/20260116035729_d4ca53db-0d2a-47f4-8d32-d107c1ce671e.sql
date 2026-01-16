-- Create RPC function to get public donors with full info for FUN PLANET LEGENDS
-- Bypasses RLS to fetch donor profiles with extended stats
CREATE OR REPLACE FUNCTION public.get_public_donors(limit_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  wallet_address text,
  total_donated numeric,
  is_anonymous boolean,
  total_plays int,
  games_uploaded int
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    p.id,
    CASE WHEN COALESCE(d.is_anonymous, false) THEN 'Anonymous' ELSE COALESCE(p.username, 'Unknown') END as username,
    CASE WHEN COALESCE(d.is_anonymous, false) THEN NULL ELSE p.avatar_url END as avatar_url,
    CASE WHEN COALESCE(d.is_anonymous, false) THEN NULL ELSE p.wallet_address END as wallet_address,
    d.total_donated,
    COALESCE(d.is_anonymous, false) as is_anonymous,
    COALESCE(p.total_plays, 0)::int as total_plays,
    COALESCE(
      (SELECT COUNT(*) FROM uploaded_games ug WHERE ug.user_id = p.id AND ug.status = 'approved'),
      0
    )::int as games_uploaded
  FROM (
    -- Aggregate donations per user
    SELECT 
      pd.user_id,
      SUM(pd.amount) as total_donated,
      BOOL_OR(pd.is_anonymous) as is_anonymous
    FROM platform_donations pd
    GROUP BY pd.user_id
  ) d
  JOIN profiles p ON p.id = d.user_id
  ORDER BY d.total_donated DESC
  LIMIT limit_count;
$$;