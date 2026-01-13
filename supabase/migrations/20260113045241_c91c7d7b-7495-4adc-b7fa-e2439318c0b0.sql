-- Add policy to allow admins to delete any music
CREATE POLICY "Admins can delete any music"
ON public.user_music
FOR DELETE
USING (
  public.has_role(auth.uid(), 'admin')
);