
-- 1. Tạo function sync tất cả balances cho user
CREATE OR REPLACE FUNCTION public.sync_user_reward_balances(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_claimed NUMERIC := 0;
  v_wallet_balance NUMERIC := 0;
  v_pending NUMERIC := 0;
  v_total_earned NUMERIC := 0;
BEGIN
  -- Tính tổng đã claim từ web3_reward_transactions (nguồn chính xác nhất)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_claimed
  FROM web3_reward_transactions
  WHERE user_id = p_user_id;
  
  -- Lấy wallet_balance hiện tại từ profiles
  SELECT COALESCE(wallet_balance, 0) INTO v_wallet_balance
  FROM profiles WHERE id = p_user_id;
  
  -- Tính total_earned = đã claim + đang pending (wallet_balance)
  v_total_earned := v_total_claimed + v_wallet_balance;
  v_pending := v_wallet_balance;
  
  -- Update user_rewards với số liệu chính xác
  INSERT INTO user_rewards (user_id, pending_amount, claimed_amount, total_earned)
  VALUES (p_user_id, v_pending, v_total_claimed, v_total_earned)
  ON CONFLICT (user_id) DO UPDATE SET
    pending_amount = v_pending,
    claimed_amount = v_total_claimed,
    total_earned = v_total_earned,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'pending', v_pending,
    'claimed', v_total_claimed,
    'total_earned', v_total_earned
  );
END;
$function$;

-- 2. Tạo function admin để sync tất cả users
CREATE OR REPLACE FUNCTION public.admin_sync_all_rewards()
RETURNS TABLE(user_id uuid, pending numeric, claimed numeric, total_earned numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user RECORD;
  v_result jsonb;
BEGIN
  FOR v_user IN SELECT id FROM profiles LOOP
    v_result := sync_user_reward_balances(v_user.id);
    user_id := (v_result->>'user_id')::uuid;
    pending := (v_result->>'pending')::numeric;
    claimed := (v_result->>'claimed')::numeric;
    total_earned := (v_result->>'total_earned')::numeric;
    RETURN NEXT;
  END LOOP;
END;
$function$;

-- 3. Tạo trigger function để tự động sync khi có transaction mới
CREATE OR REPLACE FUNCTION public.sync_claimed_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Khi INSERT vào web3_reward_transactions, update user_rewards.claimed_amount
  UPDATE user_rewards
  SET 
    claimed_amount = claimed_amount + NEW.amount,
    total_earned = total_earned + NEW.amount,
    updated_at = now()
  WHERE user_id = NEW.user_id;
  
  -- Nếu chưa có record trong user_rewards, tạo mới
  IF NOT FOUND THEN
    INSERT INTO user_rewards (user_id, pending_amount, claimed_amount, total_earned)
    VALUES (NEW.user_id, 0, NEW.amount, NEW.amount);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Tạo trigger trên web3_reward_transactions
DROP TRIGGER IF EXISTS trigger_sync_claimed_on_transaction ON web3_reward_transactions;
CREATE TRIGGER trigger_sync_claimed_on_transaction
AFTER INSERT ON web3_reward_transactions
FOR EACH ROW
EXECUTE FUNCTION sync_claimed_on_transaction();

-- 5. Sửa function claim để trừ pending khi claim
CREATE OR REPLACE FUNCTION public.process_reward_claim(
  p_user_id uuid,
  p_amount numeric,
  p_wallet_address text,
  p_tx_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_pending NUMERIC;
BEGIN
  -- Lấy pending hiện tại
  SELECT pending_amount INTO v_pending
  FROM user_rewards WHERE user_id = p_user_id;
  
  IF v_pending IS NULL OR v_pending < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient pending balance');
  END IF;
  
  -- Trừ pending, cộng claimed
  UPDATE user_rewards
  SET 
    pending_amount = pending_amount - p_amount,
    claimed_amount = claimed_amount + p_amount,
    last_claim_amount = p_amount,
    last_claim_at = now(),
    wallet_address = p_wallet_address,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Trừ wallet_balance trong profiles
  UPDATE profiles
  SET wallet_balance = GREATEST(0, wallet_balance - p_amount)
  WHERE id = p_user_id
  RETURNING wallet_balance INTO v_new_balance;
  
  -- Log vào daily_claim_logs
  INSERT INTO daily_claim_logs (user_id, amount_claimed, tx_hash)
  VALUES (p_user_id, p_amount, p_tx_hash);
  
  RETURN jsonb_build_object(
    'success', true,
    'claimed_amount', p_amount,
    'new_balance', v_new_balance
  );
END;
$function$;

-- 6. Tạo view để lấy thống kê chính xác cho leaderboard
CREATE OR REPLACE VIEW public.leaderboard_stats AS
SELECT 
  p.id as user_id,
  p.username,
  p.avatar_url,
  p.wallet_address,
  COALESCE(p.wallet_balance, 0) as pending_balance,
  COALESCE((SELECT SUM(amount) FROM web3_reward_transactions wrt WHERE wrt.user_id = p.id), 0) as total_claimed,
  COALESCE(p.wallet_balance, 0) + COALESCE((SELECT SUM(amount) FROM web3_reward_transactions wrt WHERE wrt.user_id = p.id), 0) as total_earned
FROM profiles p
ORDER BY COALESCE(p.wallet_balance, 0) + COALESCE((SELECT SUM(amount) FROM web3_reward_transactions wrt WHERE wrt.user_id = p.id), 0) DESC;

-- 7. Chạy sync cho tất cả users hiện tại
SELECT admin_sync_all_rewards();
