import { useState, useCallback } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export type ClaimType = 'welcome' | 'playgame' | 'uploadgame' | 'daily_checkin' | 'claim_pending';

interface ClaimResult {
  success: boolean;
  txHash?: string;
  amount?: string;
  error?: string;
}

interface UseClaimRewardReturn {
  claimReward: (claimType: ClaimType, gameId?: string) => Promise<ClaimResult>;
  isClaiming: boolean;
  lastTxHash: string | null;
}

export const useClaimReward = (): UseClaimRewardReturn => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  
  const { address, isConnected } = useAccount();
  const { signMessage, isPending: isSigningMessage } = useSignMessage();
  const { user } = useAuth();

  const claimReward = useCallback(async (
    claimType: ClaimType,
    gameId?: string
  ): Promise<ClaimResult> => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return { success: false, error: 'Wallet not connected' };
    }

    setIsClaiming(true);
    
    try {
      // Step 1: Create a unique message to sign
      const timestamp = Date.now();
      const nonce = Math.random().toString(36).substring(7);
      const message = `Claim ${claimType} reward on FUN Planet\n\nWallet: ${address}\nTimestamp: ${timestamp}\nNonce: ${nonce}`;

      // Step 2: Request signature from user's wallet
      toast.info('Please sign the message in your wallet...');
      
      return new Promise((resolve) => {
        signMessage(
          { message, account: address },
          {
            onSuccess: async (signature) => {
              try {
                // Step 3: Call the secure edge function
                toast.loading('Processing your claim...', { id: 'claim-reward' });

                const { data, error } = await supabase.functions.invoke('claim-reward', {
                  body: {
                    walletAddress: address,
                    claimType,
                    signature,
                    message,
                    gameId,
                    userId: user?.id,
                  },
                });

                if (error) {
                  console.error('Claim error:', error);
                  toast.dismiss('claim-reward');
                  toast.error(error.message || 'Failed to claim reward');
                  setIsClaiming(false);
                  resolve({ success: false, error: error.message });
                  return;
                }

                if (data?.error) {
                  toast.dismiss('claim-reward');
                  toast.error(data.error);
                  setIsClaiming(false);
                  resolve({ success: false, error: data.error });
                  return;
                }

                // Success!
                setLastTxHash(data.txHash);
                toast.dismiss('claim-reward');
                
                // Show success with confetti
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#FFD700', '#FFA500', '#FF6B00'],
                });

                toast.success(
                  `Successfully claimed ${data.amount} CAMLY!`,
                  {
                    description: `Transaction: ${data.txHash.slice(0, 10)}...`,
                    action: {
                      label: 'View',
                      onClick: () => window.open(`https://bscscan.com/tx/${data.txHash}`, '_blank'),
                    },
                  }
                );

                setIsClaiming(false);
                resolve({
                  success: true,
                  txHash: data.txHash,
                  amount: data.amount,
                });
              } catch (invokeError: unknown) {
                console.error('Invoke error:', invokeError);
                toast.dismiss('claim-reward');
                const errorMsg = invokeError instanceof Error ? invokeError.message : 'Failed to claim reward';
                toast.error(errorMsg);
                setIsClaiming(false);
                resolve({ success: false, error: errorMsg });
              }
            },
            onError: (signError) => {
              console.error('Sign error:', signError);
              if (signError.message?.includes('rejected') || (signError as any).code === 4001) {
                toast.error('Signature rejected by user');
              } else {
                toast.error('Failed to sign message');
              }
              setIsClaiming(false);
              resolve({ success: false, error: signError.message });
            },
          }
        );
      });

    } catch (error: unknown) {
      console.error('Claim reward error:', error);
      toast.dismiss('claim-reward');
      const errorMsg = error instanceof Error ? error.message : 'Failed to claim reward';
      toast.error(errorMsg);
      setIsClaiming(false);
      return { success: false, error: errorMsg };
    }
  }, [address, isConnected, signMessage, user?.id]);

  return {
    claimReward,
    isClaiming: isClaiming || isSigningMessage,
    lastTxHash,
  };
};
