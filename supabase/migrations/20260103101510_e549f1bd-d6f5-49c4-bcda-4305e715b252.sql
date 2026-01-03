-- Create withdrawal_requests table
CREATE TABLE public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  wallet_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
  trust_score INTEGER,
  auto_approved BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own withdrawals"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawal_requests FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawals"
ON public.withdrawal_requests FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can update withdrawals"
ON public.withdrawal_requests FOR UPDATE
USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.withdrawal_requests;

-- Create function to calculate user trust score
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
  -- Account age score (0-20 points)
  SELECT EXTRACT(DAY FROM (now() - created_at))::INTEGER INTO v_account_age_days
  FROM profiles WHERE id = p_user_id;
  
  IF v_account_age_days >= 90 THEN v_score := v_score + 20;
  ELSIF v_account_age_days >= 30 THEN v_score := v_score + 15;
  ELSIF v_account_age_days >= 7 THEN v_score := v_score + 10;
  ELSIF v_account_age_days >= 1 THEN v_score := v_score + 5;
  END IF;

  -- Wallet verification score (0-15 points)
  SELECT wallet_address IS NOT NULL INTO v_has_wallet
  FROM profiles WHERE id = p_user_id;
  
  IF v_has_wallet THEN v_score := v_score + 15; END IF;

  -- Fraud/block check (-20 to 0 points)
  SELECT EXISTS(SELECT 1 FROM admin_blocked_users WHERE user_id = p_user_id AND status = 'blocked') INTO v_is_blocked;
  IF v_is_blocked THEN v_score := v_score - 50; END IF;
  
  SELECT COUNT(*) INTO v_fraud_count FROM fraud_logs WHERE user_id = p_user_id;
  v_score := v_score - LEAST(v_fraud_count * 5, 20);

  -- Successful claims history (0-15 points)
  SELECT COUNT(*) INTO v_successful_claims 
  FROM withdrawal_requests 
  WHERE user_id = p_user_id AND status = 'completed';
  
  IF v_successful_claims >= 10 THEN v_score := v_score + 15;
  ELSIF v_successful_claims >= 5 THEN v_score := v_score + 10;
  ELSIF v_successful_claims >= 1 THEN v_score := v_score + 5;
  END IF;

  -- Game contribution score (0-15 points)
  SELECT COUNT(*) INTO v_games_uploaded 
  FROM uploaded_games 
  WHERE user_id = p_user_id AND status = 'approved';
  
  IF v_games_uploaded >= 5 THEN v_score := v_score + 15;
  ELSIF v_games_uploaded >= 2 THEN v_score := v_score + 10;
  ELSIF v_games_uploaded >= 1 THEN v_score := v_score + 5;
  END IF;

  -- IP reputation (0-15 points, deduct if shared IP)
  SELECT COUNT(DISTINCT user_id) INTO v_ip_shared_count
  FROM user_login_history
  WHERE ip_address IN (SELECT ip_address FROM user_login_history WHERE user_id = p_user_id);
  
  IF v_ip_shared_count <= 1 THEN v_score := v_score + 15;
  ELSIF v_ip_shared_count <= 2 THEN v_score := v_score + 10;
  ELSIF v_ip_shared_count <= 3 THEN v_score := v_score + 5;
  ELSE v_score := v_score - 10;
  END IF;

  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$;

-- Create function to process withdrawal request
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
  v_auto_approve_threshold NUMERIC := 100000; -- 100K CAMLY
  v_high_trust_threshold INTEGER := 70;
  v_medium_trust_threshold INTEGER := 40;
  v_auto_approved BOOLEAN := false;
  v_withdrawal_id UUID;
  v_pending_amount NUMERIC;
  v_daily_remaining NUMERIC;
BEGIN
  -- Get pending amount
  SELECT pending_amount INTO v_pending_amount
  FROM user_rewards WHERE user_id = p_user_id;
  
  IF v_pending_amount IS NULL OR v_pending_amount < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient pending balance');
  END IF;

  -- Check daily limit
  v_daily_remaining := get_daily_claim_remaining(p_user_id);
  IF p_amount > v_daily_remaining THEN
    RETURN jsonb_build_object('success', false, 'error', 'Daily limit exceeded');
  END IF;

  -- Calculate trust score
  v_trust_score := calculate_user_trust_score(p_user_id);

  -- Determine if auto-approve
  -- High trust (≥70): always auto-approve
  -- Medium trust (40-69) AND amount < threshold: auto-approve
  IF v_trust_score >= v_high_trust_threshold THEN
    v_auto_approved := true;
  ELSIF v_trust_score >= v_medium_trust_threshold AND p_amount < v_auto_approve_threshold THEN
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
    SET 
      pending_amount = pending_amount - p_amount,
      daily_claimed = CASE WHEN last_claim_date = CURRENT_DATE THEN daily_claimed + p_amount ELSE p_amount END,
      last_claim_date = CURRENT_DATE,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  -- Create admin notification if pending
  IF NOT v_auto_approved THEN
    INSERT INTO admin_realtime_notifications (
      notification_type, title, message, priority, data
    ) VALUES (
      'pending_withdrawal',
      'Withdrawal Pending Review',
      'User requests ' || p_amount || ' CAMLY (Trust: ' || v_trust_score || ')',
      CASE WHEN p_amount >= 500000 THEN 'high' ELSE 'medium' END,
      jsonb_build_object(
        'withdrawal_id', v_withdrawal_id,
        'user_id', p_user_id,
        'amount', p_amount,
        'trust_score', v_trust_score
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'auto_approved', v_auto_approved,
    'trust_score', v_trust_score,
    'status', CASE WHEN v_auto_approved THEN 'approved' ELSE 'pending' END
  );
END;
$$;

-- Function to approve withdrawal (admin only)
CREATE OR REPLACE FUNCTION public.admin_approve_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Check admin role
  IF NOT has_role(p_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get withdrawal
  SELECT * INTO v_withdrawal FROM withdrawal_requests WHERE id = p_withdrawal_id;
  
  IF v_withdrawal IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal not found');
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal is not pending');
  END IF;

  -- Update status to approved
  UPDATE withdrawal_requests
  SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = now()
  WHERE id = p_withdrawal_id;

  -- Deduct from user's pending
  UPDATE user_rewards
  SET 
    pending_amount = pending_amount - v_withdrawal.amount,
    daily_claimed = CASE WHEN last_claim_date = CURRENT_DATE THEN daily_claimed + v_withdrawal.amount ELSE v_withdrawal.amount END,
    last_claim_date = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = v_withdrawal.user_id;

  -- Notify user
  INSERT INTO user_notifications (user_id, notification_type, title, message, data)
  VALUES (
    v_withdrawal.user_id,
    'withdrawal_approved',
    'Withdrawal Approved',
    'Your withdrawal of ' || v_withdrawal.amount || ' CAMLY has been approved',
    jsonb_build_object('withdrawal_id', p_withdrawal_id, 'amount', v_withdrawal.amount)
  );

  RETURN jsonb_build_object('success', true, 'withdrawal', row_to_json(v_withdrawal));
END;
$$;

-- Function to reject withdrawal (admin only)
CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(
  p_withdrawal_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Check admin role
  IF NOT has_role(p_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get withdrawal
  SELECT * INTO v_withdrawal FROM withdrawal_requests WHERE id = p_withdrawal_id;
  
  IF v_withdrawal IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal not found');
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal is not pending');
  END IF;

  -- Update status to rejected
  UPDATE withdrawal_requests
  SET status = 'rejected', reviewed_by = p_admin_id, reviewed_at = now(), rejection_reason = p_reason
  WHERE id = p_withdrawal_id;

  -- Notify user
  INSERT INTO user_notifications (user_id, notification_type, title, message, data)
  VALUES (
    v_withdrawal.user_id,
    'withdrawal_rejected',
    'Withdrawal Rejected',
    'Your withdrawal was rejected: ' || p_reason,
    jsonb_build_object('withdrawal_id', p_withdrawal_id, 'amount', v_withdrawal.amount, 'reason', p_reason)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;