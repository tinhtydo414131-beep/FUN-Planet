
-- Update process_withdrawal_request to remove trust score requirements
-- Auto-approve for all normal users, only pending for fraud suspects

CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pending_amount NUMERIC;
  v_claimed_amount NUMERIC;
  v_is_fraud_suspect BOOLEAN := FALSE;
  v_fraud_reason TEXT := NULL;
  v_auto_approve BOOLEAN := FALSE;
  v_request_id UUID;
  v_last_claim TIMESTAMPTZ;
  v_cooldown_seconds INTEGER := 86400; -- 24 hours cooldown
  v_daily_remaining NUMERIC;
  v_result JSONB;
BEGIN
  -- Get user's current balance
  SELECT pending_amount, claimed_amount 
  INTO v_pending_amount, v_claimed_amount
  FROM user_rewards
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_pending_amount IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User rewards not found');
  END IF;

  -- Check if amount is valid
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  IF p_amount > v_pending_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Check cooldown (last completed claim)
  SELECT MAX(claimed_at) INTO v_last_claim
  FROM camly_claims
  WHERE user_id = p_user_id
  AND status IN ('completed', 'pending', 'approved');

  IF v_last_claim IS NOT NULL AND 
     EXTRACT(EPOCH FROM (NOW() - v_last_claim)) < v_cooldown_seconds THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Cooldown active',
      'cooldown_remaining', v_cooldown_seconds - EXTRACT(EPOCH FROM (NOW() - v_last_claim))::INTEGER
    );
  END IF;

  -- Check daily limit
  SELECT (get_daily_claim_remaining(p_user_id)->'daily_remaining')::NUMERIC INTO v_daily_remaining;
  
  IF v_daily_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily limit reached');
  END IF;

  IF p_amount > v_daily_remaining THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount exceeds daily limit', 'daily_remaining', v_daily_remaining);
  END IF;

  -- ========== FRAUD DETECTION (KEPT) ==========
  
  -- Check admin_blocked_users
  IF EXISTS (
    SELECT 1 FROM admin_blocked_users 
    WHERE user_id = p_user_id AND status = 'blocked'
  ) THEN
    v_is_fraud_suspect := TRUE;
    v_fraud_reason := COALESCE(v_fraud_reason || '; ', '') || 'Blocked by admin';
  END IF;

  -- Check ip_blacklist
  IF EXISTS (
    SELECT 1 FROM user_login_history ulh
    INNER JOIN ip_blacklist ibl ON ulh.ip_address = ibl.ip_address
    WHERE ulh.user_id = p_user_id AND ibl.is_active = true
    LIMIT 1
  ) THEN
    v_is_fraud_suspect := TRUE;
    v_fraud_reason := COALESCE(v_fraud_reason || '; ', '') || 'IP blacklisted';
  END IF;

  -- Check wallet_blacklist
  IF EXISTS (
    SELECT 1 FROM wallet_blacklist 
    WHERE wallet_address = LOWER(p_wallet_address) AND is_active = true
  ) THEN
    v_is_fraud_suspect := TRUE;
    v_fraud_reason := COALESCE(v_fraud_reason || '; ', '') || 'Wallet blacklisted';
  END IF;

  -- Check profile fraud flag
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_user_id AND is_fraud_suspect = true
  ) THEN
    v_is_fraud_suspect := TRUE;
    SELECT fraud_suspect_reason INTO v_fraud_reason
    FROM profiles WHERE id = p_user_id;
  END IF;

  -- ========== SIMPLIFIED AUTO-APPROVE LOGIC ==========
  -- Fraud suspect → Admin review required
  -- Normal user → Auto-approve (NO amount limit, NO trust score check)
  
  IF v_is_fraud_suspect THEN
    v_auto_approve := FALSE;
  ELSE
    v_auto_approve := TRUE;
  END IF;

  -- Create withdrawal request
  INSERT INTO camly_claims (
    user_id,
    wallet_address,
    amount,
    claim_type,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_wallet_address,
    p_amount,
    'arbitrary',
    CASE WHEN v_auto_approve THEN 'approved' ELSE 'pending' END,
    NOW()
  )
  RETURNING id INTO v_request_id;

  -- Deduct from pending_amount
  UPDATE user_rewards
  SET pending_amount = pending_amount - p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- If auto-approved, also update claimed_amount
  IF v_auto_approve THEN
    UPDATE user_rewards
    SET claimed_amount = claimed_amount + p_amount
    WHERE user_id = p_user_id;
  END IF;

  -- Create admin notification if pending
  IF NOT v_auto_approve THEN
    INSERT INTO admin_realtime_notifications (
      notification_type,
      title,
      message,
      priority,
      data
    ) VALUES (
      'withdrawal_request',
      'Withdrawal Request (Fraud Suspect)',
      'User flagged as fraud suspect requesting ' || p_amount || ' CAMLY. Reason: ' || COALESCE(v_fraud_reason, 'Unknown'),
      'high',
      jsonb_build_object(
        'request_id', v_request_id,
        'user_id', p_user_id,
        'amount', p_amount,
        'fraud_reason', v_fraud_reason
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'status', CASE WHEN v_auto_approve THEN 'approved' ELSE 'pending' END,
    'auto_approved', v_auto_approve,
    'fraud_suspect', v_is_fraud_suspect,
    'fraud_reason', v_fraud_reason
  );
END;
$$;
