-- Drop và tạo lại function get_daily_claim_remaining với return type mới
DROP FUNCTION IF EXISTS public.get_daily_claim_remaining(uuid);

CREATE OR REPLACE FUNCTION public.get_daily_claim_remaining(p_user_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_daily_limit NUMERIC := 250000; -- Giảm từ 500k xuống 250k
  v_daily_claimed NUMERIC := 0;
  v_remaining NUMERIC;
BEGIN
  -- Get today's claimed amount
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_claimed
  FROM withdrawal_requests
  WHERE user_id = p_user_id
    AND status = 'completed'
    AND DATE(created_at) = CURRENT_DATE;
  
  v_remaining := GREATEST(0, v_daily_limit - v_daily_claimed);
  
  RETURN jsonb_build_object(
    'daily_limit', v_daily_limit,
    'daily_claimed', v_daily_claimed,
    'daily_remaining', v_remaining
  );
END;
$function$;