-- Add column to track if user has accepted the Law of Light
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS accepted_law_of_light boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS accepted_law_of_light_at timestamp with time zone;