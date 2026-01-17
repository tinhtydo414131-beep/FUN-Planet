-- Drop existing functions first to allow signature change
DROP FUNCTION IF EXISTS public.get_public_ranking(integer);
DROP FUNCTION IF EXISTS public.get_public_donors(integer);

-- Recreate get_public_ranking with subquery for games_uploaded
CREATE OR REPLACE FUNCTION public.get_public_ranking(limit_count integer DEFAULT 1000)
RETURNS TABLE(
  user_id uuid,
  username text,
  avatar_url text,
  total_camly bigint,
  total_plays bigint,
  games_uploaded bigint,
  rank bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.username,
    p.avatar_url,
    COALESCE(p.wallet_balance, 0)::bigint as total_camly,
    COALESCE(p.total_plays, 0)::bigint as total_plays,
    COALESCE(
      (SELECT COUNT(*) FROM uploaded_games ug WHERE ug.user_id = p.id AND ug.status = 'approved'),
      0
    )::bigint as games_uploaded,
    ROW_NUMBER() OVER (ORDER BY COALESCE(p.wallet_balance, 0) DESC, p.created_at ASC)::bigint as rank
  FROM profiles p
  WHERE p.username IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM admin_blocked_users abu 
      WHERE abu.user_id = p.id AND abu.status = 'blocked'
    )
  ORDER BY COALESCE(p.wallet_balance, 0) DESC, p.created_at ASC
  LIMIT limit_count;
END;
$$;

-- Recreate get_public_donors with subquery for games_uploaded
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
    CASE WHEN pd.is_anonymous = true THEN 'Anonymous' ELSE p.username END as username,
    CASE WHEN pd.is_anonymous = true THEN NULL ELSE p.avatar_url END as avatar_url,
    pd.wallet_address,
    COALESCE(SUM(pd.amount), 0) as total_donated,
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