import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UseWelcomeRewardReturn {
  hasClaimedWelcome: boolean | null;
  isChecking: boolean;
  showWelcomeModal: boolean;
  setShowWelcomeModal: (show: boolean) => void;
  checkWelcomeClaimed: () => Promise<boolean>;
}

export const useWelcomeReward = (): UseWelcomeRewardReturn => {
  const [hasClaimedWelcome, setHasClaimedWelcome] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { user } = useAuth();

  const checkWelcomeClaimed = useCallback(async (): Promise<boolean> => {
    if (!address) return true; // No address = don't show modal
    
    setIsChecking(true);
    
    try {
      // Check if welcome reward was already claimed for this wallet
      const { data, error } = await supabase
        .from('web3_reward_transactions')
        .select('id')
        .eq('wallet_address', address)
        .eq('reward_type', 'first_wallet_connect')
        .limit(1);

      if (error) {
        console.error('Error checking welcome reward:', error);
        return true;
      }

      const claimed = data && data.length > 0;
      setHasClaimedWelcome(claimed);
      return claimed;
    } catch (err) {
      console.error('Error in checkWelcomeClaimed:', err);
      return true;
    } finally {
      setIsChecking(false);
    }
  }, [address]);

  // Check on wallet connect
  useEffect(() => {
    if (isConnected && address) {
      const checkAndShowModal = async () => {
        const claimed = await checkWelcomeClaimed();
        if (!claimed) {
          // Small delay for better UX
          setTimeout(() => {
            setShowWelcomeModal(true);
          }, 1000);
        }
      };
      checkAndShowModal();
    } else {
      setHasClaimedWelcome(null);
      setShowWelcomeModal(false);
    }
  }, [isConnected, address, checkWelcomeClaimed]);

  return {
    hasClaimedWelcome,
    isChecking,
    showWelcomeModal,
    setShowWelcomeModal,
    checkWelcomeClaimed,
  };
};
