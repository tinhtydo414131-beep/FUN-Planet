import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WalletLinkingResult {
  success: boolean;
  reason: string;
  isFirstConnection?: boolean;
  alreadyLinked?: boolean;
}

export interface WalletEligibility {
  canConnect: boolean;
  reason: string;
  existingUserId?: string;
  walletChangesCount?: number;
}

const DEBOUNCE_MS = 1000;
const FIRST_WALLET_BONUS = 50000;

/**
 * Centralized wallet linking hook
 * Handles wallet eligibility checks, multi-table sync, and first connection bonus
 * Uses fail-closed approach: if eligibility check fails, don't allow connection
 */
export const useWalletLinking = () => {
  const [isLinking, setIsLinking] = useState(false);
  const lastLinkAttemptRef = useRef<number>(0);
  const linkingInProgressRef = useRef<boolean>(false);
  const lastLinkedAddressRef = useRef<string | null>(null);

  /**
   * Check if wallet is eligible for connection (fail-closed approach)
   */
  const checkEligibility = useCallback(async (
    userId: string, 
    walletAddress: string
  ): Promise<WalletEligibility> => {
    const normalizedAddress = walletAddress.toLowerCase();

    try {
      const { data, error } = await supabase.rpc('check_wallet_eligibility', {
        p_user_id: userId,
        p_wallet_address: normalizedAddress
      });

      if (error) {
        console.error('Error checking wallet eligibility:', error);
        // FAIL-CLOSED: Don't allow connection if check fails
        return { 
          canConnect: false, 
          reason: 'Không thể kiểm tra điều kiện ví. Vui lòng thử lại sau.' 
        };
      }

      if (data && data.length > 0) {
        return {
          canConnect: data[0].can_connect,
          reason: data[0].reason || '',
          existingUserId: data[0].existing_user_id,
          walletChangesCount: data[0].wallet_changes_count
        };
      }

      return { canConnect: true, reason: '' };
    } catch (error) {
      console.error('Error in eligibility check:', error);
      // FAIL-CLOSED: Don't allow connection on error
      return { 
        canConnect: false, 
        reason: 'Lỗi kết nối. Vui lòng thử lại sau.' 
      };
    }
  }, []);

  /**
   * Get current wallet address from profiles table
   */
  const getCurrentWallet = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current wallet:', error);
        return null;
      }

      return data?.wallet_address || null;
    } catch (error) {
      console.error('Error getting current wallet:', error);
      return null;
    }
  }, []);

  /**
   * Main function to link wallet to user
   * Handles eligibility check, multi-table sync, first connection bonus, and fraud logging
   */
  const linkWallet = useCallback(async (
    userId: string,
    walletAddress: string,
    options?: {
      skipBonusCheck?: boolean;
      showToasts?: boolean;
      source?: 'metamask' | 'appkit' | 'walletconnect' | 'other';
    }
  ): Promise<WalletLinkingResult> => {
    const { showToasts = true, source = 'other' } = options || {};
    const normalizedAddress = walletAddress.toLowerCase();

    // Debounce protection
    const now = Date.now();
    if (now - lastLinkAttemptRef.current < DEBOUNCE_MS) {
      return { success: false, reason: 'Đang xử lý, vui lòng đợi...' };
    }

    // Prevent concurrent linking
    if (linkingInProgressRef.current) {
      return { success: false, reason: 'Đang xử lý liên kết ví...' };
    }

    // Skip if same address was just linked
    if (lastLinkedAddressRef.current === normalizedAddress) {
      return { success: true, reason: 'Ví đã được liên kết', alreadyLinked: true };
    }

    lastLinkAttemptRef.current = now;
    linkingInProgressRef.current = true;
    setIsLinking(true);

    try {
      // Step 1: Check eligibility (fail-closed)
      const eligibility = await checkEligibility(userId, normalizedAddress);
      
      if (!eligibility.canConnect) {
        if (showToasts && eligibility.reason) {
          toast.error(eligibility.reason);
        }
        return { 
          success: false, 
          reason: eligibility.reason || 'Ví không đủ điều kiện' 
        };
      }

      // Step 2: Get current wallet and check if already linked to this account
      const currentWallet = await getCurrentWallet(userId);
      
      // If same wallet, skip update but return success
      if (currentWallet === normalizedAddress) {
        lastLinkedAddressRef.current = normalizedAddress;
        return { success: true, reason: 'Ví đã được liên kết', alreadyLinked: true };
      }

      // Step 3: Check if this is first wallet connection (for bonus)
      let isFirstConnection = false;
      if (!options?.skipBonusCheck && !currentWallet) {
        const { data: existingBonus } = await supabase
          .from('camly_coin_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('transaction_type', 'wallet_connection')
          .maybeSingle();
        
        isFirstConnection = !existingBonus;
      }

      // Step 4: Get current balance for potential bonus addition
      let walletBalance = 0;
      if (isFirstConnection) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_balance')
          .eq('id', userId)
          .maybeSingle();
        walletBalance = (profile?.wallet_balance || 0) + FIRST_WALLET_BONUS;
      }

      // Step 5: Update profiles table (primary source of truth)
      const updateData: any = { wallet_address: normalizedAddress };
      if (isFirstConnection) {
        updateData.wallet_balance = walletBalance;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (profileError) {
        // Handle unique constraint violation
        if (profileError.code === '23505') {
          if (showToasts) {
            toast.error('Ví này đã được liên kết với tài khoản khác');
          }
          return { 
            success: false, 
            reason: 'Ví này đã được liên kết với tài khoản khác' 
          };
        }
        throw profileError;
      }

      // Step 6: Sync to other tables (parallel for efficiency)
      const syncPromises = [
        // Sync to fun_id
        supabase
          .from('fun_id')
          .update({ wallet_address: normalizedAddress })
          .eq('user_id', userId),
        
        // Sync to user_rewards
        supabase
          .from('user_rewards')
          .update({ wallet_address: normalizedAddress })
          .eq('user_id', userId),
        
        // Upsert to web3_rewards
        supabase
          .from('web3_rewards')
          .upsert({
            user_id: userId,
            wallet_address: normalizedAddress,
          }, { onConflict: 'user_id' })
      ];

      await Promise.allSettled(syncPromises);

      // Step 7: Log wallet connection for fraud prevention
      try {
        await supabase.rpc('log_wallet_connection', {
          p_user_id: userId,
          p_wallet_address: normalizedAddress,
          p_previous_wallet: currentWallet
        });
      } catch (logError) {
        console.error('Error logging wallet connection:', logError);
        // Don't fail the whole operation for logging error
      }

      // Step 8: Record first connection bonus if applicable
      if (isFirstConnection) {
        const { error: txError } = await supabase
          .from('camly_coin_transactions')
          .insert({
            user_id: userId,
            amount: FIRST_WALLET_BONUS,
            transaction_type: 'wallet_connection',
            description: 'First wallet connection bonus'
          });

        if (txError) {
          console.error('Error saving bonus transaction:', txError);
        } else if (showToasts) {
          toast.success(`🎁 Thưởng ${FIRST_WALLET_BONUS.toLocaleString()} Camly cho lần kết nối ví đầu tiên!`);
        }
      }

      // Update refs for dedup
      lastLinkedAddressRef.current = normalizedAddress;

      console.log(`✅ Wallet linked successfully: ${normalizedAddress} (source: ${source})`);

      return { 
        success: true, 
        reason: 'Liên kết ví thành công', 
        isFirstConnection 
      };

    } catch (error: any) {
      console.error('Error linking wallet:', error);
      if (showToasts) {
        toast.error('Không thể liên kết ví. Vui lòng thử lại.');
      }
      return { 
        success: false, 
        reason: error.message || 'Lỗi không xác định' 
      };
    } finally {
      linkingInProgressRef.current = false;
      setIsLinking(false);
    }
  }, [checkEligibility, getCurrentWallet]);

  /**
   * Check if wallet differs from current DB value (to avoid unnecessary updates)
   */
  const shouldUpdateWallet = useCallback(async (
    userId: string,
    walletAddress: string
  ): Promise<boolean> => {
    const normalizedAddress = walletAddress.toLowerCase();
    const currentWallet = await getCurrentWallet(userId);
    return currentWallet !== normalizedAddress;
  }, [getCurrentWallet]);

  /**
   * Reset the last linked address (useful when user logs out)
   */
  const resetLastLinkedAddress = useCallback(() => {
    lastLinkedAddressRef.current = null;
  }, []);

  return {
    linkWallet,
    checkEligibility,
    shouldUpdateWallet,
    getCurrentWallet,
    resetLastLinkedAddress,
    isLinking,
    FIRST_WALLET_BONUS
  };
};
