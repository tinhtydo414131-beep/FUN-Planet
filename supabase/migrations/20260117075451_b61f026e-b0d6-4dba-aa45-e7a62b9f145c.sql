-- Update get_public_stats to exclude blocked users from counts
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    -- Only count users NOT blocked
    'total_users', (
      SELECT COUNT(*) FROM profiles p
      WHERE NOT EXISTS (
        SELECT 1 FROM admin_blocked_users abu 
        WHERE abu.user_id = p.id AND abu.status = 'blocked'
      )
    ),
    'total_games', (
      SELECT COALESCE(
        (SELECT COUNT(*) FROM uploaded_games WHERE status = 'approved'), 0
      ) + COALESCE(
        (SELECT COUNT(*) FROM lovable_games WHERE approved = true), 0
      )
    ),
    'total_uploads', (SELECT COUNT(*) FROM uploaded_games WHERE status = 'approved'),
    -- Only sum CAMLY from users NOT blocked
    'total_camly', (
      SELECT COALESCE(SUM(ur.pending_amount + ur.claimed_amount), 0) 
      FROM user_rewards ur
      WHERE NOT EXISTS (
        SELECT 1 FROM admin_blocked_users abu 
        WHERE abu.user_id = ur.user_id AND abu.status = 'blocked'
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$$;