-- Add external_url column to uploaded_games for games hosted on external platforms
ALTER TABLE public.uploaded_games 
ADD COLUMN external_url TEXT DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.uploaded_games.external_url IS 'Optional URL for games hosted on external platforms like Vercel or Netlify';