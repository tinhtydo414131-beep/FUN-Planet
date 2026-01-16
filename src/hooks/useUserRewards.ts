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

// Daily withdrawal limit - synced with admin_settings table
// Last updated: 2026-01-14 - Production sync for planet.fun.rich
const DAILY_LIMIT = 200000; // 200,000 CAMLY per 24 hours

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

    setIsLoading(true);
    console.log('[useUserRewards] Loading rewards for user:', user.id);

    try {
      // Verify session is valid first
      let { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // Try to refresh if session error or missing
      if (sessionError || !session) {
        console.warn('[useUserRewards] Session invalid or missing, attempting refresh...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.error('[useUserRewards] Cannot refresh session:', refreshError?.message);
          setIsLoading(false);
          return;
        }
        session = refreshData.session;
        console.log('[useUserRewards] Session refreshed successfully');
      }

      console.log('[useUserRewards] Session valid, calling RPC...');
      
      // Get or create user rewards via RPC
      const { data, error } = await supabase
        .rpc('get_or_create_user_rewards', { p_user_id: user.id });

      if (error) {
        console.error('[useUserRewards] RPC error:', error.message, error.code);
        // Fallback: try direct query with explicit auth context
        console.log('[useUserRewards] Trying direct query fallback...');
        const { data: directData, error: directError } = await supabase
          .from('user_rewards')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (directError) {
          console.error('[useUserRewards] Direct query error:', directError.message);
        }
        
        if (directData) {
          console.log('[useUserRewards] Loaded via direct query - pending:', directData.pending_amount);
          setRewards(directData);
          
          // Calculate daily remaining
          const today = new Date().toISOString().split('T')[0];
          if (directData.last_claim_date === today) {
            setDailyRemaining(Math.max(0, DAILY_LIMIT - (directData.daily_claimed || 0)));
          } else {
            setDailyRemaining(DAILY_LIMIT);
          }
        } else {
          console.log('[useUserRewards] No rewards data found via direct query');
          // Set default rewards object for new users
          setRewards(null);
        }
        setIsLoading(false);
        return;
      }

      if (!data) {
        console.log('[useUserRewards] RPC returned null, user may not have rewards yet');
        setIsLoading(false);
        return;
      }

      console.log('[useUserRewards] Loaded via RPC - pending:', data.pending_amount, 'claimed:', data.claimed_amount);
      setRewards(data);

      // Calculate daily remaining
      const today = new Date().toISOString().split('T')[0];
      if (data.last_claim_date === today) {
        setDailyRemaining(Math.max(0, DAILY_LIMIT - (data.daily_claimed || 0)));
      } else {
        setDailyRemaining(DAILY_LIMIT);
      }
    } catch (error: any) {
      console.error('[useUserRewards] Unexpected error:', error?.message || error);
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

  // Real-time subscription to update dailyRemaining instantly after claims
  useEffect(() => {
    if (!user) return;

    console.log('[useUserRewards] Setting up realtime subscription for user:', user.id);
    
    const channel = supabase
      .channel(`user_rewards_realtime_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_rewards',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[useUserRewards] ✅ REALTIME UPDATE:', {
            old_daily_claimed: (payload.old as UserRewards)?.daily_claimed,
            new_daily_claimed: (payload.new as UserRewards)?.daily_claimed,
            calculated_remaining: Math.max(0, DAILY_LIMIT - ((payload.new as UserRewards)?.daily_claimed || 0))
          });
          const newData = payload.new as UserRewards;
          
          // Update rewards state immediately
          setRewards(newData);
          
          // Recalculate daily remaining based on new data
          const today = new Date().toISOString().split('T')[0];
          if (newData.last_claim_date === today) {
            const newRemaining = Math.max(0, DAILY_LIMIT - (newData.daily_claimed || 0));
            console.log('[useUserRewards] Updating dailyRemaining:', newRemaining);
            setDailyRemaining(newRemaining);
          } else {
            setDailyRemaining(DAILY_LIMIT);
          }
        }
      )
      .subscribe((status) => {
        console.log('[useUserRewards] Realtime subscription status:', status);
      });

    return () => {
      console.log('[useUserRewards] Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

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
  ): Promise<{ success: boolean; txHash?: string; error?: string; status?: 'completed' | 'pending_review' }> => {
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

      // Return with status from backend
      return { 
        success: true, 
        txHash: result.txHash,
        status: result.status === 'pending_review' ? 'pending_review' : 'completed'
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
