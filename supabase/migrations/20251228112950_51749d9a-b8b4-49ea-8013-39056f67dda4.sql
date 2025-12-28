-- =====================================================
-- ANTI-FRAUD MIGRATION: Step 2 - Add unique constraints (fixed)
-- =====================================================

-- 1. Create unique index to prevent duplicate wallet_connection rewards
-- Each user can only claim wallet_connection ONCE
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_wallet_connection_reward
ON public.camly_coin_transactions(user_id)
WHERE transaction_type = 'wallet_connection';

-- 2. Create unique index to prevent duplicate first_game_play rewards
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_first_game_play_reward
ON public.camly_coin_transactions(user_id)
WHERE transaction_type = 'first_game_play';

-- 3. Add transaction_date column for daily unique constraint
ALTER TABLE public.camly_coin_transactions 
ADD COLUMN IF NOT EXISTS transaction_date date DEFAULT CURRENT_DATE;

-- Update existing rows to set transaction_date from created_at
UPDATE public.camly_coin_transactions 
SET transaction_date = created_at::date 
WHERE transaction_date IS NULL OR transaction_date = CURRENT_DATE;

-- 4. Create unique index to prevent duplicate daily_checkin per day using the new column
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_daily_checkin_per_day
ON public.camly_coin_transactions(user_id, transaction_date)
WHERE transaction_type = 'daily_checkin';