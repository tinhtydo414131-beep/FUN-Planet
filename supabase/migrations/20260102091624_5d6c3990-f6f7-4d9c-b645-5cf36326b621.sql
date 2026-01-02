-- Fix function search_path for cleanup_old_deleted_games
CREATE OR REPLACE FUNCTION public.cleanup_old_deleted_games()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.uploaded_games 
  WHERE deleted_at IS NOT NULL 
  AND deleted_at < NOW() - INTERVAL '30 days';
END;
$function$;