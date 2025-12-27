-- Enable realtime for uploaded_games table
ALTER PUBLICATION supabase_realtime ADD TABLE public.uploaded_games;

-- Enable realtime for suspicious_activity_logs table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.suspicious_activity_logs;

-- Enable realtime for admin_blocked_users table
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_blocked_users;

-- Create admin_realtime_notifications table for persistent notifications
CREATE TABLE IF NOT EXISTS public.admin_realtime_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  read_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.admin_realtime_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Admins can view notifications"
ON public.admin_realtime_notifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update notifications (mark as read)
CREATE POLICY "Admins can update notifications"
ON public.admin_realtime_notifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert notifications (via triggers)
CREATE POLICY "System can insert notifications"
ON public.admin_realtime_notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for admin notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_realtime_notifications;

-- Create function to auto-create notification when game is submitted
CREATE OR REPLACE FUNCTION public.notify_admin_new_game()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO admin_realtime_notifications (notification_type, title, message, priority, data)
    VALUES (
      'new_game',
      'New Game Submitted',
      'Game "' || COALESCE(NEW.title, 'Untitled') || '" needs review',
      'medium',
      jsonb_build_object('game_id', NEW.id, 'title', NEW.title, 'user_id', NEW.user_id)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for new game submissions
DROP TRIGGER IF EXISTS on_new_game_submitted ON public.uploaded_games;
CREATE TRIGGER on_new_game_submitted
  AFTER INSERT ON public.uploaded_games
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_game();

-- Create function to auto-create notification for suspicious activity
CREATE OR REPLACE FUNCTION public.notify_admin_suspicious_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO admin_realtime_notifications (notification_type, title, message, priority, data)
  VALUES (
    'suspicious_activity',
    'Suspicious Activity Detected',
    COALESCE(NEW.activity_type, 'Unknown') || ' - Risk Score: ' || COALESCE(NEW.risk_score::text, 'N/A'),
    CASE WHEN COALESCE(NEW.risk_score, 0) >= 80 THEN 'high' ELSE 'medium' END,
    jsonb_build_object('activity_id', NEW.id, 'user_id', NEW.user_id, 'activity_type', NEW.activity_type, 'risk_score', NEW.risk_score)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for suspicious activity
DROP TRIGGER IF EXISTS on_suspicious_activity ON public.suspicious_activity_logs;
CREATE TRIGGER on_suspicious_activity
  AFTER INSERT ON public.suspicious_activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_suspicious_activity();