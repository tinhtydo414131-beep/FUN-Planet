-- 1. Cập nhật claimed_amount về giá trị hợp lệ (300,000 CAMLY)
UPDATE user_rewards
SET 
  claimed_amount = 300000,
  updated_at = NOW()
WHERE user_id = '8ffa196d-5af0-40d5-ace5-9188e2107595';

-- 2. Ghi log vào fraud_logs
INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken)
VALUES (
  '8ffa196d-5af0-40d5-ace5-9188e2107595',
  'balance_correction',
  'Sương Trần: Balance corrected from 5,210,000 to 300,000 CAMLY. Excess 4,910,000 was from old level completion rewards bug (10,000 CAMLY per level).',
  4910000,
  'claimed_amount reduced to match verified transactions. Previous fraud entry of 870,000 spam was noted but balance still inflated.'
);

-- 3. Xóa các giao dịch game_complete trùng lặp (giữ max 10 per day)
DELETE FROM camly_coin_transactions
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at) as rn
    FROM camly_coin_transactions
    WHERE user_id = '8ffa196d-5af0-40d5-ace5-9188e2107595'
    AND transaction_type = 'game_complete'
  ) t
  WHERE rn > 10
);