-- Cho phép guest users (anon) xem profiles cho Honor Board và Top Ranking
CREATE POLICY "Allow public read for profiles"
ON public.profiles
FOR SELECT
TO anon
USING (true);