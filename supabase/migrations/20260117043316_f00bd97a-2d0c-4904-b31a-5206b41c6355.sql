-- Fix admin_block_users_by_ip to use correct status value ('blocked' instead of 'active')
CREATE OR REPLACE FUNCTION public.admin_block_users_by_ip(
  p_ip_address TEXT,
  p_admin_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT 'Blocked by admin'
)
RETURNS TABLE(
  blocked_count INTEGER,
  blacklisted BOOLEAN,
  user_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_ids UUID[];
  v_blocked_count INTEGER := 0;
  v_ip_with_cidr TEXT;
BEGIN
  -- Normalize IP
  v_ip_with_cidr := CASE 
    WHEN p_ip_address LIKE '%/%' THEN p_ip_address
    ELSE p_ip_address || '/32'
  END;

  -- Get all user IDs from sessions with this IP using host() function
  SELECT array_agg(DISTINCT s.user_id) INTO v_user_ids
  FROM auth.sessions s
  WHERE host(s.ip) = p_ip_address
     OR s.ip::TEXT = v_ip_with_cidr;
  
  -- Block each user with correct status value
  IF v_user_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_user_ids, 1) LOOP
      INSERT INTO admin_blocked_users (user_id, blocked_by, reason, status)
      VALUES (v_user_ids[i], COALESCE(p_admin_id, '00000000-0000-0000-0000-000000000000'::UUID), p_reason, 'blocked')
      ON CONFLICT (user_id) DO UPDATE SET 
        status = 'blocked',
        reason = p_reason,
        unblocked_at = NULL;
      v_blocked_count := v_blocked_count + 1;
    END LOOP;
  END IF;
  
  -- Add IP to blacklist
  INSERT INTO ip_blacklist (ip_address, reason, is_active, blocked_by)
  VALUES (p_ip_address, p_reason, true, p_admin_id)
  ON CONFLICT (ip_address) DO UPDATE SET 
    is_active = true,
    reason = p_reason,
    blocked_by = p_admin_id;
  
  RETURN QUERY SELECT v_blocked_count, TRUE, v_user_ids;
END;
$$;