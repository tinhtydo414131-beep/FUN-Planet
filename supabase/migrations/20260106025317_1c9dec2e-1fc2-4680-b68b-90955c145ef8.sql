-- Create email_analytics table for tracking email opens and clicks
CREATE TABLE public.email_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL UNIQUE,
  recipient_email TEXT NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  email_type TEXT NOT NULL,
  subject TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  click_count INTEGER DEFAULT 0,
  tracking_pixel_loaded BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for fast queries
CREATE INDEX idx_email_analytics_user_id ON public.email_analytics(user_id);
CREATE INDEX idx_email_analytics_email_type ON public.email_analytics(email_type);
CREATE INDEX idx_email_analytics_sent_at ON public.email_analytics(sent_at);
CREATE INDEX idx_email_analytics_email_id ON public.email_analytics(email_id);

-- Enable RLS
ALTER TABLE public.email_analytics ENABLE ROW LEVEL SECURITY;

-- Admin can view all email analytics (using user_roles table)
CREATE POLICY "Admins can view all email analytics" ON public.email_analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Admin can insert email analytics
CREATE POLICY "Admins can insert email analytics" ON public.email_analytics
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Allow public insert for edge functions (service role)
CREATE POLICY "Allow insert for tracking" ON public.email_analytics
  FOR INSERT WITH CHECK (true);

-- Allow public update for tracking pixel and clicks
CREATE POLICY "Allow update for tracking" ON public.email_analytics
  FOR UPDATE USING (true) WITH CHECK (true);