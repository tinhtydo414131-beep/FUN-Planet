CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_games', (
      SELECT COALESCE(
        (SELECT COUNT(*) FROM uploaded_games WHERE status = 'approved'), 0
      ) + COALESCE(
        (SELECT COUNT(*) FROM lovable_games WHERE approved = true), 0
      )
    ),
    -- CHỈ ĐẾM APPROVED GAMES thay vì tất cả uploads
    'total_uploads', (SELECT COUNT(*) FROM uploaded_games WHERE status = 'approved'),
    'total_camly', (
      SELECT COALESCE(SUM(pending_amount + claimed_amount), 0) 
      FROM user_rewards
    )
  ) INTO result;
  
  RETURN result;
END;
$$;