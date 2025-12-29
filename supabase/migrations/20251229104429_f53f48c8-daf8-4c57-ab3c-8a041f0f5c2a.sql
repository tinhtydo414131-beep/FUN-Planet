-- Step 1: Create temporary table to track corrections before making changes
CREATE TEMP TABLE violation_corrections AS
WITH duplicate_claims AS (
  SELECT 
    user_id,
    DATE(created_at) as claim_date,
    SUBSTRING(description FROM '(\d+) points') as score_str,
    amount,
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, DATE(created_at), SUBSTRING(description FROM '(\d+) points')
      ORDER BY created_at ASC
    ) as rn
  FROM web3_reward_transactions
  WHERE reward_type = 'ranking_reward'
),
user_violations AS (
  SELECT 
    user_id,
    SUM(amount) as excess_amount,
    COUNT(*) as duplicate_count
  FROM duplicate_claims 
  WHERE rn > 1
  GROUP BY user_id
)
SELECT 
  uv.user_id,
  uv.excess_amount,
  uv.duplicate_count,
  COALESCE(wr.camly_balance, 0) as current_balance,
  GREATEST(0, COALESCE(wr.camly_balance, 0) - uv.excess_amount) as corrected_balance
FROM user_violations uv
LEFT JOIN web3_rewards wr ON wr.user_id = uv.user_id;

-- Step 2: Delete duplicate transactions (keep only the first claim per user per day per score)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, DATE(created_at), SUBSTRING(description FROM '(\d+) points')
      ORDER BY created_at ASC
    ) as rn
  FROM web3_reward_transactions
  WHERE reward_type = 'ranking_reward'
)
DELETE FROM web3_reward_transactions
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Step 3: Log violations to suspicious_activity_logs
INSERT INTO suspicious_activity_logs (user_id, activity_type, details, risk_score, reviewed)
SELECT 
  vc.user_id,
  'duplicate_ranking_claim',
  jsonb_build_object(
    'excess_amount', vc.excess_amount,
    'duplicate_count', vc.duplicate_count,
    'previous_balance', vc.current_balance,
    'corrected_balance', vc.corrected_balance,
    'correction_date', NOW()
  ),
  90,
  true
FROM violation_corrections vc;

-- Step 4: Update web3_rewards balances
UPDATE web3_rewards wr
SET camly_balance = vc.corrected_balance
FROM violation_corrections vc
WHERE wr.user_id = vc.user_id;

-- Step 5: Also log to fraud_logs for admin visibility
INSERT INTO fraud_logs (user_id, fraud_type, description, amount_affected, action_taken, resolved_at, resolved_by)
SELECT 
  vc.user_id,
  'duplicate_ranking_claim',
  'User claimed ranking rewards multiple times for same scores. Removed ' || vc.duplicate_count || ' duplicate transactions.',
  vc.excess_amount,
  'Deducted ' || vc.excess_amount || ' CAMLY from balance. Previous: ' || vc.current_balance || ', New: ' || vc.corrected_balance,
  NOW(),
  NULL
FROM violation_corrections vc;

-- Step 6: Drop temp table
DROP TABLE violation_corrections;