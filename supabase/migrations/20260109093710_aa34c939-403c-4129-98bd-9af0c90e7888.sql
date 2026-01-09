
-- ============================================
-- PHASE 1: XÓA GIAO DỊCH GIAN LẬN
-- ============================================

-- 1.1. Xóa duplicate first_game_play (giữ lại 1 giao dịch đầu tiên)
WITH duplicates AS (
  SELECT id, user_id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
  FROM web3_reward_transactions
  WHERE reward_type = 'first_game_play'
)
DELETE FROM web3_reward_transactions
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- 1.2. Xóa spam game_play (giữ max 10/ngày)
WITH ranked_plays AS (
  SELECT id, user_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at ASC) as rn
  FROM camly_coin_transactions
  WHERE transaction_type = 'game_play'
)
DELETE FROM camly_coin_transactions
WHERE id IN (SELECT id FROM ranked_plays WHERE rn > 10);

-- 1.3. Xóa spam game_complete (giữ max 10/ngày)
WITH ranked_completes AS (
  SELECT id, user_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY user_id, DATE(created_at) ORDER BY created_at ASC) as rn
  FROM camly_coin_transactions
  WHERE transaction_type = 'game_complete'
)
DELETE FROM camly_coin_transactions
WHERE id IN (SELECT id FROM ranked_completes WHERE rn > 10);

-- ============================================
-- PHASE 2: CẬP NHẬT SỐ DƯ CHO CÁC USERS
-- ============================================

-- 2.1. Tính tổng CAMLY hợp lệ từ transactions còn lại
WITH valid_totals AS (
  SELECT 
    user_id,
    COALESCE(SUM(amount), 0) as valid_total
  FROM camly_coin_transactions
  WHERE transaction_type IN ('game_play', 'game_complete', 'daily_login', 'upload_reward', 'referral', 'achievement', 'combo_prize', 'ranking_claim', 'behavior_reward')
  GROUP BY user_id
)
UPDATE user_rewards ur
SET 
  pending_amount = GREATEST(0, COALESCE(vt.valid_total, 0) - ur.claimed_amount),
  total_earned = GREATEST(0, COALESCE(vt.valid_total, 0))
FROM valid_totals vt
WHERE ur.user_id = vt.user_id;

-- 2.2. Reset số dư âm về 0
UPDATE user_rewards 
SET pending_amount = 0, total_earned = GREATEST(0, total_earned)
WHERE pending_amount < 0;

-- 2.3. Sync profiles.wallet_balance với user_rewards.pending_amount
UPDATE profiles p
SET wallet_balance = ur.pending_amount
FROM user_rewards ur
WHERE p.id = ur.user_id;

-- 2.4. Sync web3_rewards.camly_balance với profiles.wallet_balance
UPDATE web3_rewards wr
SET camly_balance = p.wallet_balance
FROM profiles p
WHERE wr.user_id = p.id;

-- ============================================
-- PHASE 3: GHI LOG AUDIT
-- ============================================

-- 3.1. Log cho các users bị xử lý (top offenders)
INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken, detected_at)
VALUES 
  ('52aefa2a-1581-4211-8ca8-e634408cbed6', 'game_reward_spam', 'Duplicate first_game_play + game_play/complete spam (2,830,000 CAMLY)', 2830000, 'Transactions deleted, balance reset to 0', NOW()),
  ('c75890d4-8281-450c-8674-1a1bbbcc5765', 'game_reward_spam', 'Game play/complete spam across multiple days (2,390,000 CAMLY)', 2390000, 'Transactions deleted, balance deducted', NOW()),
  ('fd03d6e3-92f1-481d-a612-a221e166f665', 'game_reward_spam', 'Game play spam 66+ times/day (2,330,000 CAMLY)', 2330000, 'Transactions deleted, balance: 4,313,010 -> 1,983,010', NOW()),
  ('4ea8577b-4582-4f23-b02a-cab7e1b6ab7b', 'game_reward_spam', 'Game complete spam (1,040,000 CAMLY)', 1040000, 'Transactions deleted, balance deducted', NOW()),
  ('fab46cb9-f0f8-453c-9b0e-52b28d482896', 'game_reward_spam', 'Game play/complete spam (1,010,000 CAMLY)', 1010000, 'Transactions deleted, balance deducted', NOW()),
  ('8ffa196d-5af0-40d5-ace5-9188e2107595', 'game_reward_spam', 'Duplicate first_game_play + game_complete spam (870,000 CAMLY)', 870000, 'Transactions deleted, negative balance reset to 0', NOW()),
  ('bf23c705-586b-4ff3-a04f-2ec524da13db', 'game_reward_spam', 'Game complete spam (480,000 CAMLY)', 480000, 'Transactions deleted, balance deducted', NOW()),
  ('040f03ab-037e-459a-975a-793e0e8ed210', 'game_reward_spam', 'Game complete spam (400,000 CAMLY)', 400000, 'Transactions deleted, balance deducted', NOW()),
  ('6bd320b8-ed76-4f25-b9f6-7a283fc0360b', 'game_reward_spam', 'Game complete spam (230,000 CAMLY)', 230000, 'Transactions deleted, balance deducted', NOW()),
  ('fd79962c-9f76-4448-83f6-757a8bb4de6d', 'game_reward_spam', 'Game play spam (150,000 CAMLY)', 150000, 'Transactions deleted, balance: 1,956,870 -> 1,806,870', NOW()),
  ('6d93b2e7-57c8-4ccd-a76e-ec27f3c4eb7e', 'game_reward_spam', 'Game complete spam (100,000 CAMLY)', 100000, 'Transactions deleted, balance deducted', NOW()),
  ('b1717ea1-cfb4-48b3-87d6-6848d4ef743b', 'game_reward_spam', 'Game complete spam (70,000 CAMLY)', 70000, 'Transactions deleted, balance deducted', NOW()),
  ('0f55e3f9-15a9-401a-8af6-c46e6d5db8ab', 'game_reward_spam', 'Game play spam (60,000 CAMLY)', 60000, 'Transactions deleted, balance deducted', NOW())
ON CONFLICT DO NOTHING;

-- 3.2. Log cho các users có số dư âm đã reset
INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken, detected_at)
SELECT 
  id,
  'negative_balance_reset',
  'Negative balance detected and reset to 0',
  ABS(wallet_balance),
  'Balance reset from ' || wallet_balance || ' to 0',
  NOW()
FROM profiles
WHERE wallet_balance < 0
ON CONFLICT DO NOTHING;
