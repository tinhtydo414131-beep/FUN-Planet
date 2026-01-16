-- Step 1: Drop the conflicting function overloads
DROP FUNCTION IF EXISTS public.process_withdrawal_request(uuid, numeric, text);
DROP FUNCTION IF EXISTS public.process_withdrawal_request(uuid, text, numeric);

-- Step 2: Recreate a single, canonical function with correct signature
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  p_user_id uuid,
  p_wallet_address text,
  p_amount numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_fraud_suspect boolean;
  v_fraud_reason text;
  v_result jsonb;
  v_request_id uuid;
  v_daily_remaining numeric;
  v_pending_amount numeric;
  v_ip_blocked boolean := false;
  v_wallet_blocked boolean := false;
BEGIN
  -- Check if user is a fraud suspect
  SELECT is_fraud_suspect, fraud_suspect_reason INTO v_is_fraud_suspect, v_fraud_reason
  FROM profiles
  WHERE id = p_user_id;

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

  -- Get daily remaining limit
  SELECT remaining INTO v_daily_remaining
  FROM get_daily_claim_remaining(p_user_id);

  -- Get current pending amount
  SELECT pending_amount INTO v_pending_amount
  FROM user_rewards
  WHERE user_id = p_user_id;

  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid amount',
      'code', 'INVALID_AMOUNT'
    );
  END IF;

  IF v_pending_amount IS NULL OR p_amount > v_pending_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'code', 'INSUFFICIENT_BALANCE'
    );
  END IF;

  IF p_amount > v_daily_remaining THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Daily limit exceeded',
      'code', 'DAILY_LIMIT_EXCEEDED',
      'daily_remaining', v_daily_remaining
    );
  END IF;

  -- Determine status based on fraud checks
  DECLARE
    v_status text := 'approved';
    v_needs_review boolean := false;
  BEGIN
    IF v_is_fraud_suspect = true OR v_ip_blocked = true OR v_wallet_blocked = true THEN
      v_status := 'pending_review';
      v_needs_review := true;
    END IF;

    -- Create withdrawal request
    INSERT INTO withdrawal_requests (
      user_id,
      wallet_address,
      amount,
      status,
      created_at
    ) VALUES (
      p_user_id,
      p_wallet_address,
      p_amount,
      v_status,
      now()
    )
    RETURNING id INTO v_request_id;

    -- For approved (non-fraud) users, deduct from pending immediately
    IF v_status = 'approved' THEN
      UPDATE user_rewards
      SET pending_amount = pending_amount - p_amount,
          daily_claimed = COALESCE(daily_claimed, 0) + p_amount,
          last_claim_date = CURRENT_DATE,
          last_claim_at = now(),
          last_claim_amount = p_amount
      WHERE user_id = p_user_id;

      RETURN jsonb_build_object(
        'success', true,
        'status', 'approved',
        'request_id', v_request_id,
        'amount', p_amount
      );
    END IF;

    -- Fraud suspect - needs manual review, notify admin
    INSERT INTO admin_realtime_notifications (
      notification_type,
      title,
      message,
      priority,
      data
    ) VALUES (
      'withdrawal_review',
      'Withdrawal Pending Review',
      'User flagged for review requested withdrawal of ' || p_amount || ' CAMLY',
      'high',
      jsonb_build_object(
        'user_id', p_user_id,
        'amount', p_amount,
        'wallet_address', p_wallet_address,
        'fraud_reason', v_fraud_reason,
        'ip_blocked', v_ip_blocked,
        'wallet_blocked', v_wallet_blocked
      )
    );

    RETURN jsonb_build_object(
      'success', true,
      'status', 'pending_review',
      'request_id', v_request_id,
      'reason', CASE 
        WHEN v_is_fraud_suspect THEN 'Account flagged for review'
        WHEN v_ip_blocked THEN 'IP address blocked'
        WHEN v_wallet_blocked THEN 'Wallet address blocked'
        ELSE 'Manual review required'
      END
    );
  END;
END;
$$;