-- Update get_daily_claim_remaining with new daily limit
CREATE OR REPLACE FUNCTION public.get_daily_claim_remaining(p_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_daily_limit NUMERIC := 500000; -- Changed from 5,000,000 to 500,000
  v_today_claimed NUMERIC;
  v_last_claim_date DATE;
BEGIN
  SELECT daily_claimed, last_claim_date INTO v_today_claimed, v_last_claim_date
  FROM user_rewards WHERE user_id = p_user_id;
  
  IF NOT FOUND OR v_last_claim_date IS NULL OR v_last_claim_date < CURRENT_DATE THEN
    RETURN v_daily_limit;
  END IF;
  
  RETURN GREATEST(0, v_daily_limit - COALESCE(v_today_claimed, 0));
END;
$function$;

-- Update get_user_trust_info with new daily limit
CREATE OR REPLACE FUNCTION public.get_user_trust_info(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_trust_score INTEGER := 0;
  v_account_age_days INTEGER;
  v_successful_claims INTEGER;
  v_cooldown_remaining INTEGER := 0;
  v_hourly_requests INTEGER;
  v_last_request TIMESTAMP WITH TIME ZONE;
  v_auto_approve_tier TEXT;
  v_daily_limit NUMERIC := 500000; -- Changed from 5,000,000 to 500,000
  v_daily_remaining NUMERIC;
  v_has_wallet BOOLEAN;
  v_games_uploaded INTEGER;
  v_fraud_flags INTEGER;
  v_ip_shared_accounts INTEGER;
BEGIN
  -- Get account age
  SELECT EXTRACT(DAY FROM (now() - created_at))::INTEGER INTO v_account_age_days
  FROM auth.users WHERE id = p_user_id;
  
  -- Check wallet connection
  SELECT wallet_address IS NOT NULL INTO v_has_wallet
  FROM profiles WHERE id = p_user_id;
  
  -- Count successful claims
  SELECT COUNT(*) INTO v_successful_claims
  FROM withdrawal_requests
  WHERE user_id = p_user_id AND status = 'completed';
  
  -- Count games uploaded
  SELECT COUNT(*) INTO v_games_uploaded
  FROM uploaded_games
  WHERE user_id = p_user_id AND status = 'approved';
  
  -- Check fraud flags
  SELECT COUNT(*) INTO v_fraud_flags
  FROM fraud_logs
  WHERE user_id = p_user_id AND resolved_at IS NULL;
  
  -- Check IP shared accounts
  SELECT COALESCE(MAX(other_users_on_ip), 0)::INTEGER INTO v_ip_shared_accounts
  FROM get_user_ip_history(p_user_id);
  
  -- Calculate trust score (0-100)
  v_trust_score := 0;
  
  -- Account age points (max 25)
  v_trust_score := v_trust_score + LEAST(25, v_account_age_days / 2);
  
  -- Wallet connected (15 points)
  IF v_has_wallet THEN
    v_trust_score := v_trust_score + 15;
  END IF;
  
  -- Successful claims history (max 30)
  v_trust_score := v_trust_score + LEAST(30, v_successful_claims * 5);
  
  -- Games uploaded (max 20)
  v_trust_score := v_trust_score + LEAST(20, v_games_uploaded * 4);
  
  -- Penalty for fraud flags (-20 each)
  v_trust_score := v_trust_score - (v_fraud_flags * 20);
  
  -- Penalty for shared IP (-10 per shared account)
  v_trust_score := v_trust_score - (v_ip_shared_accounts * 10);
  
  -- Ensure score is within 0-100
  v_trust_score := GREATEST(0, LEAST(100, v_trust_score));
  
  -- Check cooldown (30 minutes)
  SELECT EXTRACT(EPOCH FROM (now() - MAX(created_at)))::INTEGER INTO v_cooldown_remaining
  FROM withdrawal_requests
  WHERE user_id = p_user_id AND created_at > now() - INTERVAL '30 minutes';
  
  IF v_cooldown_remaining IS NOT NULL THEN
    v_cooldown_remaining := GREATEST(0, 1800 - v_cooldown_remaining);
  ELSE
    v_cooldown_remaining := 0;
  END IF;
  
  -- Count hourly requests
  SELECT COUNT(*) INTO v_hourly_requests
  FROM withdrawal_requests
  WHERE user_id = p_user_id AND created_at > now() - INTERVAL '1 hour';
  
  -- Determine auto-approve tier
  IF v_trust_score >= 50 THEN
    v_auto_approve_tier := 'platinum';
  ELSIF v_trust_score >= 40 THEN
    v_auto_approve_tier := 'gold';
  ELSIF v_trust_score >= 30 THEN
    v_auto_approve_tier := 'silver';
  ELSIF v_trust_score >= 20 THEN
    v_auto_approve_tier := 'bronze';
  ELSE
    v_auto_approve_tier := 'none';
  END IF;
  
  -- Get daily remaining
  v_daily_remaining := get_daily_claim_remaining(p_user_id);
  
  RETURN jsonb_build_object(
    'trust_score', v_trust_score,
    'account_age_days', COALESCE(v_account_age_days, 0),
    'successful_claims', v_successful_claims,
    'cooldown_remaining', v_cooldown_remaining,
    'hourly_requests_remaining', GREATEST(0, 3 - v_hourly_requests),
    'auto_approve_tier', v_auto_approve_tier,
    'daily_limit', v_daily_limit,
    'daily_remaining', v_daily_remaining,
    'has_wallet', v_has_wallet,
    'games_uploaded', v_games_uploaded
  );
END;
$function$;