-- First, drop ALL existing policies on chat_room_members to avoid any conflicts
DROP POLICY IF EXISTS "Users can view members of their rooms" ON public.chat_room_members;
DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_select" ON public.chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_insert" ON public.chat_room_members;
DROP POLICY IF EXISTS "chat_room_members_delete" ON public.chat_room_members;

-- Create a security definer function to check room membership without recursion
CREATE OR REPLACE FUNCTION public.is_room_member(p_user_id uuid, p_room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.chat_room_members
    WHERE user_id = p_user_id AND room_id = p_room_id
  )
$$;

-- Create simple non-recursive policies using the security definer function
CREATE POLICY "chat_room_members_select_policy" ON public.chat_room_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR public.is_room_member(auth.uid(), room_id)
  );

CREATE POLICY "chat_room_members_insert_policy" ON public.chat_room_members
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "chat_room_members_delete_policy" ON public.chat_room_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());