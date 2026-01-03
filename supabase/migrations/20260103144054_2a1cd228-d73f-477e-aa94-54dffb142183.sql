-- Create RPC function for P2P transfers (CAMLY internal)
CREATE OR REPLACE FUNCTION public.process_p2p_transfer(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount NUMERIC,
  p_token_type TEXT DEFAULT 'CAMLY',
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
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Prevent self-transfer
  IF p_sender_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot transfer to yourself');
  END IF;

  -- Get usernames
  SELECT username INTO v_sender_username FROM profiles WHERE id = p_sender_id;
  SELECT username INTO v_recipient_username FROM profiles WHERE id = p_recipient_id;

  IF v_recipient_username IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient not found');
  END IF;

  -- Get sender CAMLY balance (lock row to prevent race conditions)
  SELECT camly_balance INTO v_sender_balance
  FROM web3_rewards WHERE user_id = p_sender_id FOR UPDATE;

  -- Check sufficient balance
  IF COALESCE(v_sender_balance, 0) < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Deduct from sender
  UPDATE web3_rewards
  SET camly_balance = COALESCE(camly_balance, 0) - p_amount
  WHERE user_id = p_sender_id;

  -- Add to recipient (upsert)
  INSERT INTO web3_rewards (user_id, camly_balance)
  VALUES (p_recipient_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
  SET camly_balance = COALESCE(web3_rewards.camly_balance, 0) + p_amount;

  -- Record transactions for both parties
  INSERT INTO web3_reward_transactions (user_id, amount, reward_type, description)
  VALUES 
    (p_sender_id, -p_amount, 'p2p_transfer_out', 'Sent ' || p_amount::TEXT || ' CAMLY to ' || COALESCE(v_recipient_username, 'User')),
    (p_recipient_id, p_amount, 'p2p_transfer_in', 'Received ' || p_amount::TEXT || ' CAMLY from ' || COALESCE(v_sender_username, 'User'));

  -- Record wallet transaction with completed status
  INSERT INTO wallet_transactions (from_user_id, to_user_id, amount, token_type, transaction_type, status, notes)
  VALUES (p_sender_id, p_recipient_id, p_amount, p_token_type, 'p2p_transfer', 'completed', p_notes);

  RETURN jsonb_build_object(
    'success', true,
    'amount', p_amount,
    'sender_username', v_sender_username,
    'recipient_username', v_recipient_username
  );
END;
$$;