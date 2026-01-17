-- Drop existing function with old return type first
DROP FUNCTION IF EXISTS public.admin_block_users_by_ip(TEXT, UUID, TEXT);

-- Fix check_ip_eligibility to handle CIDR notation properly
CREATE OR REPLACE FUNCTION public.check_ip_eligibility(
  p_ip_address TEXT,
  p_max_accounts INTEGER DEFAULT 2
)
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
  v_ip_with_cidr TEXT;
BEGIN
  -- Normalize IP: add /32 if not present for comparison
  v_ip_with_cidr := CASE 
    WHEN p_ip_address LIKE '%/%' THEN p_ip_address
    ELSE p_ip_address || '/32'
  END;
  
  -- Check if IP is blacklisted (check both formats)
  SELECT ib.is_active, ib.reason INTO v_blacklisted, v_blacklist_reason
  FROM ip_blacklist ib
  WHERE (ib.ip_address = p_ip_address OR ib.ip_address = v_ip_with_cidr) 
    AND ib.is_active = true
  LIMIT 1;
  
  IF v_blacklisted THEN
    RETURN QUERY SELECT FALSE, ('IP is blacklisted: ' || COALESCE(v_blacklist_reason, 'Blocked'))::TEXT, 0, TRUE;
    RETURN;
  END IF;
  
  -- Count existing accounts using host() function to extract IP without CIDR mask
  SELECT COUNT(DISTINCT s.user_id)::INTEGER INTO v_account_count
  FROM auth.sessions s
  WHERE host(s.ip) = p_ip_address
     OR s.ip::TEXT = v_ip_with_cidr;
  
  IF v_account_count >= p_max_accounts THEN
    RETURN QUERY SELECT FALSE, 'Maximum accounts reached for this IP'::TEXT, v_account_count, FALSE;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, 'IP is eligible'::TEXT, v_account_count, FALSE;
END;
$$;

-- Recreate admin_block_users_by_ip with fixed IP matching
CREATE FUNCTION public.admin_block_users_by_ip(
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
  
  -- Block each user if not already blocked
  IF v_user_ids IS NOT NULL THEN
    FOR i IN 1..array_length(v_user_ids, 1) LOOP
      INSERT INTO admin_blocked_users (user_id, blocked_by, reason, status)
      VALUES (v_user_ids[i], COALESCE(p_admin_id, '00000000-0000-0000-0000-000000000000'::UUID), p_reason, 'active')
      ON CONFLICT (user_id) DO UPDATE SET 
        status = 'active',
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