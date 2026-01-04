-- Create admin_approve_pending_withdrawal function
CREATE OR REPLACE FUNCTION admin_approve_pending_withdrawal(p_withdrawal_id uuid, p_admin_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(p_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin role required');
  END IF;

  -- Get withdrawal info
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal not found');
  END IF;
  
  IF v_withdrawal.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only pending withdrawals can be approved. Current status: ' || v_withdrawal.status);
  END IF;
  
  -- Update status to approved
  UPDATE withdrawal_requests
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = p_admin_id,
      admin_notes = COALESCE(admin_notes, '') || ' | Approved by admin on ' || now()::text
  WHERE id = p_withdrawal_id;
  
  -- Log the action
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, 'approve_withdrawal', 'withdrawal_request', p_withdrawal_id::text, 
    jsonb_build_object(
      'amount', v_withdrawal.amount,
      'user_id', v_withdrawal.user_id,
      'wallet_address', v_withdrawal.wallet_address
    ));
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Withdrawal approved. Call process-approved-withdrawal edge function to complete transfer.',
    'withdrawal_id', p_withdrawal_id,
    'amount', v_withdrawal.amount,
    'wallet_address', v_withdrawal.wallet_address,
    'user_id', v_withdrawal.user_id
  );
END;
$$;

-- Create admin_reject_pending_withdrawal function
CREATE OR REPLACE FUNCTION admin_reject_pending_withdrawal(p_withdrawal_id uuid, p_admin_id uuid, p_reason text DEFAULT 'Rejected by admin')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_withdrawal RECORD;
  v_new_balance NUMERIC;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(p_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin role required');
  END IF;

  -- Get withdrawal info
  SELECT * INTO v_withdrawal
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal not found');
  END IF;
  
  IF v_withdrawal.status NOT IN ('pending', 'approved') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only pending or approved withdrawals can be rejected. Current status: ' || v_withdrawal.status);
  END IF;
  
  -- Update status to rejected
  UPDATE withdrawal_requests
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = p_admin_id,
      rejection_reason = p_reason,
      admin_notes = COALESCE(admin_notes, '') || ' | Rejected: ' || p_reason || ' on ' || now()::text
  WHERE id = p_withdrawal_id;
  
  -- Refund the amount back to user's pending rewards
  UPDATE user_rewards
  SET pending_amount = pending_amount + v_withdrawal.amount,
      updated_at = now()
  WHERE user_id = v_withdrawal.user_id
  RETURNING pending_amount INTO v_new_balance;
  
  -- Also update profiles.wallet_balance for consistency
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + v_withdrawal.amount
  WHERE id = v_withdrawal.user_id;
  
  -- Create notification for user
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (
    v_withdrawal.user_id,
    'Withdrawal Rejected',
    'Your withdrawal request for ' || v_withdrawal.amount || ' CAMLY was rejected. Reason: ' || p_reason || '. The amount has been returned to your balance.',
    'withdrawal_rejected'
  );
  
  -- Log the action
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, 'reject_withdrawal', 'withdrawal_request', p_withdrawal_id::text, 
    jsonb_build_object(
      'amount', v_withdrawal.amount,
      'user_id', v_withdrawal.user_id,
      'reason', p_reason,
      'refunded_balance', v_new_balance
    ));
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Withdrawal rejected and amount refunded',
    'withdrawal_id', p_withdrawal_id,
    'refunded_amount', v_withdrawal.amount,
    'new_balance', v_new_balance
  );
END;
$$;