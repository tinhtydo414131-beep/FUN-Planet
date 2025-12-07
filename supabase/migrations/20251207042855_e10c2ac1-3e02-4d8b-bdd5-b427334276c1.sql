-- Fix RLS policies for profiles table to prevent mobile errors

-- 1. Allow anyone to view any profile (for public profiles / find friends)
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

-- 2. Drop the old restrictive select policy that causes issues
DROP POLICY IF EXISTS "Users can view own or friends profiles" ON public.profiles;

-- 3. Add policy for authenticated users to insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. Add policy for service role trigger to insert profiles on signup
-- The handle_new_user trigger uses SECURITY DEFINER so it should work

-- 5. Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_address ON public.profiles(wallet_address);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 6. Also fix storage policies for avatars bucket
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Allow public read access to avatars
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Allow users to upload/update/delete their own avatars
CREATE POLICY "Users can upload own avatar" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);