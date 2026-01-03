
-- 1. Create ip_blacklist table
CREATE TABLE IF NOT EXISTS public.ip_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index for IP lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_ip_blacklist_address ON public.ip_blacklist(ip_address);

-- Enable RLS
ALTER TABLE public.ip_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS policies for ip_blacklist
CREATE POLICY "Admins can manage ip_blacklist" ON public.ip_blacklist
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 2. Create wallet_blacklist table (if not exists)
CREATE TABLE IF NOT EXISTS public.wallet_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  reason TEXT NOT NULL,
  blocked_by UUID REFERENCES public.profiles(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index for wallet lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_blacklist_address ON public.wallet_blacklist(LOWER(wallet_address));

-- Enable RLS
ALTER TABLE public.wallet_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS policies for wallet_blacklist
CREATE POLICY "Admins can manage wallet_blacklist" ON public.wallet_blacklist
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 3. Create user_login_history table
CREATE TABLE IF NOT EXISTS public.user_login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  device_fingerprint TEXT,
  login_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON public.user_login_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON public.user_login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_at ON public.user_login_history(login_at DESC);

-- Enable RLS
ALTER TABLE public.user_login_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view all login history" ON public.user_login_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert login history" ON public.user_login_history
  FOR INSERT WITH CHECK (true);

-- 4. Create function to detect IP fraud rings from auth.sessions
CREATE OR REPLACE FUNCTION public.detect_ip_fraud_rings(min_accounts INTEGER DEFAULT 3)
RETURNS TABLE(
  ip_address TEXT,
  account_count BIGINT,
  user_ids UUID[],
  usernames TEXT[],
  total_balance NUMERIC,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH session_ips AS (
    SELECT 
      s.ip::TEXT as ip,
      s.user_id,
      s.created_at
    FROM auth.sessions s
    WHERE s.ip IS NOT NULL
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
$$;

-- 5. Create function to get user IP history
CREATE OR REPLACE FUNCTION public.get_user_ip_history(p_user_id UUID)
RETURNS TABLE(
  ip_address TEXT,
  user_agent TEXT,
  login_count BIGINT,
  first_login TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  other_users_on_ip BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_ips AS (
    SELECT 
      lh.ip_address,
      lh.user_agent,
      COUNT(*) as login_count,
      MIN(lh.login_at) as first_login,
      MAX(lh.login_at) as last_login
    FROM user_login_history lh
    WHERE lh.user_id = p_user_id
    GROUP BY lh.ip_address, lh.user_agent
  )
  SELECT 
    ui.ip_address,
    ui.user_agent,
    ui.login_count,
    ui.first_login,
    ui.last_login,
    (SELECT COUNT(DISTINCT lh2.user_id) - 1 
     FROM user_login_history lh2 
     WHERE lh2.ip_address = ui.ip_address) as other_users_on_ip
  FROM user_ips ui
  ORDER BY ui.last_login DESC;
END;
$$;

-- 6. Create function to check IP eligibility
CREATE OR REPLACE FUNCTION public.check_ip_eligibility(p_ip_address TEXT, p_max_accounts INTEGER DEFAULT 2)
RETURNS TABLE(
  is_eligible BOOLEAN,
  reason TEXT,
  existing_accounts INTEGER,
  is_blacklisted BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_blacklisted BOOLEAN;
  v_blacklist_reason TEXT;
  v_account_count INTEGER;
BEGIN
  -- Check if IP is blacklisted
  SELECT ib.is_active, ib.reason INTO v_blacklisted, v_blacklist_reason
  FROM ip_blacklist ib
  WHERE ib.ip_address = p_ip_address AND ib.is_active = true
  LIMIT 1;
  
  IF v_blacklisted THEN
    RETURN QUERY SELECT FALSE, ('IP is blacklisted: ' || v_blacklist_reason)::TEXT, 0, TRUE;
    RETURN;
  END IF;
  
  -- Count existing accounts from this IP
  SELECT COUNT(DISTINCT s.user_id)::INTEGER INTO v_account_count
  FROM auth.sessions s
  WHERE s.ip::TEXT = p_ip_address;
  
  IF v_account_count >= p_max_accounts THEN
    RETURN QUERY SELECT FALSE, 'Maximum accounts reached for this IP'::TEXT, v_account_count, FALSE;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'IP is eligible'::TEXT, v_account_count, FALSE;
END;
$$;

-- 7. Create function to bulk block users by IP
CREATE OR REPLACE FUNCTION public.admin_block_users_by_ip(
  p_ip_address TEXT,
  p_admin_id UUID,
  p_reason TEXT DEFAULT 'Multi-account fraud from same IP'
)
RETURNS TABLE(
  blocked_count INTEGER,
  reset_amount NUMERIC,
  user_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_ids UUID[];
  v_total_balance NUMERIC := 0;
  v_blocked_count INTEGER := 0;
  v_user_id UUID;
BEGIN
  -- Check admin permission
  IF NOT has_role(p_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required';
  END IF;
  
  -- Get all user IDs from this IP
  SELECT array_agg(DISTINCT s.user_id) INTO v_user_ids
  FROM auth.sessions s
  WHERE s.ip::TEXT = p_ip_address;
  
  IF v_user_ids IS NULL OR array_length(v_user_ids, 1) IS NULL THEN
    RETURN QUERY SELECT 0, 0::NUMERIC, ARRAY[]::UUID[];
    RETURN;
  END IF;
  
  -- Block each user and reset their balance
  FOREACH v_user_id IN ARRAY v_user_ids
  LOOP
    -- Get current balance before reset
    SELECT COALESCE(wallet_balance, 0) INTO v_total_balance
    FROM profiles WHERE id = v_user_id;
    
    -- Reset balance
    UPDATE profiles SET wallet_balance = 0 WHERE id = v_user_id;
    UPDATE web3_rewards SET camly_balance = 0 WHERE user_id = v_user_id;
    UPDATE user_rewards SET pending_amount = 0, claimed_amount = 0, total_earned = 0 WHERE user_id = v_user_id;
    
    -- Add to blocked users if not already blocked
    INSERT INTO admin_blocked_users (user_id, blocked_by, reason, evidence)
    VALUES (v_user_id, p_admin_id, p_reason, jsonb_build_object('ip_address', p_ip_address))
    ON CONFLICT (user_id) DO UPDATE SET 
      reason = EXCLUDED.reason,
      evidence = admin_blocked_users.evidence || EXCLUDED.evidence;
    
    v_blocked_count := v_blocked_count + 1;
  END LOOP;
  
  -- Add IP to blacklist
  INSERT INTO ip_blacklist (ip_address, reason, blocked_by)
  VALUES (p_ip_address, p_reason, p_admin_id)
  ON CONFLICT (ip_address) DO UPDATE SET 
    reason = EXCLUDED.reason,
    is_active = true,
    updated_at = now();
  
  -- Log the action
  INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken, resolved_by, resolved_at)
  SELECT 
    unnest(v_user_ids),
    'ip_fraud_ring',
    'Blocked as part of IP fraud ring: ' || p_ip_address,
    0,
    'Account blocked, balance reset to 0',
    p_admin_id,
    now();
  
  RETURN QUERY SELECT v_blocked_count, v_total_balance, v_user_ids;
END;
$$;

-- 8. Create function to get fraud statistics
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH fraud_rings AS (
    SELECT * FROM detect_ip_fraud_rings(3)
  )
  SELECT
    (SELECT COUNT(*) FROM fraud_rings)::BIGINT,
    (SELECT COALESCE(SUM(account_count), 0) FROM fraud_rings)::BIGINT,
    (SELECT COALESCE(SUM(total_balance), 0) FROM fraud_rings)::NUMERIC,
    (SELECT COUNT(*) FROM ip_blacklist WHERE is_active = true)::BIGINT,
    (SELECT COUNT(*) FROM fraud_rings WHERE last_seen > now() - interval '7 days')::BIGINT;
END;
$$;
