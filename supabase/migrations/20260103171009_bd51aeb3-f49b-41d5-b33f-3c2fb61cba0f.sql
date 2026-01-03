-- ============================================
-- FIX 0: Add missing columns first
-- ============================================

-- Add missing columns to withdrawal_requests
ALTER TABLE withdrawal_requests 
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ADD COLUMN IF NOT EXISTS trust_score_at_request INTEGER;

-- Add last_withdrawal_at column to profiles if not exists
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS last_withdrawal_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- FIX 1: Restore CAMLY for affected users (approved but tx_hash is NULL)
-- ============================================

-- First, rollback all approved withdrawals that have no tx_hash
UPDATE user_rewards ur
SET 
  pending_amount = pending_amount + wr.amount,
  updated_at = now()
FROM withdrawal_requests wr
WHERE ur.user_id = wr.user_id
  AND wr.status = 'approved'
  AND wr.tx_hash IS NULL;

-- Also update profiles wallet_balance
UPDATE profiles p
SET 
  wallet_balance = COALESCE(wallet_balance, 0) + wr.amount
FROM withdrawal_requests wr
WHERE p.id = wr.user_id
  AND wr.status = 'approved'
  AND wr.tx_hash IS NULL;

-- Mark those withdrawals as failed
UPDATE withdrawal_requests
SET 
  status = 'failed',
  admin_notes = 'Auto-reverted: TX was never sent on-chain. Balance restored.',
  updated_at = now()
WHERE status = 'approved' AND tx_hash IS NULL;

-- Log the recovery in fraud_logs
INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken, resolved_at)
SELECT 
  user_id,
  'auto_claim_tx_failure',
  'Withdrawal was approved but on-chain TX never completed',
  amount,
  'Balance restored automatically',
  now()
FROM withdrawal_requests
WHERE status = 'failed' 
  AND admin_notes LIKE '%Auto-reverted%'
  AND updated_at > now() - interval '1 minute';

-- ============================================
-- FIX 2: Improve process_withdrawal_request with better locking
-- ============================================

CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  p_user_id uuid,
  p_amount numeric,
  p_wallet_address text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trust_info jsonb;
  v_trust_score INTEGER;
  v_auto_approve BOOLEAN := FALSE;
  v_withdrawal_id UUID;
  v_current_pending NUMERIC;
  v_last_withdrawal TIMESTAMP WITH TIME ZONE;
  v_hourly_count INTEGER;
  v_cooldown_seconds INTEGER := 1800; -- 30 minutes
  v_max_hourly INTEGER := 3;
  v_daily_remaining NUMERIC;
BEGIN
  -- CRITICAL: Lock user row first to prevent race conditions
  SELECT wallet_balance, last_withdrawal_at INTO v_current_pending, v_last_withdrawal
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_pending IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check cooldown (30 minutes) using profiles.last_withdrawal_at
  IF v_last_withdrawal IS NOT NULL AND 
     v_last_withdrawal > now() - (v_cooldown_seconds || ' seconds')::INTERVAL THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Vui lòng đợi ' || CEIL(EXTRACT(EPOCH FROM (v_last_withdrawal + (v_cooldown_seconds || ' seconds')::INTERVAL - now())))::TEXT || ' giây trước khi rút tiếp'
    );
  END IF;

  -- Check hourly rate limit
  SELECT COUNT(*) INTO v_hourly_count
  FROM withdrawal_requests
  WHERE user_id = p_user_id 
    AND created_at > now() - INTERVAL '1 hour';

  IF v_hourly_count >= v_max_hourly THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đã vượt giới hạn 3 lần/giờ. Vui lòng thử lại sau.');
  END IF;

  -- Check sufficient balance
  IF v_current_pending < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;

  -- Check daily limit
  v_daily_remaining := get_daily_claim_remaining(p_user_id);
  IF p_amount > v_daily_remaining THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đã vượt giới hạn hàng ngày. Còn lại: ' || v_daily_remaining::TEXT || ' CAMLY');
  END IF;

  -- Get trust info for auto-approve decision
  v_trust_info := get_user_trust_info(p_user_id);
  v_trust_score := (v_trust_info->>'trust_score')::INTEGER;

  -- Auto-approve rules based on trust score
  -- Trust >= 50: Any amount
  -- Trust >= 40: Up to 1M
  -- Trust >= 30: Up to 500k
  -- Trust >= 20: Up to 200k
  -- Trust < 20: Auto-reject
  IF v_trust_score < 20 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tài khoản chưa đủ điều kiện rút tiền. Cần Trust Score >= 20.');
  ELSIF v_trust_score >= 50 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 40 AND p_amount <= 1000000 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 30 AND p_amount <= 500000 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 20 AND p_amount <= 200000 THEN
    v_auto_approve := TRUE;
  END IF;

  -- Update last_withdrawal_at BEFORE creating request (prevent race condition)
  UPDATE profiles 
  SET last_withdrawal_at = now()
  WHERE id = p_user_id;

  -- Deduct from pending balance
  UPDATE profiles
  SET wallet_balance = wallet_balance - p_amount
  WHERE id = p_user_id;

  UPDATE user_rewards
  SET 
    pending_amount = pending_amount - p_amount,
    daily_claimed = CASE 
      WHEN last_claim_date = CURRENT_DATE THEN daily_claimed + p_amount 
      ELSE p_amount 
    END,
    last_claim_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (
    user_id, 
    amount, 
    wallet_address, 
    status,
    trust_score_at_request,
    auto_approved,
    trust_score
  )
  VALUES (
    p_user_id, 
    p_amount, 
    p_wallet_address, 
    CASE WHEN v_auto_approve THEN 'approved' ELSE 'pending' END,
    v_trust_score,
    v_auto_approve,
    v_trust_score
  )
  RETURNING id INTO v_withdrawal_id;

  -- If pending, create admin notification
  IF NOT v_auto_approve THEN
    INSERT INTO admin_realtime_notifications (notification_type, title, message, priority, data)
    VALUES (
      'withdrawal_request',
      'New Withdrawal Request',
      'User requested ' || p_amount::TEXT || ' CAMLY withdrawal',
      'high',
      jsonb_build_object('withdrawal_id', v_withdrawal_id, 'user_id', p_user_id, 'amount', p_amount, 'trust_score', v_trust_score)
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'auto_approved', v_auto_approve,
    'trust_score', v_trust_score,
    'status', CASE WHEN v_auto_approve THEN 'approved' ELSE 'pending' END
  );
END;
$function$;