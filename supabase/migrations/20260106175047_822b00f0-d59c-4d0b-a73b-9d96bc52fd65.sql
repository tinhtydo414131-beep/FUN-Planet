-- =====================================================
-- FUN Planet Multi-Feature Sprint - Database Migration
-- =====================================================

-- 1. Game Engagement Rewards table (reward creators for popular games)
CREATE TABLE public.game_engagement_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES public.uploaded_games(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('high_rating', 'many_comments', 'popular', 'viral')),
  amount INTEGER NOT NULL DEFAULT 0,
  threshold_reached TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.game_engagement_rewards ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own engagement rewards"
  ON public.game_engagement_rewards FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "System can insert engagement rewards"
  ON public.game_engagement_rewards FOR INSERT
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_game_engagement_rewards_creator ON public.game_engagement_rewards(creator_id);
CREATE INDEX idx_game_engagement_rewards_game ON public.game_engagement_rewards(game_id);

-- 2. Interest Groups table
CREATE TABLE public.interest_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_vi TEXT,
  description TEXT,
  description_vi TEXT,
  category TEXT NOT NULL,
  icon TEXT DEFAULT '🎮',
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.interest_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can view active groups
CREATE POLICY "Anyone can view active interest groups"
  ON public.interest_groups FOR SELECT
  USING (is_active = true);

-- Insert default interest groups
INSERT INTO public.interest_groups (name, name_vi, category, icon, description, description_vi) VALUES
  ('Puzzle Masters', 'Cao Thủ Giải Đố', 'puzzle', '🧩', 'For puzzle and brain game lovers', 'Dành cho người yêu thích giải đố'),
  ('Educational Explorers', 'Khám Phá Học Vui', 'educational', '📚', 'Learn while playing', 'Học mà chơi, chơi mà học'),
  ('Creative Builders', 'Nhà Sáng Tạo', 'creative', '🎨', 'Create and share your ideas', 'Sáng tạo và chia sẻ ý tưởng'),
  ('Music Lovers', 'Yêu Âm Nhạc', 'music', '🎵', 'Rhythm and melody fans', 'Fan của giai điệu và nhịp điệu'),
  ('Adventure Seekers', 'Phiêu Lưu Ký', 'adventure', '🌍', 'Explore new worlds', 'Khám phá thế giới mới'),
  ('Kindness Club', 'Câu Lạc Bộ Tử Tế', 'kindness', '💝', 'Spread love and kindness', 'Lan tỏa yêu thương');

-- 3. User Interests table (many-to-many)
CREATE TABLE public.user_interests (
  user_id UUID NOT NULL,
  group_id UUID REFERENCES public.interest_groups(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, group_id)
);

-- Enable RLS
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Users can view all memberships (for showing group members)
CREATE POLICY "Anyone can view user interests"
  ON public.user_interests FOR SELECT
  USING (true);

-- Users can manage their own interests
CREATE POLICY "Users can join groups"
  ON public.user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- 4. System Wallets table (auto-generated wallets)
CREATE TABLE public.system_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL UNIQUE,
  encrypted_private_key TEXT,
  wallet_type TEXT DEFAULT 'system_generated',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.system_wallets ENABLE ROW LEVEL SECURITY;

-- Users can only view their own system wallet
CREATE POLICY "Users can view their own system wallet"
  ON public.system_wallets FOR SELECT
  USING (auth.uid() = user_id);

-- System can create wallets (via service role)
CREATE POLICY "System can insert wallets"
  ON public.system_wallets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index
CREATE INDEX idx_system_wallets_user ON public.system_wallets(user_id);

-- 5. Enable realtime for reward marquee
ALTER PUBLICATION supabase_realtime ADD TABLE public.behavior_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_engagement_rewards;

-- 6. Function to update interest group member count
CREATE OR REPLACE FUNCTION public.update_interest_group_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.interest_groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.interest_groups 
    SET member_count = member_count - 1 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for member count
CREATE TRIGGER update_group_member_count
AFTER INSERT OR DELETE ON public.user_interests
FOR EACH ROW EXECUTE FUNCTION public.update_interest_group_count();