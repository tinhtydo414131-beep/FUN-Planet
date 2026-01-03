-- =====================================================
-- FIX AUTO-CLAIM SYSTEM: SYNC DATA + TRUST SCORE FIXES
-- =====================================================

-- 1. SYNC user_rewards.pending_amount với profiles.wallet_balance
UPDATE user_rewards ur
SET pending_amount = COALESCE(p.wallet_balance, 0),
    updated_at = now()
FROM profiles p
WHERE ur.user_id = p.id
  AND ur.pending_amount IS DISTINCT FROM COALESCE(p.wallet_balance, 0);

-- 2. FIX NEGATIVE BALANCES (EmbeKhanhTong và bất kỳ ai khác)
UPDATE profiles 
SET wallet_balance = 0 
WHERE wallet_balance < 0;

UPDATE user_rewards 
SET pending_amount = 0, updated_at = now() 
WHERE pending_amount < 0;

-- Log fraud cho những users có số dư âm đã được fix
INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken, resolved_at)
SELECT 
  p.id,
  'negative_balance_fix',
  'Fixed negative balance for user ' || p.username,
  0,
  'Reset negative balance to 0',
  now()
FROM profiles p
WHERE p.username = 'EmbeKhanhTong';

-- 3. CREATE BIDIRECTIONAL SYNC TRIGGERS

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_wallet_to_user_rewards ON profiles;
DROP TRIGGER IF EXISTS sync_user_rewards_to_wallet ON user_rewards;

-- Trigger function: profiles.wallet_balance → user_rewards.pending_amount
CREATE OR REPLACE FUNCTION sync_wallet_balance_to_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance THEN
    INSERT INTO user_rewards (user_id, pending_amount, total_earned)
    VALUES (NEW.id, COALESCE(NEW.wallet_balance, 0), COALESCE(NEW.wallet_balance, 0))
    ON CONFLICT (user_id) DO UPDATE 
    SET pending_amount = COALESCE(NEW.wallet_balance, 0),
        updated_at = now()
    WHERE user_rewards.pending_amount IS DISTINCT FROM COALESCE(NEW.wallet_balance, 0);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function: user_rewards.pending_amount → profiles.wallet_balance
CREATE OR REPLACE FUNCTION sync_pending_to_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.pending_amount IS DISTINCT FROM NEW.pending_amount THEN
    UPDATE profiles 
    SET wallet_balance = COALESCE(NEW.pending_amount, 0)
    WHERE id = NEW.user_id
    AND wallet_balance IS DISTINCT FROM COALESCE(NEW.pending_amount, 0);
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER sync_wallet_to_user_rewards
  AFTER UPDATE OF wallet_balance ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_wallet_balance_to_pending();

CREATE TRIGGER sync_user_rewards_to_wallet
  AFTER UPDATE OF pending_amount ON user_rewards
  FOR EACH ROW
  EXECUTE FUNCTION sync_pending_to_wallet_balance();

-- 4. UPDATE process_withdrawal_request với trust thresholds mới
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(p_user_id uuid, p_amount numeric, p_wallet_address text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trust_info jsonb;
  v_trust_score INTEGER;
  v_auto_approve BOOLEAN := FALSE;
  v_auto_reject BOOLEAN := FALSE;
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

  -- NEW AUTO-APPROVE RULES (lowered thresholds):
  -- Trust >= 50: Any amount
  -- Trust >= 40: Up to 1M
  -- Trust >= 30: Up to 500k
  -- Trust >= 20: Up to 200k
  -- Trust >= 15: Up to 100k (NEW!)
  -- Trust < 15: Pending admin review (NOT auto-reject!)
  IF v_trust_score >= 50 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 40 AND p_amount <= 1000000 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 30 AND p_amount <= 500000 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 20 AND p_amount <= 200000 THEN
    v_auto_approve := TRUE;
  ELSIF v_trust_score >= 15 AND p_amount <= 100000 THEN
    v_auto_approve := TRUE;
  END IF;
  -- Trust < 15: v_auto_approve stays FALSE → pending admin review

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
      'User requested ' || p_amount::TEXT || ' CAMLY withdrawal (Trust: ' || v_trust_score || ')',
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

-- 5. UPDATE get_user_trust_info với wallet bonus cao hơn (15 → 20)
CREATE OR REPLACE FUNCTION public.get_user_trust_info(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_trust_score INTEGER := 0;
  v_account_age_days INTEGER;
  v_successful_claims INTEGER;
  v_has_wallet BOOLEAN;
  v_cooldown_remaining INTEGER;
  v_hourly_requests_remaining INTEGER;
  v_auto_approve_tier TEXT;
  v_last_withdrawal TIMESTAMP WITH TIME ZONE;
  v_hourly_count INTEGER;
BEGIN
  -- Get account age
  SELECT EXTRACT(DAY FROM (now() - created_at))::INTEGER INTO v_account_age_days
  FROM profiles WHERE id = p_user_id;
  
  -- Get successful claims count
  SELECT COUNT(*) INTO v_successful_claims
  FROM withdrawal_requests
  WHERE user_id = p_user_id AND status = 'completed';
  
  -- Check wallet connection
  SELECT wallet_address IS NOT NULL INTO v_has_wallet
  FROM profiles WHERE id = p_user_id;
  
  -- Get last withdrawal time for cooldown
  SELECT last_withdrawal_at INTO v_last_withdrawal
  FROM profiles WHERE id = p_user_id;
  
  -- Calculate cooldown remaining (30 minutes = 1800 seconds)
  IF v_last_withdrawal IS NOT NULL AND v_last_withdrawal > now() - INTERVAL '30 minutes' THEN
    v_cooldown_remaining := CEIL(EXTRACT(EPOCH FROM (v_last_withdrawal + INTERVAL '30 minutes' - now())))::INTEGER;
  ELSE
    v_cooldown_remaining := 0;
  END IF;
  
  -- Get hourly request count
  SELECT COUNT(*) INTO v_hourly_count
  FROM withdrawal_requests
  WHERE user_id = p_user_id AND created_at > now() - INTERVAL '1 hour';
  
  v_hourly_requests_remaining := GREATEST(0, 3 - v_hourly_count);
  
  -- CALCULATE TRUST SCORE (max 100):
  -- Account age: up to 20 points (1 point per 7 days, max 20)
  v_trust_score := v_trust_score + LEAST(20, v_account_age_days / 7);
  
  -- Successful claims: up to 30 points (3 points per claim, max 30)
  v_trust_score := v_trust_score + LEAST(30, v_successful_claims * 3);
  
  -- Wallet connected: 20 points (INCREASED from 15!)
  IF v_has_wallet THEN
    v_trust_score := v_trust_score + 20;
  END IF;
  
  -- Base points for having an account: 5 points
  v_trust_score := v_trust_score + 5;
  
  -- Cap at 100
  v_trust_score := LEAST(100, v_trust_score);
  
  -- Determine auto-approve tier
  IF v_trust_score >= 50 THEN
    v_auto_approve_tier := 'Platinum';
  ELSIF v_trust_score >= 40 THEN
    v_auto_approve_tier := 'Gold';
  ELSIF v_trust_score >= 30 THEN
    v_auto_approve_tier := 'Silver';
  ELSIF v_trust_score >= 20 THEN
    v_auto_approve_tier := 'Bronze';
  ELSIF v_trust_score >= 15 THEN
    v_auto_approve_tier := 'Starter';
  ELSE
    v_auto_approve_tier := 'Pending Review';
  END IF;
  
  RETURN jsonb_build_object(
    'trust_score', v_trust_score,
    'account_age_days', COALESCE(v_account_age_days, 0),
    'successful_claims', COALESCE(v_successful_claims, 0),
    'cooldown_remaining', v_cooldown_remaining,
    'hourly_requests_remaining', v_hourly_requests_remaining,
    'auto_approve_tier', v_auto_approve_tier
  );
END;
$function$;