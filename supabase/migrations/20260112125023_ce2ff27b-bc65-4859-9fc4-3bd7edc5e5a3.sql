-- Update get_daily_claim_remaining to read dailyClaimLimit from admin_settings
CREATE OR REPLACE FUNCTION public.get_daily_claim_remaining(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_daily_limit NUMERIC;
  v_daily_claimed NUMERIC := 0;
  v_remaining NUMERIC;
BEGIN
  -- GET DAILY LIMIT FROM ADMIN_SETTINGS
  SELECT COALESCE(
    (setting_value->>'dailyClaimLimit')::NUMERIC,
    250000  -- Fallback if not found
  ) INTO v_daily_limit
  FROM admin_settings
  WHERE setting_key = 'reward_settings'
  LIMIT 1;

  -- If no setting exists, use default
  IF v_daily_limit IS NULL THEN
    v_daily_limit := 250000;
  END IF;

  -- Get today's claimed amount from camly_claims
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_claimed
  FROM camly_claims
  WHERE user_id = p_user_id
    AND status IN ('completed', 'approved')
    AND DATE(created_at) = CURRENT_DATE;
  
  v_remaining := GREATEST(0, v_daily_limit - v_daily_claimed);
  
  RETURN jsonb_build_object(
    'daily_limit', v_daily_limit,
    'daily_claimed', v_daily_claimed,
    'daily_remaining', v_remaining
  );
END;
$function$;