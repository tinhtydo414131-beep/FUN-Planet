-- Đồng bộ tất cả user_rewards chưa có hoặc pending_amount không khớp với profiles.wallet_balance
-- Bước 1: Insert cho users chưa có record trong user_rewards
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

-- Bước 2: Cập nhật các user_rewards đã có nhưng pending_amount không khớp
UPDATE user_rewards ur
SET 
  pending_amount = p.wallet_balance,
  updated_at = NOW()
FROM profiles p
WHERE ur.user_id = p.id
AND ur.pending_amount != p.wallet_balance;