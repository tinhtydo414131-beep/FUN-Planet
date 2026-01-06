-- Create game_appeals table for user appeals when games are auto-rejected
CREATE TABLE public.game_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.uploaded_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.game_appeals ENABLE ROW LEVEL SECURITY;

-- Users can view their own appeals
CREATE POLICY "Users can view their own appeals"
ON public.game_appeals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create appeals for their own games
CREATE POLICY "Users can create appeals for their own games"
ON public.game_appeals
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.uploaded_games
    WHERE id = game_id AND user_id = auth.uid()
  )
);

-- Admins can view all appeals
CREATE POLICY "Admins can view all appeals"
ON public.game_appeals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update appeals
CREATE POLICY "Admins can update appeals"
ON public.game_appeals
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_game_appeals_game_id ON public.game_appeals(game_id);
CREATE INDEX idx_game_appeals_user_id ON public.game_appeals(user_id);
CREATE INDEX idx_game_appeals_status ON public.game_appeals(status);

-- Enable realtime for appeals
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_appeals;