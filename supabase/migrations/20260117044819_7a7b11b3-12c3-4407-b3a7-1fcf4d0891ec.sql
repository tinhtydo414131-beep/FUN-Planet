-- Drop and recreate get_fraud_suspects RPC - remove non-existent trust_score column
DROP FUNCTION IF EXISTS public.get_fraud_suspects();

CREATE FUNCTION public.get_fraud_suspects()
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  email TEXT,
  wallet_address TEXT,
  wallet_balance NUMERIC,
  is_fraud_suspect BOOLEAN,
  fraud_suspect_reason TEXT,
  fraud_detected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
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
    p.email,
    p.wallet_address,
    p.wallet_balance,
    p.is_fraud_suspect,
    p.fraud_suspect_reason,
    p.fraud_detected_at,
    p.created_at
  FROM profiles p
  WHERE p.is_fraud_suspect = TRUE
     OR EXISTS(SELECT 1 FROM admin_blocked_users abu WHERE abu.user_id = p.id AND abu.status = 'blocked')
     OR EXISTS(
       SELECT 1 FROM ip_blacklist ibl
       JOIN user_login_history ulh ON ibl.ip_address = ulh.ip_address
       WHERE ulh.user_id = p.id AND ibl.is_active = TRUE
     )
     OR EXISTS(
       SELECT 1 FROM wallet_blacklist wbl
       WHERE LOWER(wbl.wallet_address) = LOWER(p.wallet_address) AND wbl.is_active = TRUE
     )
  ORDER BY p.fraud_detected_at DESC NULLS LAST, p.wallet_balance DESC;
END;
$$;