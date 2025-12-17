import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DailyLoginRewardResult {
  success: boolean;
  alreadyClaimed: boolean;
  amount: number;
  message: string;
}

export function useDailyLoginReward() {
  const { user } = useAuth();
  const [canClaim, setCanClaim] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);

  const checkCanClaim = useCallback(async () => {
    if (!user) {
      setCanClaim(false);
      setIsChecking(false);
      return false;
    }

    setIsChecking(true);
    try {
      const { data, error } = await supabase
        .rpc('can_claim_daily_login', { p_user_id: user.id });

      if (error) throw error;
      
      setCanClaim(data ?? false);
      return data ?? false;
    } catch (error) {
      console.error('Error checking daily login:', error);
      setCanClaim(false);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  const claimDailyReward = useCallback(async (walletAddress?: string): Promise<DailyLoginRewardResult> => {
    if (!user) {
      return { success: false, alreadyClaimed: false, amount: 0, message: 'Not authenticated' };
    }

    setIsClaiming(true);
    try {
      const { data, error } = await supabase
        .rpc('claim_daily_login_reward', { 
          p_user_id: user.id,
          p_wallet_address: walletAddress || null
        });

      if (error) throw error;

      const result = data?.[0] || { success: false, already_claimed: false, amount: 0, message: 'Unknown error' };
      
      if (result.success) {
        setCanClaim(false);
        setClaimedAmount(result.amount);
        setShowRewardPopup(true);
      }

      return {
        success: result.success,
        alreadyClaimed: result.already_claimed,
        amount: result.amount,
        message: result.message
      };
    } catch (error: any) {
      console.error('Error claiming daily login reward:', error);
      return { success: false, alreadyClaimed: false, amount: 0, message: error.message };
    } finally {
      setIsClaiming(false);
    }
  }, [user]);

  // Auto-check on user change
  useEffect(() => {
    checkCanClaim();
  }, [checkCanClaim]);

  // Auto-claim on login if eligible
  const autoClaimOnLogin = useCallback(async (walletAddress?: string) => {
    const eligible = await checkCanClaim();
    if (eligible) {
      return claimDailyReward(walletAddress);
    }
    return null;
  }, [checkCanClaim, claimDailyReward]);

  const closeRewardPopup = useCallback(() => {
    setShowRewardPopup(false);
  }, []);

  return {
    canClaim,
    isChecking,
    isClaiming,
    showRewardPopup,
    claimedAmount,
    checkCanClaim,
    claimDailyReward,
    autoClaimOnLogin,
    closeRewardPopup,
  };
}
