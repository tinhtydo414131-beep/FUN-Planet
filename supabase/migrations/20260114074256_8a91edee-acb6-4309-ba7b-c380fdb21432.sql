-- Fix process_withdrawal_request to correctly extract value from JSONB
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  p_user_id uuid, 
  p_wallet_address text, 
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_fraud_suspect boolean;
  v_fraud_reason text;
  v_result jsonb;
  v_request_id uuid;
  v_daily_remaining numeric;
  v_pending_amount numeric;
  v_ip_blocked boolean := false;
  v_wallet_blocked boolean := false;
  v_status text := 'approved';
BEGIN
  -- Check fraud status
  SELECT is_fraud_suspect, fraud_suspect_reason 
  INTO v_is_fraud_suspect, v_fraud_reason
  FROM profiles WHERE id = p_user_id;

  -- Check IP blacklist
  SELECT EXISTS(
    SELECT 1 FROM ip_blacklist ib
    JOIN user_login_history ulh ON ulh.ip_address = ib.ip_address
    WHERE ulh.user_id = p_user_id AND ib.is_active = true
  ) INTO v_ip_blocked;

  -- Check wallet blacklist
  SELECT EXISTS(
    SELECT 1 FROM wallet_blacklist
    WHERE wallet_address = lower(p_wallet_address) AND is_active = true
  ) INTO v_wallet_blocked;

  -- ✅ FIX: Correctly extract value from JSONB returned by get_daily_claim_remaining
  v_daily_remaining := (get_daily_claim_remaining(p_user_id)->>'daily_remaining')::numeric;

  -- Get pending amount
  SELECT pending_amount INTO v_pending_amount
  FROM user_rewards WHERE user_id = p_user_id;

  -- Validations
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount', 'code', 'INVALID_AMOUNT');
  END IF;

  IF v_pending_amount IS NULL OR p_amount > v_pending_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'code', 'INSUFFICIENT_BALANCE');
  END IF;

  IF p_amount > v_daily_remaining THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily limit exceeded', 'code', 'DAILY_LIMIT_EXCEEDED', 'daily_remaining', v_daily_remaining);
  END IF;

  -- Determine status based on fraud checks
  IF v_is_fraud_suspect = true OR v_ip_blocked = true OR v_wallet_blocked = true THEN
    v_status := 'pending_review';
  END IF;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (user_id, wallet_address, amount, status, created_at)
  VALUES (p_user_id, p_wallet_address, p_amount, v_status, now())
  RETURNING id INTO v_request_id;

  IF v_status = 'approved' THEN
    -- Deduct from pending and update claim tracking
    UPDATE user_rewards
    SET pending_amount = pending_amount - p_amount,
        daily_claimed = COALESCE(daily_claimed, 0) + p_amount,
        last_claim_date = CURRENT_DATE,
        last_claim_at = now(),
        last_claim_amount = p_amount
    WHERE user_id = p_user_id;

    RETURN jsonb_build_object('success', true, 'status', 'approved', 'request_id', v_request_id, 'amount', p_amount);
  END IF;

  -- Pending review - notify admin
  INSERT INTO admin_realtime_notifications (notification_type, title, message, priority, data)
  VALUES ('withdrawal_review', 'Withdrawal Pending Review', 
          'User flagged requested ' || p_amount || ' CAMLY', 'high',
          jsonb_build_object('user_id', p_user_id, 'amount', p_amount, 'wallet_address', p_wallet_address, 'reason', 
            CASE 
              WHEN v_is_fraud_suspect THEN v_fraud_reason
              WHEN v_ip_blocked THEN 'IP blacklisted'
              WHEN v_wallet_blocked THEN 'Wallet blacklisted'
              ELSE 'Unknown'
            END));

  RETURN jsonb_build_object('success', true, 'status', 'pending_review', 'request_id', v_request_id);
END;
$function$;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';