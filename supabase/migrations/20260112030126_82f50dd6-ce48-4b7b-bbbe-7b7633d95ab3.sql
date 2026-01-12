-- Add is_fraud_suspect column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_fraud_suspect BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fraud_suspect_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fraud_detected_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster fraud suspect queries
CREATE INDEX IF NOT EXISTS idx_profiles_fraud_suspect ON profiles(is_fraud_suspect) WHERE is_fraud_suspect = TRUE;

-- Create function to auto-detect and mark fraud suspects
CREATE OR REPLACE FUNCTION check_and_mark_fraud_suspect(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_fraud BOOLEAN := FALSE;
  v_reason TEXT := '';
BEGIN
  -- Check 1: User trong admin_blocked_users
  IF EXISTS(SELECT 1 FROM admin_blocked_users WHERE user_id = p_user_id AND status = 'blocked') THEN
    v_is_fraud := TRUE;
    v_reason := v_reason || 'Blocked by admin; ';
  END IF;

  -- Check 2: IP trong blacklist
  IF EXISTS(
    SELECT 1 FROM ip_blacklist ibl
    JOIN user_login_history ulh ON ibl.ip_address = ulh.ip_address
    WHERE ulh.user_id = p_user_id AND ibl.is_active = TRUE
  ) THEN
    v_is_fraud := TRUE;
    v_reason := v_reason || 'IP blacklisted; ';
  END IF;

  -- Check 3: Wallet trong blacklist
  IF EXISTS(
    SELECT 1 FROM wallet_blacklist wbl
    JOIN profiles p ON LOWER(wbl.wallet_address) = LOWER(p.wallet_address)
    WHERE p.id = p_user_id AND wbl.is_active = TRUE
  ) THEN
    v_is_fraud := TRUE;
    v_reason := v_reason || 'Wallet blacklisted; ';
  END IF;

  -- Check 4: User trong suspicious_activity_logs với risk_score cao
  IF EXISTS(
    SELECT 1 FROM suspicious_activity_logs 
    WHERE user_id = p_user_id AND risk_score >= 80 AND is_reviewed = FALSE
  ) THEN
    v_is_fraud := TRUE;
    v_reason := v_reason || 'High risk activity detected; ';
  END IF;

  -- Update profiles
  UPDATE profiles 
  SET 
    is_fraud_suspect = v_is_fraud,
    fraud_suspect_reason = NULLIF(TRIM(v_reason), ''),
    fraud_detected_at = CASE WHEN v_is_fraud THEN now() ELSE NULL END
  WHERE id = p_user_id;

  RETURN v_is_fraud;
END;
$$;

-- Create function to get all fraud suspects
CREATE OR REPLACE FUNCTION get_fraud_suspects()
RETURNS TABLE(
  user_id UUID,
  username TEXT,
  email TEXT,
  wallet_address TEXT,
  wallet_balance NUMERIC,
  is_fraud_suspect BOOLEAN,
  fraud_suspect_reason TEXT,
  fraud_detected_at TIMESTAMP WITH TIME ZONE,
  trust_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    p.trust_score,
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

-- Update process_withdrawal_request to use fraud detection and 24h cooldown
CREATE OR REPLACE FUNCTION process_withdrawal_request(
  p_user_id UUID,
  p_amount NUMERIC,
  p_wallet_address TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trust_info jsonb;
  v_trust_score INTEGER;
  v_auto_approve BOOLEAN := FALSE;
  v_withdrawal_id UUID;
  v_current_pending NUMERIC;
  v_last_withdrawal TIMESTAMP WITH TIME ZONE;
  v_daily_count INTEGER;
  v_cooldown_seconds INTEGER := 86400; -- 24 giờ
  v_max_daily INTEGER := 1; -- 1 lần/24h
  v_daily_remaining NUMERIC;
  v_is_fraud_suspect BOOLEAN := FALSE;
  v_fraud_reason TEXT := '';
BEGIN
  -- Lock user row
  SELECT wallet_balance, last_withdrawal_at INTO v_current_pending, v_last_withdrawal
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_current_pending IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Cooldown check (24 giờ)
  IF v_last_withdrawal IS NOT NULL AND 
     v_last_withdrawal > now() - (v_cooldown_seconds || ' seconds')::INTERVAL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Vui lòng đợi ' || CEIL(EXTRACT(EPOCH FROM (v_last_withdrawal + (v_cooldown_seconds || ' seconds')::INTERVAL - now())) / 3600)::TEXT || ' giờ trước khi rút tiếp'
    );
  END IF;

  -- Rate limit (1 lần/24h)
  SELECT COUNT(*) INTO v_daily_count
  FROM withdrawal_requests WHERE user_id = p_user_id AND created_at > now() - INTERVAL '24 hours';

  IF v_daily_count >= v_max_daily THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đã vượt giới hạn 1 lần/24h. Vui lòng quay lại ngày mai.');
  END IF;

  -- Balance check
  IF v_current_pending < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;

  -- Daily limit
  v_daily_remaining := get_daily_claim_remaining(p_user_id);
  IF p_amount > v_daily_remaining THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đã vượt giới hạn hàng ngày.');
  END IF;

  -- Get trust info
  v_trust_info := get_user_trust_info(p_user_id);
  v_trust_score := COALESCE((v_trust_info->>'trust_score')::INTEGER, 0);

  -- ====== FRAUD DETECTION ======
  -- Check 1: User có trong admin_blocked_users (status = 'blocked')?
  IF EXISTS(SELECT 1 FROM admin_blocked_users WHERE user_id = p_user_id AND status = 'blocked') THEN
    v_is_fraud_suspect := TRUE;
    v_fraud_reason := v_fraud_reason || 'Blocked by admin; ';
  END IF;

  -- Check 2: IP của user có trong ip_blacklist (is_active = true)?
  IF NOT v_is_fraud_suspect THEN
    IF EXISTS(
      SELECT 1 FROM ip_blacklist ibl
      JOIN user_login_history ulh ON ibl.ip_address = ulh.ip_address
      WHERE ulh.user_id = p_user_id AND ibl.is_active = TRUE
    ) THEN
      v_is_fraud_suspect := TRUE;
      v_fraud_reason := v_fraud_reason || 'IP blacklisted; ';
    END IF;
  END IF;

  -- Check 3: Wallet của user có trong wallet_blacklist (is_active = true)?
  IF NOT v_is_fraud_suspect THEN
    IF EXISTS(
      SELECT 1 FROM wallet_blacklist wbl
      JOIN profiles p ON LOWER(wbl.wallet_address) = LOWER(p.wallet_address)
      WHERE p.id = p_user_id AND wbl.is_active = TRUE
    ) THEN
      v_is_fraud_suspect := TRUE;
      v_fraud_reason := v_fraud_reason || 'Wallet blacklisted; ';
    END IF;
  END IF;

  -- Check 4: Profile đã đánh dấu là fraud suspect
  IF NOT v_is_fraud_suspect THEN
    SELECT is_fraud_suspect INTO v_is_fraud_suspect FROM profiles WHERE id = p_user_id;
    IF v_is_fraud_suspect THEN
      v_fraud_reason := v_fraud_reason || 'Marked as fraud suspect; ';
    END IF;
  END IF;

  -- ====== AUTO-APPROVE RULES ======
  IF v_is_fraud_suspect THEN
    -- User nghi ngờ gian lận → LUÔN cần admin xét duyệt
    v_auto_approve := FALSE;
  ELSIF p_amount <= 200000 THEN
    -- User bình thường + số tiền ≤ 200k → Auto approve
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 50 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 40 AND p_amount <= 1000000 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 30 AND p_amount <= 500000 THEN
    v_auto_approve := TRUE;
  END IF;

  -- Update last_withdrawal_at
  UPDATE profiles SET last_withdrawal_at = now() WHERE id = p_user_id;

  -- Deduct balance
  UPDATE profiles SET wallet_balance = wallet_balance - p_amount WHERE id = p_user_id;

  UPDATE user_rewards SET 
    pending_amount = pending_amount - p_amount,
    daily_claimed = CASE WHEN last_claim_date = CURRENT_DATE THEN daily_claimed + p_amount ELSE p_amount END,
    last_claim_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (user_id, amount, wallet_address, status, trust_score_at_request, auto_approved, trust_score)
  VALUES (p_user_id, p_amount, p_wallet_address, 
    CASE WHEN v_auto_approve THEN 'approved' ELSE 'pending' END,
    v_trust_score, v_auto_approve, v_trust_score
  )
  RETURNING id INTO v_withdrawal_id;

  -- Notify admin if pending (fraud suspect)
  IF NOT v_auto_approve THEN
    INSERT INTO admin_realtime_notifications (notification_type, title, message, priority, data)
    VALUES ('withdrawal_request', '⚠️ Fraud Suspect Withdrawal', 
      'User nghi ngờ gian lận yêu cầu rút ' || p_amount::TEXT || ' CAMLY. Lý do: ' || COALESCE(v_fraud_reason, 'Unknown'),
      'critical', jsonb_build_object(
        'withdrawal_id', v_withdrawal_id, 
        'user_id', p_user_id, 
        'amount', p_amount,
        'is_fraud_suspect', v_is_fraud_suspect,
        'fraud_reason', v_fraud_reason
      ));
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'auto_approved', v_auto_approve,
    'trust_score', v_trust_score,
    'status', CASE WHEN v_auto_approve THEN 'approved' ELSE 'pending' END,
    'is_fraud_suspect', v_is_fraud_suspect
  );
END;
$$;