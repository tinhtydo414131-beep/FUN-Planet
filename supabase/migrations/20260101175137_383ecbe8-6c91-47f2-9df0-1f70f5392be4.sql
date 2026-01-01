-- Create table to store game file hashes for duplicate prevention
CREATE TABLE IF NOT EXISTS public.uploaded_game_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_hash TEXT NOT NULL,
  game_id UUID REFERENCES public.uploaded_games(id) ON DELETE CASCADE,
  file_size BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create unique index on file_hash to prevent exact duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_game_hash ON public.uploaded_game_hashes(file_hash);

-- Enable RLS
ALTER TABLE public.uploaded_game_hashes ENABLE ROW LEVEL SECURITY;

-- Users can insert their own hashes
CREATE POLICY "Users can insert their own game hashes"
ON public.uploaded_game_hashes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own hashes
CREATE POLICY "Users can view their own game hashes"
ON public.uploaded_game_hashes
FOR SELECT
USING (auth.uid() = user_id);

-- Create table to track upload game rewards (prevent duplicate rewards per game)
CREATE TABLE IF NOT EXISTS public.upload_game_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES public.uploaded_games(id) ON DELETE CASCADE,
  reward_amount INTEGER NOT NULL DEFAULT 500000,
  claimed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, game_id)
);

-- Enable RLS
ALTER TABLE public.upload_game_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view their own upload rewards"
ON public.upload_game_rewards
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own rewards (via RPC only)
CREATE POLICY "Users can insert their own upload rewards"
ON public.upload_game_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);