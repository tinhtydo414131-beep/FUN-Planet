-- Table: admin_blocked_users - Quản lý user bị block bởi admin
CREATE TABLE public.admin_blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_by UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  evidence JSONB DEFAULT '{}',
  status TEXT DEFAULT 'blocked' CHECK (status IN ('blocked', 'unblocked', 'under_review')),
  created_at TIMESTAMPTZ DEFAULT now(),
  unblocked_at TIMESTAMPTZ,
  UNIQUE(user_id)
);

-- Table: suspicious_activity_logs - Log hoạt động đáng ngờ
CREATE TABLE public.suspicious_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  risk_score INTEGER DEFAULT 0,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES profiles(id),
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table: reward_approval_queue - Hàng đợi xét duyệt thưởng
CREATE TABLE public.reward_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  reward_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- Table: project_wallet_stats - Thống kê ví dự án
CREATE TABLE public.project_wallet_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_supply NUMERIC DEFAULT 1000000000000,
  total_distributed NUMERIC DEFAULT 0,
  total_pending NUMERIC DEFAULT 0,
  total_claimed NUMERIC DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_wallet_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_blocked_users
CREATE POLICY "Admins can manage blocked users"
ON public.admin_blocked_users FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view if they are blocked"
ON public.admin_blocked_users FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for suspicious_activity_logs
CREATE POLICY "Admins can manage suspicious activity logs"
ON public.suspicious_activity_logs FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for reward_approval_queue
CREATE POLICY "Admins can manage reward approvals"
ON public.reward_approval_queue FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own pending approvals"
ON public.reward_approval_queue FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policies for project_wallet_stats
CREATE POLICY "Anyone can view project stats"
ON public.project_wallet_stats FOR SELECT
USING (true);

CREATE POLICY "Admins can update project stats"
ON public.project_wallet_stats FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert project stats"
ON public.project_wallet_stats FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert initial project wallet stats
INSERT INTO public.project_wallet_stats (total_supply, total_distributed, total_pending, total_claimed)
VALUES (1000000000000, 0, 0, 0);

-- Create indexes for performance
CREATE INDEX idx_admin_blocked_users_user_id ON public.admin_blocked_users(user_id);
CREATE INDEX idx_admin_blocked_users_status ON public.admin_blocked_users(status);
CREATE INDEX idx_suspicious_activity_user_id ON public.suspicious_activity_logs(user_id);
CREATE INDEX idx_suspicious_activity_reviewed ON public.suspicious_activity_logs(reviewed);
CREATE INDEX idx_reward_approval_status ON public.reward_approval_queue(status);
CREATE INDEX idx_reward_approval_user_id ON public.reward_approval_queue(user_id);