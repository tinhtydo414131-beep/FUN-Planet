-- Drop and recreate get_public_ranking to exclude blocked users
DROP FUNCTION IF EXISTS public.get_public_ranking(int);

CREATE OR REPLACE FUNCTION public.get_public_ranking(limit_count int DEFAULT 10)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  wallet_balance numeric,
  total_plays bigint,
  games_uploaded bigint,
  total_camly numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    COALESCE(p.wallet_balance, 0) as wallet_balance,
    COALESCE(p.total_plays, 0) as total_plays,
    COALESCE(p.games_uploaded, 0) as games_uploaded,
    COALESCE(ur.pending_amount, 0) + COALESCE(ur.claimed_amount, 0) as total_camly
  FROM profiles p
  LEFT JOIN user_rewards ur ON p.id = ur.user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM admin_blocked_users abu 
    WHERE abu.user_id = p.id AND abu.status = 'blocked'
  )
  ORDER BY total_camly DESC
  LIMIT limit_count;
END;
$$;

-- Drop and recreate get_public_donors to exclude blocked users
DROP FUNCTION IF EXISTS public.get_public_donors(int);

CREATE OR REPLACE FUNCTION public.get_public_donors(limit_count int DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  username text,
  avatar_url text,
  total_donated numeric,
  wallet_address text,
  is_anonymous boolean,
  total_plays bigint,
  games_uploaded bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pd.user_id,
    CASE WHEN pd.is_anonymous THEN 'Anonymous' ELSE COALESCE(p.username, 'Unknown') END as username,
    CASE WHEN pd.is_anonymous THEN NULL ELSE p.avatar_url END as avatar_url,
    SUM(pd.amount) as total_donated,
    CASE WHEN pd.is_anonymous THEN NULL ELSE pd.wallet_address END as wallet_address,
    pd.is_anonymous,
    COALESCE(p.total_plays, 0) as total_plays,
    COALESCE(p.games_uploaded, 0) as games_uploaded
  FROM platform_donations pd
  LEFT JOIN profiles p ON pd.user_id = p.id
  WHERE NOT EXISTS (
    SELECT 1 FROM admin_blocked_users abu 
    WHERE abu.user_id = pd.user_id AND abu.status = 'blocked'
  )
  GROUP BY pd.user_id, pd.is_anonymous, pd.wallet_address, p.username, p.avatar_url, p.total_plays, p.games_uploaded
  ORDER BY total_donated DESC
  LIMIT limit_count;
END;
$$;