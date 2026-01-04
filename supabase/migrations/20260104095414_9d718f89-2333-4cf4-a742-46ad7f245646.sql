-- Add category column to uploaded_games table for game type classification
ALTER TABLE public.uploaded_games 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'entertainment';

-- Add comment explaining the column
COMMENT ON COLUMN public.uploaded_games.category IS 'Game category for reward multipliers: educational, brain, puzzle, kindness, creativity, entertainment';