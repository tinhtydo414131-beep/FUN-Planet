-- Cho phép guest users (anon) xem uploaded_games cho Honor Board
CREATE POLICY "Allow public read for uploaded_games"
ON public.uploaded_games
FOR SELECT
TO anon
USING (true);

-- Cho phép guest users (anon) xem lovable_games cho Honor Board
CREATE POLICY "Allow public read for lovable_games"
ON public.lovable_games
FOR SELECT
TO anon
USING (true);

-- Cho phép guest users (anon) xem game_plays cho Honor Board
CREATE POLICY "Allow public read for game_plays"
ON public.game_plays
FOR SELECT
TO anon
USING (true);

-- Cho phép guest users (anon) xem user_rewards cho Top Ranking
CREATE POLICY "Allow public read for user_rewards"
ON public.user_rewards
FOR SELECT
TO anon
USING (true);