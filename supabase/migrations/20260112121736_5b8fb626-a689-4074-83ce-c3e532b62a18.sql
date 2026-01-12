-- Add referral_synced column to track synced amounts
ALTER TABLE web3_rewards 
ADD COLUMN IF NOT EXISTS referral_synced NUMERIC DEFAULT 0;

-- Create function to auto-sync referral earnings to pending_amount
CREATE OR REPLACE FUNCTION auto_sync_referral_to_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_referral NUMERIC;
BEGIN
  -- Calculate new referral amount to sync
  v_new_referral := NEW.referral_earnings - COALESCE(OLD.referral_earnings, 0);
  
  IF v_new_referral > 0 THEN
    -- Add to pending_amount in user_rewards
    INSERT INTO user_rewards (user_id, pending_amount, updated_at)
    VALUES (NEW.user_id, v_new_referral, now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      pending_amount = COALESCE(user_rewards.pending_amount, 0) + v_new_referral,
      updated_at = now();
    
    -- Mark as synced
    NEW.referral_synced := NEW.referral_earnings;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-sync on referral_earnings update
DROP TRIGGER IF EXISTS sync_referral_on_update ON web3_rewards;
CREATE TRIGGER sync_referral_on_update
  BEFORE UPDATE OF referral_earnings ON web3_rewards
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_referral_to_pending();

-- Create RPC function for manual sync (admin use)
CREATE OR REPLACE FUNCTION sync_all_referral_to_pending()
RETURNS TABLE(users_synced INTEGER, total_amount NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_users_synced INTEGER := 0;
  v_total_amount NUMERIC := 0;
BEGIN
  -- Get stats before sync
  SELECT 
    COUNT(*)::INTEGER,
    COALESCE(SUM(referral_earnings - COALESCE(referral_synced, 0)), 0)
  INTO v_users_synced, v_total_amount
  FROM web3_rewards
  WHERE referral_earnings > COALESCE(referral_synced, 0);

  -- Sync all unsynced referral earnings to pending_amount
  INSERT INTO user_rewards (user_id, pending_amount, updated_at)
  SELECT 
    wr.user_id,
    wr.referral_earnings - COALESCE(wr.referral_synced, 0),
    now()
  FROM web3_rewards wr
  WHERE wr.referral_earnings > COALESCE(wr.referral_synced, 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    pending_amount = COALESCE(user_rewards.pending_amount, 0) + EXCLUDED.pending_amount,
    updated_at = now();

  -- Mark all as synced
  UPDATE web3_rewards 
  SET referral_synced = referral_earnings
  WHERE referral_earnings > COALESCE(referral_synced, 0);

  RETURN QUERY SELECT v_users_synced, v_total_amount;
END;
$$;

-- One-time sync: Add all existing referral_earnings to pending_amount
DO $$
BEGIN
  -- Sync existing referral earnings that haven't been synced yet
  INSERT INTO user_rewards (user_id, pending_amount, updated_at)
  SELECT 
    wr.user_id,
    wr.referral_earnings,
    now()
  FROM web3_rewards wr
  WHERE wr.referral_earnings > 0
    AND wr.user_id NOT IN (SELECT user_id FROM user_rewards WHERE pending_amount > 0)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    pending_amount = COALESCE(user_rewards.pending_amount, 0) + EXCLUDED.pending_amount,
    updated_at = now();

  -- Mark all as synced
  UPDATE web3_rewards 
  SET referral_synced = referral_earnings
  WHERE referral_earnings > 0;
END $$;