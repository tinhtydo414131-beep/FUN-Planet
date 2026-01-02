-- Allow anyone to view user_rewards for leaderboard display
-- This is safe because user_rewards only contains non-sensitive aggregated data (pending, claimed, total)
-- INSERT/UPDATE policies remain unchanged - only the owner can modify their own rewards
CREATE POLICY "Anyone can view rewards for leaderboard"
ON public.user_rewards FOR SELECT
USING (true);