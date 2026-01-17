-- Add RLS policy for admin to view all web3_rewards records
-- This allows AdminUsersTab to display CAMLY balance for all users

CREATE POLICY "Admins can view all web3_rewards"
ON public.web3_rewards
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));