import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface UserRewards {
  id: string;
  user_id: string;
  wallet_address: string | null;
  pending_amount: number;
  claimed_amount: number;
  total_earned: number;
  daily_claimed: number;
  last_claim_date: string | null;
  last_claim_amount: number | null;
  last_claim_at: string | null;
}

export interface RewardHistoryItem {
  id: string;
  reward_type: string;
  amount: number;
  description: string | null;
  created_at: string;
  claimed_to_wallet: boolean;
}

const DAILY_LIMIT = 5000000; // 5 million CAMLY per day

export function useUserRewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<UserRewards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyRemaining, setDailyRemaining] = useState(DAILY_LIMIT);
  const [isClaiming, setIsClaiming] = useState(false);
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadRewards = useCallback(async () => {
    if (!user) {
      setRewards(null);
      setIsLoading(false);
      return;
    }

    try {
      // Get or create user rewards
      const { data, error } = await supabase
        .rpc('get_or_create_user_rewards', { p_user_id: user.id });

      if (error) throw error;

      setRewards(data);

      // Calculate daily remaining
      const today = new Date().toISOString().split('T')[0];
      if (data.last_claim_date === today) {
        setDailyRemaining(Math.max(0, DAILY_LIMIT - (data.daily_claimed || 0)));
      } else {
        setDailyRemaining(DAILY_LIMIT);
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadRewardHistory = useCallback(async () => {
    if (!user) {
      setRewardHistory([]);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('web3_reward_transactions')
        .select('id, reward_type, amount, description, created_at, claimed_to_wallet')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setRewardHistory(data || []);
    } catch (error) {
      console.error('Error loading reward history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    loadRewards();
    loadRewardHistory();
  }, [loadRewards, loadRewardHistory]);

  const addPendingReward = useCallback(async (amount: number, source: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .rpc('add_user_pending_reward', {
          p_user_id: user.id,
          p_amount: amount,
          p_source: source
        });

      if (error) throw error;

      await loadRewards();
      await loadRewardHistory();
      return data;
    } catch (error) {
      console.error('Error adding pending reward:', error);
      return null;
    }
  }, [user, loadRewards, loadRewardHistory]);

  const claimArbitrary = useCallback(async (
    amount: number, 
    walletAddress: string,
    parentSignature?: string
  ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Invalid amount' };
    }

    if (amount > (rewards?.pending_amount || 0)) {
      return { success: false, error: 'Insufficient pending balance' };
    }

    if (amount > dailyRemaining) {
      return { success: false, error: `Đã vượt giới hạn hôm nay. Còn lại: ${dailyRemaining.toLocaleString()} Camly coin` };
    }

    setIsClaiming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('claim-arbitrary', {
        body: { 
          walletAddress, 
          amount,
          parentSignature 
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;

      if (!result.success) {
        if (result.requiresParentApproval) {
          return { success: false, error: 'Requires parent approval' };
        }
        return { success: false, error: result.error };
      }

      // Reload rewards after successful claim
      await loadRewards();
      await loadRewardHistory();

      return { 
        success: true, 
        txHash: result.txHash 
      };
    } catch (error: any) {
      console.error('Claim error:', error);
      return { success: false, error: error.message };
    } finally {
      setIsClaiming(false);
    }
  }, [user, rewards, dailyRemaining, loadRewards, loadRewardHistory]);

  // Calculate total earned from history (positive amounts only)
  const totalFromHistory = rewardHistory
    .filter(item => item.amount > 0)
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    rewards,
    isLoading,
    dailyRemaining,
    dailyLimit: DAILY_LIMIT,
    isClaiming,
    loadRewards,
    addPendingReward,
    claimArbitrary,
    rewardHistory,
    isLoadingHistory,
    loadRewardHistory,
    totalFromHistory,
  };
}
