-- Sync all user_rewards.pending_amount with profiles.wallet_balance

-- Insert user_rewards for users who don't have an entry yet but have wallet_balance > 0
INSERT INTO user_rewards (user_id, pending_amount, total_earned, updated_at)
SELECT 
  p.id,
  COALESCE(p.wallet_balance, 0),
  COALESCE(p.wallet_balance, 0),
  NOW()
FROM profiles p
LEFT JOIN user_rewards ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL AND p.wallet_balance > 0
ON CONFLICT (user_id) DO UPDATE
SET 
  pending_amount = EXCLUDED.pending_amount,
  updated_at = NOW();

-- Update existing user_rewards entries where pending_amount doesn't match profiles.wallet_balance
UPDATE user_rewards ur
SET 
  pending_amount = p.wallet_balance,
  updated_at = NOW()
FROM profiles p
WHERE ur.user_id = p.id
AND ur.pending_amount != p.wallet_balance;