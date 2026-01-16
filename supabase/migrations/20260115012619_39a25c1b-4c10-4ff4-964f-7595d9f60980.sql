-- FIX 1: Secure the process_p2p_transfer function to prevent user impersonation
-- Add auth.uid() verification to prevent attackers from stealing funds

CREATE OR REPLACE FUNCTION public.process_p2p_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance NUMERIC;
  v_sender_username TEXT;
  v_recipient_username TEXT;
  v_transaction_id UUID;
BEGIN
  -- CRITICAL SECURITY CHECK: Verify sender is the authenticated user
  IF p_sender_id != auth.uid() THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Unauthorized: You can only transfer from your own account'
    );
  END IF;

  -- Validate inputs
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  IF p_sender_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;

  -- Get sender's current balance with row lock
  SELECT camly_balance INTO v_sender_balance
  FROM web3_rewards
  WHERE user_id = p_sender_id
  FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender account not found');
  END IF;

  IF v_sender_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Verify recipient exists
  IF NOT EXISTS (SELECT 1 FROM web3_rewards WHERE user_id = p_recipient_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient account not found');
  END IF;

  -- Get usernames for transaction record
  SELECT username INTO v_sender_username FROM profiles WHERE id = p_sender_id;
  SELECT username INTO v_recipient_username FROM profiles WHERE id = p_recipient_id;

  -- Deduct from sender
  UPDATE web3_rewards
  SET camly_balance = camly_balance - p_amount,
      updated_at = NOW()
  WHERE user_id = p_sender_id;

  -- Add to recipient
  UPDATE web3_rewards
  SET camly_balance = camly_balance + p_amount,
      updated_at = NOW()
  WHERE user_id = p_recipient_id;

  -- Record transaction for sender
  INSERT INTO web3_reward_transactions (
    user_id, reward_type, amount, description, created_at
  ) VALUES (
    p_sender_id, 
    'p2p_transfer_sent', 
    -p_amount, 
    COALESCE('Sent to ' || v_recipient_username || ': ' || p_notes, 'Sent to ' || v_recipient_username),
    NOW()
  ) RETURNING id INTO v_transaction_id;

  -- Record transaction for recipient
  INSERT INTO web3_reward_transactions (
    user_id, reward_type, amount, description, created_at
  ) VALUES (
    p_recipient_id, 
    'p2p_transfer_received', 
    p_amount, 
    COALESCE('Received from ' || v_sender_username || ': ' || p_notes, 'Received from ' || v_sender_username),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true, 
    'transaction_id', v_transaction_id,
    'amount', p_amount,
    'sender', v_sender_username,
    'recipient', v_recipient_username
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


-- FIX 2: Restrict profiles table SELECT to own record only
-- Drop the overly permissive policy that exposes all user data

DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;

-- Create a secure policy that only allows users to view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

-- Note: The public_profiles view already exists with security_invoker=true
-- for displaying public user info (username, avatar, bio, stats) in leaderboards