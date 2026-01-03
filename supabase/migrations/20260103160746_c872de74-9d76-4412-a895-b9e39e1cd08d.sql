
-- ========================================
-- 100% AUTO-CLAIM SYSTEM - Hạ ngưỡng Trust Score
-- ========================================

-- 1. Thêm cột last_withdrawal_at để track cooldown
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_withdrawal_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Cập nhật hàm calculate_user_trust_score - tăng điểm cho user mới
CREATE OR REPLACE FUNCTION public.calculate_user_trust_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 0;
  v_account_age_days INTEGER;
  v_has_wallet BOOLEAN;
  v_is_blocked BOOLEAN;
  v_fraud_count INTEGER;
  v_successful_claims INTEGER;
  v_games_uploaded INTEGER;
  v_ip_shared_count INTEGER;
BEGIN
  -- Account age score (0-25 points) - TĂng điểm cho user mới
  SELECT EXTRACT(DAY FROM (now() - created_at))::INTEGER INTO v_account_age_days
  FROM profiles WHERE id = p_user_id;
  
  IF v_account_age_days >= 90 THEN v_score := v_score + 25;
  ELSIF v_account_age_days >= 30 THEN v_score := v_score + 20;
  ELSIF v_account_age_days >= 7 THEN v_score := v_score + 15;
  ELSIF v_account_age_days >= 3 THEN v_score := v_score + 10;
  ELSIF v_account_age_days >= 1 THEN v_score := v_score + 8;
  ELSE v_score := v_score + 5; -- Ngay cả user mới cũng có 5 điểm
  END IF;

  -- Wallet verification score (0-20 points) - TĂng điểm cho ví kết nối
  SELECT wallet_address IS NOT NULL INTO v_has_wallet
  FROM profiles WHERE id = p_user_id;
  
  IF v_has_wallet THEN v_score := v_score + 20; END IF;

  -- Fraud/block check (-50 to 0 points)
  SELECT EXISTS(SELECT 1 FROM admin_blocked_users WHERE user_id = p_user_id AND status = 'blocked') INTO v_is_blocked;
  IF v_is_blocked THEN v_score := v_score - 100; END IF; -- Block hoàn toàn
  
  SELECT COUNT(*) INTO v_fraud_count FROM fraud_logs WHERE user_id = p_user_id;
  v_score := v_score - LEAST(v_fraud_count * 10, 30);

  -- Successful claims history (0-20 points) - TĂng điểm
  SELECT COUNT(*) INTO v_successful_claims 
  FROM withdrawal_requests 
  WHERE user_id = p_user_id AND status = 'completed';
  
  IF v_successful_claims >= 10 THEN v_score := v_score + 20;
  ELSIF v_successful_claims >= 5 THEN v_score := v_score + 15;
  ELSIF v_successful_claims >= 2 THEN v_score := v_score + 10;
  ELSIF v_successful_claims >= 1 THEN v_score := v_score + 7;
  END IF;

  -- Game contribution score (0-15 points)
  SELECT COUNT(*) INTO v_games_uploaded 
  FROM uploaded_games 
  WHERE user_id = p_user_id AND status = 'approved';
  
  IF v_games_uploaded >= 5 THEN v_score := v_score + 15;
  ELSIF v_games_uploaded >= 2 THEN v_score := v_score + 10;
  ELSIF v_games_uploaded >= 1 THEN v_score := v_score + 7;
  END IF;

  -- IP reputation (0-20 points, deduct if shared IP) - Tăng weight
  SELECT COUNT(DISTINCT user_id) INTO v_ip_shared_count
  FROM user_login_history
  WHERE ip_address IN (SELECT ip_address FROM user_login_history WHERE user_id = p_user_id);
  
  IF v_ip_shared_count <= 1 THEN v_score := v_score + 20;
  ELSIF v_ip_shared_count <= 2 THEN v_score := v_score + 15;
  ELSIF v_ip_shared_count <= 3 THEN v_score := v_score + 5;
  ELSE v_score := v_score - 15; -- Nhiều account chung IP = giảm điểm
  END IF;

  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;

-- 3. Cập nhật process_withdrawal_request với ngưỡng mới
CREATE OR REPLACE FUNCTION public.process_withdrawal_request(
  p_user_id UUID,
  p_amount NUMERIC,
  p_wallet_address TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trust_score INTEGER;
  v_auto_approved BOOLEAN := false;
  v_withdrawal_id UUID;
  v_pending_amount NUMERIC;
  v_daily_remaining NUMERIC;
  v_last_withdrawal TIMESTAMP WITH TIME ZONE;
  v_hourly_requests INTEGER;
BEGIN
  -- Check cooldown (30 phút giữa các lần rút)
  SELECT last_withdrawal_at INTO v_last_withdrawal
  FROM profiles WHERE id = p_user_id;
  
  IF v_last_withdrawal IS NOT NULL AND v_last_withdrawal > now() - INTERVAL '30 minutes' THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Vui lòng đợi 30 phút giữa các lần rút tiền',
      'cooldown_remaining', EXTRACT(EPOCH FROM (v_last_withdrawal + INTERVAL '30 minutes' - now()))::INTEGER
    );
  END IF;

  -- Rate limiting: Max 3 requests per hour
  SELECT COUNT(*) INTO v_hourly_requests
  FROM withdrawal_requests
  WHERE user_id = p_user_id AND created_at > now() - INTERVAL '1 hour';
  
  IF v_hourly_requests >= 3 THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Đã đạt giới hạn 3 yêu cầu/giờ. Vui lòng thử lại sau.'
    );
  END IF;

  -- Get pending amount
  SELECT pending_amount INTO v_pending_amount
  FROM user_rewards WHERE user_id = p_user_id;
  
  IF v_pending_amount IS NULL OR v_pending_amount < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư chờ rút không đủ');
  END IF;

  -- Check daily limit
  v_daily_remaining := get_daily_claim_remaining(p_user_id);
  IF p_amount > v_daily_remaining THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đã vượt giới hạn rút hàng ngày');
  END IF;

  -- Calculate trust score
  v_trust_score := calculate_user_trust_score(p_user_id);

  -- ========================================
  -- NGƯỠNG AUTO-APPROVE MỚI (Hạ thấp hơn)
  -- ========================================
  -- Trust >= 20 VÀ amount <= 200,000: Auto-approve
  -- Trust >= 30 VÀ amount <= 500,000: Auto-approve  
  -- Trust >= 40 VÀ amount <= 1,000,000: Auto-approve
  -- Trust >= 50: Auto-approve mọi số tiền
  -- Trust < 20: Tự động TỪ CHỐI (không cần admin review)
  -- ========================================
  
  IF v_trust_score < 20 THEN
    -- Auto reject - không đủ tin cậy
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Tài khoản chưa đủ điều kiện rút tiền. Hãy chơi game và tương tác để tăng Trust Score.',
      'trust_score', v_trust_score,
      'min_required', 20
    );
  END IF;
  
  IF v_trust_score >= 50 THEN
    v_auto_approved := true;
  ELSIF v_trust_score >= 40 AND p_amount <= 1000000 THEN
    v_auto_approved := true;
  ELSIF v_trust_score >= 30 AND p_amount <= 500000 THEN
    v_auto_approved := true;
  ELSIF v_trust_score >= 20 AND p_amount <= 200000 THEN
    v_auto_approved := true;
  END IF;

  -- Create withdrawal request
  INSERT INTO withdrawal_requests (
    user_id, amount, wallet_address, trust_score, auto_approved,
    status
  ) VALUES (
    p_user_id, p_amount, p_wallet_address, v_trust_score, v_auto_approved,
    CASE WHEN v_auto_approved THEN 'approved' ELSE 'pending' END
  )
  RETURNING id INTO v_withdrawal_id;

  -- If auto-approved, deduct from pending immediately
  IF v_auto_approved THEN
    UPDATE user_rewards
    SET pending_amount = pending_amount - p_amount,
        claimed_amount = claimed_amount + p_amount,
        daily_claimed = COALESCE(daily_claimed, 0) + p_amount,
        last_claim_date = CURRENT_DATE,
        last_claim_amount = p_amount,
        last_claim_at = now()
    WHERE user_id = p_user_id;
    
    -- Update last withdrawal time for cooldown
    UPDATE profiles SET last_withdrawal_at = now() WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'trust_score', v_trust_score,
    'auto_approved', v_auto_approved,
    'status', CASE WHEN v_auto_approved THEN 'approved' ELSE 'pending_review' END
  );
END;
$$;

-- 4. Hàm lấy Trust Score cho frontend hiển thị
CREATE OR REPLACE FUNCTION public.get_user_trust_info(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trust_score INTEGER;
  v_account_age_days INTEGER;
  v_successful_claims INTEGER;
  v_last_withdrawal TIMESTAMP WITH TIME ZONE;
  v_cooldown_remaining INTEGER := 0;
  v_hourly_requests INTEGER;
BEGIN
  v_trust_score := calculate_user_trust_score(p_user_id);
  
  SELECT EXTRACT(DAY FROM (now() - created_at))::INTEGER INTO v_account_age_days
  FROM profiles WHERE id = p_user_id;
  
  SELECT COUNT(*) INTO v_successful_claims 
  FROM withdrawal_requests 
  WHERE user_id = p_user_id AND status = 'completed';
  
  SELECT last_withdrawal_at INTO v_last_withdrawal
  FROM profiles WHERE id = p_user_id;
  
  IF v_last_withdrawal IS NOT NULL AND v_last_withdrawal > now() - INTERVAL '30 minutes' THEN
    v_cooldown_remaining := EXTRACT(EPOCH FROM (v_last_withdrawal + INTERVAL '30 minutes' - now()))::INTEGER;
  END IF;
  
  SELECT COUNT(*) INTO v_hourly_requests
  FROM withdrawal_requests
  WHERE user_id = p_user_id AND created_at > now() - INTERVAL '1 hour';

  RETURN jsonb_build_object(
    'trust_score', v_trust_score,
    'account_age_days', COALESCE(v_account_age_days, 0),
    'successful_claims', v_successful_claims,
    'cooldown_remaining', v_cooldown_remaining,
    'hourly_requests_remaining', GREATEST(0, 3 - v_hourly_requests),
    'auto_approve_tier', CASE 
      WHEN v_trust_score >= 50 THEN 'Platinum (Mọi số tiền)'
      WHEN v_trust_score >= 40 THEN 'Gold (≤1M CAMLY)'
      WHEN v_trust_score >= 30 THEN 'Silver (≤500K CAMLY)'
      WHEN v_trust_score >= 20 THEN 'Bronze (≤200K CAMLY)'
      ELSE 'Chưa đủ điều kiện'
    END
  );
END;
$$;

-- 5. Cleanup: Auto-approve các pending requests với trust >= 20
-- (Chạy 1 lần để xử lý backlog)
UPDATE withdrawal_requests
SET status = 'approved', auto_approved = true
WHERE status = 'pending' 
  AND trust_score >= 20
  AND amount <= CASE 
    WHEN trust_score >= 50 THEN 999999999
    WHEN trust_score >= 40 THEN 1000000
    WHEN trust_score >= 30 THEN 500000
    WHEN trust_score >= 20 THEN 200000
    ELSE 0
  END;

-- 6. Grant access
GRANT EXECUTE ON FUNCTION public.get_user_trust_info(UUID) TO authenticated;
