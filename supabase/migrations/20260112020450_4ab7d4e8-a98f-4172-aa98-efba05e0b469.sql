-- Update process_withdrawal_request to allow ALL users to auto-claim up to 200,000 CAMLY

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
  v_hourly_count INTEGER;
  v_cooldown_seconds INTEGER := 1800;
  v_max_hourly INTEGER := 3;
  v_daily_remaining NUMERIC;
BEGIN
  -- Lock user row
  SELECT wallet_balance, last_withdrawal_at INTO v_current_pending, v_last_withdrawal
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_current_pending IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Cooldown check (30 phút)
  IF v_last_withdrawal IS NOT NULL AND 
     v_last_withdrawal > now() - (v_cooldown_seconds || ' seconds')::INTERVAL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Vui lòng đợi ' || CEIL(EXTRACT(EPOCH FROM (v_last_withdrawal + (v_cooldown_seconds || ' seconds')::INTERVAL - now())))::TEXT || ' giây trước khi rút tiếp'
    );
  END IF;

  -- Rate limit (3 lần/giờ)
  SELECT COUNT(*) INTO v_hourly_count
  FROM withdrawal_requests WHERE user_id = p_user_id AND created_at > now() - INTERVAL '1 hour';

  IF v_hourly_count >= v_max_hourly THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đã vượt giới hạn 3 lần/giờ.');
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

  -- ====== NEW AUTO-APPROVE RULES ======
  -- RULE 1: TẤT CẢ users được auto-approve cho ≤ 200,000 CAMLY
  IF p_amount <= 200000 THEN
    v_auto_approve := TRUE;
  -- RULE 2: Trust-based approval cho số tiền cao hơn
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

  -- Notify admin if pending
  IF NOT v_auto_approve THEN
    INSERT INTO admin_realtime_notifications (notification_type, title, message, priority, data)
    VALUES ('withdrawal_request', 'New Withdrawal Request', 
      'User requested ' || p_amount::TEXT || ' CAMLY (Trust: ' || v_trust_score || ')',
      'high', jsonb_build_object('withdrawal_id', v_withdrawal_id, 'user_id', p_user_id, 'amount', p_amount));
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'auto_approved', v_auto_approve,
    'trust_score', v_trust_score,
    'status', CASE WHEN v_auto_approve THEN 'approved' ELSE 'pending' END
  );
END;
$$;