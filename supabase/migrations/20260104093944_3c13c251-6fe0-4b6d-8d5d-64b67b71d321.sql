-- Add birth_year column to profiles for age-based reward display
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_year INTEGER;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.birth_year IS 'Year of birth for age-based reward calculations and child-friendly UI';
