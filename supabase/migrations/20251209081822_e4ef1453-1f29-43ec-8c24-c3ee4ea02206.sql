-- Create education_posts table for forum discussions
CREATE TABLE public.education_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create education_comments table
CREATE TABLE public.education_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.education_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.education_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create education_post_likes table
CREATE TABLE public.education_post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.education_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.education_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_post_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for education_posts
CREATE POLICY "Anyone can view education posts" ON public.education_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON public.education_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" ON public.education_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.education_posts
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for education_comments
CREATE POLICY "Anyone can view comments" ON public.education_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.education_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.education_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.education_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for education_post_likes
CREATE POLICY "Anyone can view likes" ON public.education_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.education_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike" ON public.education_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.education_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.education_comments;

-- Update trigger for updated_at
CREATE TRIGGER update_education_posts_updated_at
  BEFORE UPDATE ON public.education_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_education_comments_updated_at
  BEFORE UPDATE ON public.education_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();