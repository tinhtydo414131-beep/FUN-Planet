-- =====================================================
-- ANTI-FRAUD MIGRATION: Step 1 - Create cleanup functions and fraud_logs table
-- =====================================================

-- 1. Create fraud_logs table to track detected fraud
CREATE TABLE IF NOT EXISTS public.fraud_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  fraud_type text NOT NULL,
  description text,
  amount_affected numeric DEFAULT 0,
  action_taken text,
  detected_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- Enable RLS on fraud_logs
ALTER TABLE public.fraud_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view fraud logs
CREATE POLICY "Admins can view fraud logs"
  ON public.fraud_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert fraud logs"
  ON public.fraud_logs
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Create function to cleanup duplicate rewards (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_rewards(p_transaction_type text)
RETURNS TABLE(user_id uuid, duplicates_removed integer, amount_removed numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted_count integer;
  v_deleted_amount numeric;
  v_user_id uuid;
BEGIN
  -- Find and delete duplicates, keeping only the earliest transaction per user
  FOR v_user_id IN 
    SELECT cct.user_id 
    FROM camly_coin_transactions cct
    WHERE cct.transaction_type = p_transaction_type
    GROUP BY cct.user_id
    HAVING COUNT(*) > 1
  LOOP
    -- Count duplicates and sum amounts to be removed
    SELECT COUNT(*) - 1, SUM(amount) - MIN(amount) 
    INTO v_deleted_count, v_deleted_amount
    FROM camly_coin_transactions cct
    WHERE cct.user_id = v_user_id AND cct.transaction_type = p_transaction_type;
    
    -- Delete duplicates, keep only the first one (by created_at)
    DELETE FROM camly_coin_transactions 
    WHERE id IN (
      SELECT id FROM (
        SELECT 
          id,
          ROW_NUMBER() OVER (PARTITION BY camly_coin_transactions.user_id ORDER BY created_at ASC) as rn
        FROM camly_coin_transactions 
        WHERE camly_coin_transactions.user_id = v_user_id 
          AND camly_coin_transactions.transaction_type = p_transaction_type
      ) sub 
      WHERE rn > 1
    );
    
    -- Log the fraud
    INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken)
    VALUES (
      v_user_id,
      'duplicate_' || p_transaction_type,
      'User claimed ' || p_transaction_type || ' reward ' || (v_deleted_count + 1) || ' times',
      v_deleted_amount,
      'Removed ' || v_deleted_count || ' duplicate transactions, kept 1 original'
    );
    
    -- Reduce pending_amount in user_rewards
    UPDATE user_rewards 
    SET pending_amount = GREATEST(0, pending_amount - v_deleted_amount),
        total_earned = GREATEST(0, total_earned - v_deleted_amount),
        updated_at = now()
    WHERE user_rewards.user_id = v_user_id;
    
    RETURN QUERY SELECT v_user_id, v_deleted_count, v_deleted_amount;
  END LOOP;
END;
$$;

-- 3. Create function to safely add reward with duplicate check
CREATE OR REPLACE FUNCTION public.add_reward_safely(
  p_user_id uuid,
  p_amount numeric,
  p_transaction_type text,
  p_description text DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, new_balance numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_count integer;
  v_new_balance numeric;
BEGIN
  -- Check for one-time rewards
  IF p_transaction_type IN ('wallet_connection', 'first_game_play') THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM camly_coin_transactions
    WHERE user_id = p_user_id AND transaction_type = p_transaction_type;
    
    IF v_existing_count > 0 THEN
      RETURN QUERY SELECT FALSE, 'Reward already claimed'::text, 0::numeric;
      RETURN;
    END IF;
  END IF;
  
  -- Check for daily rewards (only one per day)
  IF p_transaction_type = 'daily_checkin' THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM camly_coin_transactions
    WHERE user_id = p_user_id 
      AND transaction_type = p_transaction_type
      AND DATE(created_at) = CURRENT_DATE;
    
    IF v_existing_count > 0 THEN
      RETURN QUERY SELECT FALSE, 'Already claimed today'::text, 0::numeric;
      RETURN;
    END IF;
  END IF;
  
  -- Insert the transaction
  INSERT INTO camly_coin_transactions (user_id, amount, transaction_type, description)
  VALUES (p_user_id, p_amount, p_transaction_type, p_description);
  
  -- Update user's pending rewards
  PERFORM add_user_pending_reward(p_user_id, p_amount, p_transaction_type);
  
  -- Get new balance
  SELECT pending_amount INTO v_new_balance
  FROM user_rewards WHERE user_id = p_user_id;
  
  RETURN QUERY SELECT TRUE, 'Reward added successfully'::text, COALESCE(v_new_balance, p_amount);
END;
$$;

-- 4. Create function to check if reward can be claimed
CREATE OR REPLACE FUNCTION public.can_claim_reward(
  p_user_id uuid,
  p_transaction_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing_count integer;
BEGIN
  -- Check for one-time rewards
  IF p_transaction_type IN ('wallet_connection', 'first_game_play') THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM camly_coin_transactions
    WHERE user_id = p_user_id AND transaction_type = p_transaction_type;
    
    RETURN v_existing_count = 0;
  END IF;
  
  -- Check for daily rewards
  IF p_transaction_type = 'daily_checkin' THEN
    SELECT COUNT(*) INTO v_existing_count
    FROM camly_coin_transactions
    WHERE user_id = p_user_id 
      AND transaction_type = p_transaction_type
      AND DATE(created_at) = CURRENT_DATE;
    
    RETURN v_existing_count = 0;
  END IF;
  
  -- Default: allow other types
  RETURN TRUE;
END;
$$;