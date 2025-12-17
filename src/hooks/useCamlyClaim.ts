import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { fireDiamondConfetti } from '@/components/DiamondConfetti';

export type ClaimType = 'first_wallet' | 'game_completion' | 'game_upload';

interface ClaimResult {
  success: boolean;
  status: string;
  txHash?: string;
  amount?: number;
  claimId?: string;
  message?: string;
  error?: string;
}

interface ClaimHistory {
  id: string;
  claim_type: string;
  amount: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
  claimed_at: string | null;
}

export function useCamlyClaim() {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { address, isConnected } = useAccount();
  const { user } = useAuth();

  const claimReward = useCallback(async (
    claimType: ClaimType,
    gameId?: string
  ): Promise<ClaimResult> => {
    if (!user) {
      toast.error('Please login first');
      return { success: false, status: 'error', error: 'Not authenticated' };
    }

    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return { success: false, status: 'error', error: 'Wallet not connected' };
    }

    setIsClaiming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Session expired. Please login again.');
        return { success: false, status: 'error', error: 'No session' };
      }

      const response = await supabase.functions.invoke('claim-camly', {
        body: {
          walletAddress: address,
          claimType,
          gameId,
        },
      });

      if (response.error) {
        console.error('Claim error:', response.error);
        toast.error(response.error.message || 'Failed to claim reward');
        return { success: false, status: 'error', error: response.error.message };
      }

      const result = response.data as ClaimResult;

      if (result.success) {
        if (result.status === 'completed') {
          fireDiamondConfetti('rainbow');
          toast.success(`Successfully claimed ${result.amount?.toLocaleString()} CAMLY!`, {
            description: `TX: ${result.txHash?.slice(0, 10)}...`,
          });
        } else if (result.status === 'pending_balance') {
          fireDiamondConfetti('celebration');
          toast.success(`🎉 +${result.amount?.toLocaleString()} $C đã thêm vào số dư chờ nhận!`, {
            description: 'Nhấn "Nhận" để rút về ví của bạn.',
          });
        } else if (result.status === 'pending_approval') {
          toast.info('Claim requires parental approval', {
            description: 'Your parent will need to approve this claim.',
          });
        }
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;

    } catch (error: any) {
      console.error('Claim error:', error);
      toast.error('Failed to claim reward');
      return { success: false, status: 'error', error: error.message };
    } finally {
      setIsClaiming(false);
    }
  }, [user, address, isConnected]);

  const checkCanClaim = useCallback(async (claimType: ClaimType, gameId?: string): Promise<{
    canClaim: boolean;
    reason?: string;
  }> => {
    if (!user) {
      return { canClaim: false, reason: 'Not authenticated' };
    }

    try {
      if (claimType === 'first_wallet') {
        const { data } = await supabase
          .from('camly_claims')
          .select('id')
          .eq('user_id', user.id)
          .eq('claim_type', 'first_wallet')
          .in('status', ['completed', 'pending_balance'])
          .maybeSingle();

        if (data) {
          return { canClaim: false, reason: 'Already claimed first wallet reward' };
        }
      } else {
        // Check today's claims
        const today = new Date().toISOString().split('T')[0];
        const { data } = await supabase
          .from('camly_claims')
          .select('id')
          .eq('user_id', user.id)
          .eq('claim_type', claimType)
          .gte('created_at', today)
          .in('status', ['pending', 'completed', 'pending_balance']);

        if (data && data.length > 0) {
          return { canClaim: false, reason: 'Already claimed today' };
        }
      }

      if (claimType === 'game_upload' && gameId) {
        const { data: existingClaim } = await supabase
          .from('camly_claims')
          .select('id')
          .eq('game_id', gameId)
          .eq('claim_type', 'game_upload')
          .in('status', ['completed', 'pending_balance'])
          .maybeSingle();

        if (existingClaim) {
          return { canClaim: false, reason: 'Already claimed for this game' };
        }
      }

      return { canClaim: true };
    } catch (error) {
      console.error('Check claim error:', error);
      return { canClaim: false, reason: 'Error checking claim status' };
    }
  }, [user]);

  const loadClaimHistory = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('camly_claims')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setClaimHistory(data || []);
    } catch (error) {
      console.error('Error loading claim history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  return {
    claimReward,
    checkCanClaim,
    loadClaimHistory,
    isClaiming,
    claimHistory,
    isLoadingHistory,
    isWalletConnected: isConnected,
    walletAddress: address,
  };
}
