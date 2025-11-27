-- Create table for user uploaded music
CREATE TABLE public.user_music (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  artist text,
  storage_path text NOT NULL,
  file_size bigint,
  duration text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_music ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view uploaded music"
ON public.user_music
FOR SELECT
USING (true);

CREATE POLICY "Users can upload their own music"
ON public.user_music
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own music"
ON public.user_music
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own music"
ON public.user_music
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_music_updated_at
BEFORE UPDATE ON public.user_music
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_user_music_user_id ON public.user_music(user_id);
CREATE INDEX idx_user_music_created_at ON public.user_music(created_at DESC);