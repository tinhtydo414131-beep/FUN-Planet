-- Add parent_id column for threaded comments
ALTER TABLE public.uploaded_game_comments 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.uploaded_game_comments(id) ON DELETE CASCADE;

-- Create index for faster query on parent_id
CREATE INDEX IF NOT EXISTS idx_uploaded_game_comments_parent_id 
ON public.uploaded_game_comments(parent_id);