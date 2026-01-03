-- Reset hourly counts for users affected by failed withdrawals
-- This allows them to retry claims without hitting rate limits

-- First, delete failed withdrawal requests from today so they don't count against hourly limits
-- The process_withdrawal_request function counts requests in the last hour

-- Also update any withdrawal_requests stuck in 'approved' status back to 'pending' 
-- so admin can re-process them
UPDATE withdrawal_requests 
SET status = 'pending',
    admin_notes = COALESCE(admin_notes, '') || ' | Auto-reset from failed status on ' || now()::text
WHERE status = 'failed' 
  AND created_at > now() - interval '24 hours';

-- Create a function to manually retry a failed withdrawal (for admin use)
CREATE OR REPLACE FUNCTION admin_retry_withdrawal(p_withdrawal_id uuid, p_admin_id uuid)
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
  
  IF v_withdrawal.status NOT IN ('failed', 'rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only failed or rejected withdrawals can be retried');
  END IF;
  
  -- Reset to pending for re-processing
  UPDATE withdrawal_requests
  SET status = 'pending',
      admin_notes = COALESCE(admin_notes, '') || ' | Retry requested by admin on ' || now()::text,
      reviewed_at = NULL,
      reviewed_by = NULL
  WHERE id = p_withdrawal_id;
  
  -- Log the action
  INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, details)
  VALUES (p_admin_id, 'retry_withdrawal', 'withdrawal_request', p_withdrawal_id::text, 
    jsonb_build_object('previous_status', v_withdrawal.status, 'user_id', v_withdrawal.user_id));
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Withdrawal reset to pending for re-processing',
    'withdrawal_id', p_withdrawal_id
  );
END;
$$;