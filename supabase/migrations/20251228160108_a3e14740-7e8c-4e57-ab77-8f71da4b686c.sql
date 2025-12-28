
-- Clean up duplicate wallets - keep the first user (older account), remove from others
-- For each duplicate pair, set wallet_address to NULL for the newer account

-- 1. 0x3ab8c267936f21cf4f8e50a4f2272f982ec05b1a - keep DO THI MINH AN (47d0d5ca), remove from Bé Ân (23727438)
UPDATE profiles SET wallet_address = NULL WHERE id = '23727438-8377-4e62-bc9d-844b9858f095';

-- 2. 0xcc0e4b14410eaed1598d68a4a17b455957725e53 - keep Angel_ThuHuyen88 (d25a06dd), remove from Angel Thu Huyen (fd79962c)
UPDATE profiles SET wallet_address = NULL WHERE id = 'fd79962c-9f76-4448-83f6-757a8bb4de6d';

-- 3. 0x7c41aab9d17932d459e4d0a828abff7629147534 - keep Khánh Tống (b1717ea1), remove from EmbeKhanhTong (c75890d4)
UPDATE profiles SET wallet_address = NULL WHERE id = 'c75890d4-8281-450c-8674-1a1bbbcc5765';

-- 4. 0x086A986158aB92fA6908EDe1B0946d3a257Cbfdb - keep TUNGNGUYEN (46d5e6da), remove from nguyenducthinh (5198e184)
UPDATE profiles SET wallet_address = NULL WHERE id = '5198e184-f003-401b-8f0f-aa0e869d970c';

-- 5. 0x475f725e8d7005e99226a14762d80f77c6418ee0 - keep nguyenthanhtinh (b653a8b4), remove from angeltinh (52aefa2a)
UPDATE profiles SET wallet_address = NULL WHERE id = '52aefa2a-1581-4211-8ca8-e634408cbed6';

-- 6. 0xb9ee4fed25764dddc04b614ea50c9a6c1f33bb19 - keep Vinh Nguyễn (040f03ab), remove from Vinh Nguyễn (fab46cb9)
UPDATE profiles SET wallet_address = NULL WHERE id = 'fab46cb9-f0f8-453c-9b0e-52b28d482896';

-- Now add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_wallet_address 
ON public.profiles(wallet_address) 
WHERE wallet_address IS NOT NULL;

-- Create the eligibility check function
CREATE OR REPLACE FUNCTION public.check_wallet_eligibility(
  p_user_id UUID,
  p_wallet_address TEXT
) RETURNS TABLE (
  can_connect BOOLEAN,
  reason TEXT,
  existing_user_id UUID,
  wallet_changes_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_user_id UUID;
  v_is_blacklisted BOOLEAN;
  v_blacklist_reason TEXT;
  v_wallet_changes INTEGER;
  v_max_wallet_changes INTEGER := 3;
  v_current_wallet TEXT;
BEGIN
  -- Check if wallet is in blacklist
  SELECT wb.is_active, wb.reason INTO v_is_blacklisted, v_blacklist_reason
  FROM wallet_blacklist wb
  WHERE LOWER(wb.wallet_address) = LOWER(p_wallet_address) AND wb.is_active = true
  LIMIT 1;
  
  IF v_is_blacklisted THEN
    RETURN QUERY SELECT FALSE, ('Wallet is blacklisted: ' || v_blacklist_reason)::TEXT, NULL::UUID, 0;
    RETURN;
  END IF;
  
  -- Check if wallet is already used by another user
  SELECT p.id INTO v_existing_user_id
  FROM profiles p
  WHERE LOWER(p.wallet_address) = LOWER(p_wallet_address) AND p.id != p_user_id
  LIMIT 1;
  
  IF v_existing_user_id IS NOT NULL THEN
    RETURN QUERY SELECT FALSE, 'Wallet is already connected to another account'::TEXT, v_existing_user_id, 0;
    RETURN;
  END IF;
  
  -- Get current wallet of user
  SELECT p.wallet_address INTO v_current_wallet
  FROM profiles p WHERE p.id = p_user_id;
  
  -- If same wallet, allow
  IF LOWER(v_current_wallet) = LOWER(p_wallet_address) THEN
    RETURN QUERY SELECT TRUE, 'Wallet already connected to this account'::TEXT, NULL::UUID, 0;
    RETURN;
  END IF;
  
  -- Count how many times user has changed wallet
  SELECT COUNT(*) INTO v_wallet_changes
  FROM wallet_history wh
  WHERE wh.user_id = p_user_id AND wh.action IN ('connected', 'changed');
  
  -- If user already has a wallet and trying to change, check limit
  IF v_current_wallet IS NOT NULL AND v_wallet_changes >= v_max_wallet_changes THEN
    RETURN QUERY SELECT FALSE, ('Maximum wallet changes reached (' || v_max_wallet_changes || '). Contact admin.')::TEXT, NULL::UUID, v_wallet_changes;
    RETURN;
  END IF;
  
  -- All checks passed
  RETURN QUERY SELECT TRUE, 'Wallet eligible for connection'::TEXT, NULL::UUID, v_wallet_changes;
END;
$$;

-- Create function to log wallet connection
CREATE OR REPLACE FUNCTION public.log_wallet_connection(
  p_user_id UUID,
  p_wallet_address TEXT,
  p_previous_wallet TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF p_previous_wallet IS NULL THEN
    v_action := 'connected';
  ELSE
    v_action := 'changed';
  END IF;
  
  INSERT INTO wallet_history (user_id, wallet_address, action, previous_wallet)
  VALUES (p_user_id, p_wallet_address, v_action, p_previous_wallet);
  
  RETURN TRUE;
END;
$$;

-- Create function to get wallet fraud stats for admin
CREATE OR REPLACE FUNCTION public.get_wallet_fraud_stats()
RETURNS TABLE (
  total_wallets BIGINT,
  blacklisted_wallets BIGINT,
  users_with_multiple_changes BIGINT,
  suspicious_patterns BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(DISTINCT wallet_address) FROM profiles WHERE wallet_address IS NOT NULL)::BIGINT,
    (SELECT COUNT(*) FROM wallet_blacklist WHERE is_active = true)::BIGINT,
    (SELECT COUNT(*) FROM (
      SELECT user_id FROM wallet_history 
      GROUP BY user_id HAVING COUNT(*) > 3
    ) sub)::BIGINT,
    (SELECT COUNT(*) FROM (
      SELECT wallet_address FROM wallet_history 
      GROUP BY wallet_address HAVING COUNT(DISTINCT user_id) > 1
    ) sub)::BIGINT;
END;
$$;
