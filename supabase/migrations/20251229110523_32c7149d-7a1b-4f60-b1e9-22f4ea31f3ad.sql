-- Function to sync wallet_balance to web3_rewards
CREATE OR REPLACE FUNCTION sync_profiles_to_web3_rewards()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance THEN
    INSERT INTO web3_rewards (user_id, camly_balance)
    VALUES (NEW.id, COALESCE(NEW.wallet_balance, 0))
    ON CONFLICT (user_id) DO UPDATE 
    SET camly_balance = COALESCE(NEW.wallet_balance, 0)
    WHERE web3_rewards.camly_balance IS DISTINCT FROM COALESCE(NEW.wallet_balance, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to sync web3_rewards to profiles
CREATE OR REPLACE FUNCTION sync_web3_rewards_to_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.camly_balance IS DISTINCT FROM NEW.camly_balance THEN
    UPDATE profiles 
    SET wallet_balance = COALESCE(NEW.camly_balance, 0)
    WHERE id = NEW.user_id
    AND wallet_balance IS DISTINCT FROM COALESCE(NEW.camly_balance, 0);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS sync_wallet_to_web3 ON profiles;
CREATE TRIGGER sync_wallet_to_web3
  AFTER UPDATE OF wallet_balance ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profiles_to_web3_rewards();

DROP TRIGGER IF EXISTS sync_web3_to_wallet ON web3_rewards;
CREATE TRIGGER sync_web3_to_wallet
  AFTER UPDATE OF camly_balance ON web3_rewards
  FOR EACH ROW
  EXECUTE FUNCTION sync_web3_rewards_to_profiles();

-- Admin function to reset all user rewards
CREATE OR REPLACE FUNCTION admin_reset_user_rewards(
  p_target_user_id UUID,
  p_admin_user_id UUID,
  p_reason TEXT DEFAULT 'Admin reset'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_wallet_balance NUMERIC;
  v_old_camly_balance NUMERIC;
  v_old_pending NUMERIC;
  v_old_claimed NUMERIC;
  v_old_total NUMERIC;
  v_username TEXT;
BEGIN
  -- Check if caller is admin
  IF NOT has_role(p_admin_user_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin role required');
  END IF;

  -- Get username for logging
  SELECT username INTO v_username FROM profiles WHERE id = p_target_user_id;
  
  IF v_username IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Get current balances for logging
  SELECT wallet_balance INTO v_old_wallet_balance FROM profiles WHERE id = p_target_user_id;
  SELECT camly_balance INTO v_old_camly_balance FROM web3_rewards WHERE user_id = p_target_user_id;
  SELECT pending_amount, claimed_amount, total_earned INTO v_old_pending, v_old_claimed, v_old_total
  FROM user_rewards WHERE user_id = p_target_user_id;
  
  -- Reset all balances to 0 (triggers will sync automatically)
  UPDATE profiles SET wallet_balance = 0 WHERE id = p_target_user_id;
  UPDATE web3_rewards SET camly_balance = 0 WHERE user_id = p_target_user_id;
  UPDATE user_rewards SET pending_amount = 0, claimed_amount = 0, total_earned = 0, daily_claimed = 0 WHERE user_id = p_target_user_id;
  
  -- Log the action
  INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken, resolved_by, resolved_at)
  VALUES (
    p_target_user_id,
    'admin_reset_rewards',
    format('Admin reset for user %s. Reason: %s', v_username, p_reason),
    COALESCE(v_old_wallet_balance, 0) + COALESCE(v_old_camly_balance, 0),
    format('Reset all rewards. Before: wallet=%s, camly=%s, pending=%s, claimed=%s, total=%s',
      COALESCE(v_old_wallet_balance, 0), COALESCE(v_old_camly_balance, 0), 
      COALESCE(v_old_pending, 0), COALESCE(v_old_claimed, 0), COALESCE(v_old_total, 0)),
    p_admin_user_id,
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'username', v_username,
    'previous_balances', jsonb_build_object(
      'wallet_balance', COALESCE(v_old_wallet_balance, 0),
      'camly_balance', COALESCE(v_old_camly_balance, 0),
      'pending_amount', COALESCE(v_old_pending, 0),
      'claimed_amount', COALESCE(v_old_claimed, 0),
      'total_earned', COALESCE(v_old_total, 0)
    )
  );
END;
$$;