-- Drop and recreate get_public_donors with correct return type for total_donated
DROP FUNCTION IF EXISTS public.get_public_donors(integer);

CREATE OR REPLACE FUNCTION public.get_public_donors(limit_count integer DEFAULT 50)
RETURNS TABLE(
  user_id uuid,
  username text,
  avatar_url text,
  wallet_address text,
  total_donated numeric,
  total_plays bigint,
  games_uploaded bigint,
  is_anonymous boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    CASE WHEN pd.is_anonymous = true THEN 'Anonymous'::text ELSE p.username END as username,
    CASE WHEN pd.is_anonymous = true THEN NULL::text ELSE p.avatar_url END as avatar_url,
    pd.wallet_address::text,
    COALESCE(SUM(pd.amount), 0)::numeric as total_donated,
    COALESCE(p.total_plays, 0)::bigint as total_plays,
    COALESCE(
      (SELECT COUNT(*) FROM uploaded_games ug WHERE ug.user_id = p.id AND ug.status = 'approved'),
      0
    )::bigint as games_uploaded,
    pd.is_anonymous
  FROM platform_donations pd
  LEFT JOIN profiles p ON pd.user_id = p.id
  WHERE NOT EXISTS (
    SELECT 1 FROM admin_blocked_users abu 
    WHERE abu.user_id = p.id AND abu.status = 'blocked'
  )
  GROUP BY p.id, p.username, p.avatar_url, pd.wallet_address, pd.is_anonymous, p.total_plays
  ORDER BY total_donated DESC
  LIMIT limit_count;
END;
$$;