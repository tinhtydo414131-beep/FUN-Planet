-- Allow public read for leaderboard purposes (only non-sensitive columns like pending_amount, claimed_amount)
-- This enables leaderboard to display rankings for all users
CREATE POLICY "Allow public read for leaderboard"
ON public.user_rewards
FOR SELECT
TO anon, authenticated
USING (true);