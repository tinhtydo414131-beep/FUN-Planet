-- Add likes_count and dislikes_count columns to uploaded_game_comments
ALTER TABLE public.uploaded_game_comments 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes_count INTEGER DEFAULT 0;

-- Create table for tracking comment votes
CREATE TABLE public.uploaded_game_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.uploaded_game_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.uploaded_game_comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comment likes
CREATE POLICY "Anyone can view comment votes"
ON public.uploaded_game_comment_likes FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own votes"
ON public.uploaded_game_comment_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
ON public.uploaded_game_comment_likes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
ON public.uploaded_game_comment_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_comment_likes_comment_id ON public.uploaded_game_comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON public.uploaded_game_comment_likes(user_id);

-- Function to update likes/dislikes count
CREATE OR REPLACE FUNCTION update_comment_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'like' THEN
      UPDATE public.uploaded_game_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    ELSE
      UPDATE public.uploaded_game_comments SET dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'like' THEN
      UPDATE public.uploaded_game_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
    ELSE
      UPDATE public.uploaded_game_comments SET dislikes_count = GREATEST(0, dislikes_count - 1) WHERE id = OLD.comment_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type != NEW.vote_type THEN
      IF OLD.vote_type = 'like' THEN
        UPDATE public.uploaded_game_comments SET likes_count = GREATEST(0, likes_count - 1), dislikes_count = dislikes_count + 1 WHERE id = NEW.comment_id;
      ELSE
        UPDATE public.uploaded_game_comments SET dislikes_count = GREATEST(0, dislikes_count - 1), likes_count = likes_count + 1 WHERE id = NEW.comment_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for vote count updates
CREATE TRIGGER trigger_update_comment_votes
AFTER INSERT OR UPDATE OR DELETE ON public.uploaded_game_comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_vote_counts();

-- Function to notify comment author
CREATE OR REPLACE FUNCTION notify_comment_author()
RETURNS TRIGGER AS $$
DECLARE
  parent_author_id UUID;
  game_owner_id UUID;
  commenter_name TEXT;
  game_title TEXT;
BEGIN
  -- Get commenter username
  SELECT username INTO commenter_name 
  FROM public.profiles WHERE id = NEW.user_id;
  
  -- Get game title
  SELECT title INTO game_title
  FROM public.uploaded_games WHERE id = NEW.game_id;
  
  -- If this is a reply, notify the parent comment author
  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_author_id 
    FROM public.uploaded_game_comments WHERE id = NEW.parent_id;
    
    IF parent_author_id IS NOT NULL AND parent_author_id != NEW.user_id THEN
      INSERT INTO public.user_notifications (
        user_id, notification_type, title, message, data
      ) VALUES (
        parent_author_id,
        'comment_reply',
        'Có người trả lời bình luận của bạn',
        COALESCE(commenter_name, 'Ai đó') || ' đã trả lời bình luận của bạn',
        jsonb_build_object(
          'comment_id', NEW.id,
          'game_id', NEW.game_id,
          'game_title', game_title,
          'commenter_id', NEW.user_id,
          'commenter_name', commenter_name
        )
      );
    END IF;
  END IF;
  
  -- Notify game owner about new comment (not replies)
  IF NEW.parent_id IS NULL THEN
    SELECT user_id INTO game_owner_id 
    FROM public.uploaded_games WHERE id = NEW.game_id;
    
    IF game_owner_id IS NOT NULL AND game_owner_id != NEW.user_id THEN
      INSERT INTO public.user_notifications (
        user_id, notification_type, title, message, data
      ) VALUES (
        game_owner_id,
        'new_game_comment',
        'Bình luận mới trên game của bạn',
        COALESCE(commenter_name, 'Ai đó') || ' đã bình luận về ' || COALESCE(game_title, 'game của bạn'),
        jsonb_build_object(
          'comment_id', NEW.id,
          'game_id', NEW.game_id,
          'game_title', game_title,
          'commenter_id', NEW.user_id,
          'commenter_name', commenter_name
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for comment notifications
CREATE TRIGGER trigger_notify_comment
AFTER INSERT ON public.uploaded_game_comments
FOR EACH ROW EXECUTE FUNCTION notify_comment_author();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.uploaded_game_comments;