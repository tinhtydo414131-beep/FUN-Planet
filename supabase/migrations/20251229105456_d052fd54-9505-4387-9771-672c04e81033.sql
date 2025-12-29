-- Deduct CAMLY from profiles.wallet_balance for users with duplicate_ranking_claim violations
-- This synchronizes the profiles table with the web3_rewards deductions already made

DO $$
DECLARE
  fraud_record RECORD;
  v_previous_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- Loop through all duplicate_ranking_claim fraud logs
  FOR fraud_record IN 
    SELECT user_id, amount_affected 
    FROM fraud_logs 
    WHERE fraud_type = 'duplicate_ranking_claim' 
    AND amount_affected > 0
  LOOP
    -- Get current wallet_balance
    SELECT COALESCE(wallet_balance, 0) INTO v_previous_balance
    FROM profiles WHERE id = fraud_record.user_id;
    
    -- Calculate new balance (ensure it doesn't go negative)
    v_new_balance := GREATEST(0, v_previous_balance - fraud_record.amount_affected);
    
    -- Update profiles.wallet_balance
    UPDATE profiles 
    SET wallet_balance = v_new_balance
    WHERE id = fraud_record.user_id;
    
    -- Log this correction to fraud_logs
    INSERT INTO fraud_logs (
      user_id, 
      fraud_type, 
      description, 
      amount_affected, 
      action_taken,
      resolved_at
    ) VALUES (
      fraud_record.user_id,
      'duplicate_ranking_claim',
      'Synced profiles.wallet_balance with web3_rewards correction',
      fraud_record.amount_affected,
      'Deducted ' || fraud_record.amount_affected || ' from profiles.wallet_balance. Previous: ' || v_previous_balance || ', New: ' || v_new_balance,
      NOW()
    );
  END LOOP;
END $$;