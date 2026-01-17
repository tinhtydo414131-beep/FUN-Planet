-- First drop the existing functions to allow changing return type
DROP FUNCTION IF EXISTS public.get_fraud_ip_stats();
DROP FUNCTION IF EXISTS public.detect_ip_fraud_rings(INTEGER);

-- Recreate detect_ip_fraud_rings RPC with fixed column name
CREATE OR REPLACE FUNCTION public.detect_ip_fraud_rings(min_accounts INTEGER DEFAULT 3)
RETURNS TABLE(
  fraud_ip TEXT,
  account_count BIGINT,
  user_ids UUID[],
  usernames TEXT[],
  total_balance NUMERIC,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH blocked_user_ids AS (
    SELECT bu.user_id FROM admin_blocked_users bu
  ),
  blacklisted_ip_list AS (
    SELECT bl.ip_address as blocked_ip FROM ip_blacklist bl WHERE bl.is_active = true
  ),
  session_ips AS (
    SELECT 
      s.ip::TEXT as session_ip,
      s.user_id,
      s.created_at
    FROM auth.sessions s
    WHERE s.ip IS NOT NULL
      AND s.user_id NOT IN (SELECT bu.user_id FROM blocked_user_ids bu)
      AND s.ip::TEXT NOT IN (SELECT blocked_ip FROM blacklisted_ip_list)
  ),
  ip_users AS (
    SELECT 
      si.session_ip,
      array_agg(DISTINCT si.user_id) as agg_user_ids,
      COUNT(DISTINCT si.user_id) as user_count,
      MIN(si.created_at) as min_created,
      MAX(si.created_at) as max_created
    FROM session_ips si
    GROUP BY si.session_ip
    HAVING COUNT(DISTINCT si.user_id) >= min_accounts
  )
  SELECT 
    iu.session_ip as fraud_ip,
    iu.user_count as account_count,
    iu.agg_user_ids as user_ids,
    array_agg(DISTINCT p.username) as usernames,
    COALESCE(SUM(p.wallet_balance), 0) as total_balance,
    iu.min_created as first_seen,
    iu.max_created as last_seen
  FROM ip_users iu
  LEFT JOIN profiles p ON p.id = ANY(iu.agg_user_ids)
  GROUP BY iu.session_ip, iu.user_count, iu.agg_user_ids, iu.min_created, iu.max_created
  ORDER BY iu.user_count DESC, total_balance DESC;
END;
$$;

-- Recreate get_fraud_ip_stats RPC
CREATE OR REPLACE FUNCTION public.get_fraud_ip_stats()
RETURNS TABLE(
  total_suspicious_ips BIGINT,
  total_affected_accounts BIGINT,
  total_affected_balance NUMERIC,
  blacklisted_ips BIGINT,
  recent_fraud_rings BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH fraud_rings AS (
    SELECT * FROM detect_ip_fraud_rings(3)
  )
  SELECT
    (SELECT COUNT(*) FROM fraud_rings)::BIGINT,
    (SELECT COALESCE(SUM(fr.account_count), 0) FROM fraud_rings fr)::BIGINT,
    (SELECT COALESCE(SUM(fr.total_balance), 0) FROM fraud_rings fr)::NUMERIC,
    (SELECT COUNT(*) FROM ip_blacklist ibl WHERE ibl.is_active = true)::BIGINT,
    (SELECT COUNT(*) FROM fraud_rings fr WHERE fr.last_seen > now() - interval '7 days')::BIGINT;
END;
$$;