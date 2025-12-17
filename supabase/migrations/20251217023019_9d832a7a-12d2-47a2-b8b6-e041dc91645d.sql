-- Update get_or_create_user_rewards function to sync wallet_balance from profiles
CREATE OR REPLACE FUNCTION public.get_or_create_user_rewards(p_user_id uuid)
 RETURNS user_rewards
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rewards public.user_rewards;
  v_wallet_balance numeric;
BEGIN
  SELECT * INTO v_rewards FROM user_rewards WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    -- Get existing wallet_balance from profiles
    SELECT COALESCE(wallet_balance, 0) INTO v_wallet_balance 
    FROM profiles WHERE id = p_user_id;
    
    -- Create new user_rewards with wallet_balance as pending_amount
    INSERT INTO user_rewards (user_id, pending_amount, total_earned) 
    VALUES (p_user_id, v_wallet_balance, v_wallet_balance) 
    RETURNING * INTO v_rewards;
  ELSE
    -- If user_rewards exists but pending_amount is 0, sync from wallet_balance
    IF v_rewards.pending_amount = 0 AND v_rewards.total_earned = 0 THEN
      SELECT COALESCE(wallet_balance, 0) INTO v_wallet_balance 
      FROM profiles WHERE id = p_user_id;
      
      IF v_wallet_balance > 0 THEN
        UPDATE user_rewards 
        SET pending_amount = v_wallet_balance, 
            total_earned = v_wallet_balance,
            updated_at = now()
        WHERE user_id = p_user_id
        RETURNING * INTO v_rewards;
      END IF;
    END IF;
  END IF;
  
  RETURN v_rewards;
END;
$function$;

-- Also sync existing user_rewards records that have 0 pending but profiles have balance
UPDATE user_rewards ur
SET pending_amount = p.wallet_balance,
    total_earned = p.wallet_balance,
    updated_at = now()
FROM profiles p
WHERE ur.user_id = p.id
AND ur.pending_amount = 0
AND ur.total_earned = 0
AND ur.claimed_amount = 0
AND p.wallet_balance > 0;