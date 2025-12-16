import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PendingReward {
  id: string;
  amount: number;
  source: string;
  created_at: string;
  game_id?: string;
}

interface UsePendingRewardsReturn {
  pendingRewards: PendingReward[];
  totalPending: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addTestReward: (amount: number, source: string) => Promise<void>;
}

export const usePendingRewards = (): UsePendingRewardsReturn => {
  const [pendingRewards, setPendingRewards] = useState<PendingReward[]>([]);
  const [totalPending, setTotalPending] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const { user } = useAuth();

  const fetchPendingRewards = useCallback(async () => {
    if (!address && !user) {
      setPendingRewards([]);
      setTotalPending(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to fetch by wallet address first
      let query = supabase
        .from('pending_rewards')
        .select('*')
        .eq('claimed', false)
        .order('created_at', { ascending: false });

      if (address) {
        query = query.eq('wallet_address', address.toLowerCase());
      } else if (user?.id) {
        query = query.eq('user_id', user.id);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching pending rewards:', fetchError);
        setError('Failed to load rewards');
        return;
      }

      const rewards = data || [];
      setPendingRewards(rewards as PendingReward[]);
      setTotalPending(rewards.reduce((sum, r) => sum + Number(r.amount), 0));
    } catch (err) {
      console.error('Error in fetchPendingRewards:', err);
      setError('Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  }, [address, user?.id]);

  // Function to add test rewards (for development)
  const addTestReward = useCallback(async (amount: number, source: string) => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from('pending_rewards')
        .insert({
          wallet_address: address.toLowerCase(),
          user_id: user?.id || null,
          amount,
          source,
        });

      if (insertError) {
        console.error('Error adding test reward:', insertError);
        setError('Failed to add reward');
        return;
      }

      // Refetch rewards
      await fetchPendingRewards();
    } catch (err) {
      console.error('Error in addTestReward:', err);
      setError('Failed to add reward');
    }
  }, [address, user?.id, fetchPendingRewards]);

  // Fetch rewards when wallet or user changes
  useEffect(() => {
    fetchPendingRewards();
  }, [fetchPendingRewards]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!address && !user) return;

    const channel = supabase
      .channel('pending-rewards-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pending_rewards',
        },
        () => {
          fetchPendingRewards();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [address, user, fetchPendingRewards]);

  return {
    pendingRewards,
    totalPending,
    isLoading,
    error,
    refetch: fetchPendingRewards,
    addTestReward,
  };
};
