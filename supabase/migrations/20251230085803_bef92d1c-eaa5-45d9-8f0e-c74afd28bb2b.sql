-- Add foreign key constraint from platform_donations.user_id to profiles.id
ALTER TABLE public.platform_donations 
ADD CONSTRAINT platform_donations_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;