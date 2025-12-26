-- System Notifications Table for Admin
CREATE TABLE IF NOT EXISTS public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_audience TEXT DEFAULT 'all', -- all, new_users, active_users, parents, children
  notification_type TEXT DEFAULT 'info', -- info, warning, success, maintenance
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  read_by UUID[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all notifications"
ON public.system_notifications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view active notifications"
ON public.system_notifications FOR SELECT
USING (is_active = true AND (sent_at IS NOT NULL OR scheduled_at IS NULL));

-- Index for faster queries
CREATE INDEX idx_system_notifications_sent_at ON public.system_notifications(sent_at DESC);
CREATE INDEX idx_system_notifications_active ON public.system_notifications(is_active) WHERE is_active = true;