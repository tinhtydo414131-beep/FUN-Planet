-- Create fun_id table for Universal Identity
CREATE TABLE public.fun_id (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  wallet_address text,
  soul_nft_id text,
  soul_nft_name text DEFAULT 'Hạt Giống Ánh Sáng',
  energy_level integer DEFAULT 1,
  light_points integer DEFAULT 0,
  role text DEFAULT 'kid',
  display_name text,
  avatar_glow_color text DEFAULT '#FFD700',
  created_at timestamp with time zone DEFAULT now(),
  last_angel_message text,
  last_activity_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fun_id ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own FUN-ID"
ON public.fun_id FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FUN-ID"
ON public.fun_id FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FUN-ID"
ON public.fun_id FOR UPDATE
USING (auth.uid() = user_id);

-- Public view for leaderboard/profiles
CREATE POLICY "Anyone can view public FUN-ID info"
ON public.fun_id FOR SELECT
USING (true);

-- Function to auto-create FUN-ID when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_fun_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  soul_number INTEGER;
BEGIN
  -- Generate unique Soul NFT number
  SELECT COALESCE(MAX(CAST(SUBSTRING(soul_nft_id FROM '#(\d+)$') AS INTEGER)), 0) + 1
  INTO soul_number
  FROM public.fun_id;
  
  INSERT INTO public.fun_id (user_id, soul_nft_id, soul_nft_name, display_name)
  VALUES (
    NEW.id,
    '#' || LPAD(soul_number::text, 6, '0'),
    'Hạt Giống Ánh Sáng #' || soul_number,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
  );
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create FUN-ID
CREATE TRIGGER on_auth_user_created_fun_id
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_fun_id();

-- Enable realtime for fun_id
ALTER PUBLICATION supabase_realtime ADD TABLE public.fun_id;