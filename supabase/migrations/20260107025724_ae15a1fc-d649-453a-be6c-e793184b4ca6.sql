CREATE OR REPLACE FUNCTION public.detect_ip_fraud_rings(min_accounts integer DEFAULT 3)
RETURNS TABLE(ip_address text, account_count bigint, user_ids uuid[], usernames text[], total_balance numeric, first_seen timestamp with time zone, last_seen timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH blocked_user_ids AS (
    -- Lấy danh sách user_ids đã bị blocked
    SELECT user_id FROM admin_blocked_users
  ),
  blacklisted_ips AS (
    -- Lấy danh sách IPs đã bị blacklist
    SELECT bl.ip_address FROM ip_blacklist bl WHERE bl.is_active = true
  ),
  session_ips AS (
    SELECT 
      s.ip::TEXT as ip,
      s.user_id,
      s.created_at
    FROM auth.sessions s
    WHERE s.ip IS NOT NULL
      -- Loại trừ users đã bị blocked
      AND s.user_id NOT IN (SELECT user_id FROM blocked_user_ids)
      -- Loại trừ IPs đã bị blacklist
      AND s.ip::TEXT NOT IN (SELECT ip_address FROM blacklisted_ips)
  ),
  ip_users AS (
    SELECT 
      si.ip,
      array_agg(DISTINCT si.user_id) as user_ids,
      COUNT(DISTINCT si.user_id) as user_count,
      MIN(si.created_at) as first_seen,
      MAX(si.created_at) as last_seen
    FROM session_ips si
    GROUP BY si.ip
    HAVING COUNT(DISTINCT si.user_id) >= min_accounts
  )
  SELECT 
    iu.ip as ip_address,
    iu.user_count as account_count,
    iu.user_ids,
    array_agg(DISTINCT p.username) as usernames,
    COALESCE(SUM(p.wallet_balance), 0) as total_balance,
    iu.first_seen,
    iu.last_seen
  FROM ip_users iu
  LEFT JOIN profiles p ON p.id = ANY(iu.user_ids)
  GROUP BY iu.ip, iu.user_count, iu.user_ids, iu.first_seen, iu.last_seen
  ORDER BY iu.user_count DESC, total_balance DESC;
END;
$function$;