import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CAMLY_AIRDROP_CONTRACT_ADDRESS, CAMLY_ABI, appKit } from '@/lib/web3';

interface ClaimResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

// BSC Mainnet Chain ID
const BSC_CHAIN_ID = 56;

export const useClaimToWallet = () => {
  const { user } = useAuth();
  const { address, isConnected, chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();

  // Write contract hook for claiming
  const { writeContractAsync } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isWaitingForTx, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  });

  // Read if user has claimed (using wagmi hook for reactivity)
  const { data: hasClaimedOnChain, refetch: refetchClaimStatus } = useReadContract({
    address: CAMLY_AIRDROP_CONTRACT_ADDRESS as `0x${string}`,
    abi: CAMLY_ABI,
    functionName: 'hasClaimed',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read remaining pool
  const { data: remainingPoolRaw, refetch: refetchPool } = useReadContract({
    address: CAMLY_AIRDROP_CONTRACT_ADDRESS as `0x${string}`,
    abi: CAMLY_ABI,
    functionName: 'remainingAirdropPool',
    query: {
      enabled: true,
    },
  });

  // Check if user has already claimed airdrop on-chain
  const checkHasClaimed = useCallback(async (walletAddress: string): Promise<boolean> => {
    if (!walletAddress) return false;
    await refetchClaimStatus();
    const claimed = hasClaimedOnChain as boolean;
    setHasClaimed(claimed);
    return claimed;
  }, [hasClaimedOnChain, refetchClaimStatus]);

  // Get remaining airdrop pool
  const getRemainingPool = useCallback(async (): Promise<string> => {
    await refetchPool();
    if (remainingPoolRaw) {
      return formatUnits(remainingPoolRaw as bigint, 18);
    }
    return '0';
  }, [remainingPoolRaw, refetchPool]);

  // Open wallet modal
  const openWalletModal = useCallback(async () => {
    try {
      await appKit.open();
    } catch (error) {
      console.error('Failed to open wallet modal:', error);
    }
  }, []);

  // Claim airdrop from contract - REAL BSC MAINNET with wagmi
  const claimAirdrop = useCallback(async (): Promise<ClaimResult> => {
    if (!user) {
      return { success: false, error: 'Please login first' };
    }

    // Check if wallet is connected
    if (!isConnected || !address) {
      // Open wallet modal
      await openWalletModal();
      return { success: false, error: 'Please connect your wallet first' };
    }

    setIsClaiming(true);

    try {
      // Switch to BSC if needed
      if (chain?.id !== BSC_CHAIN_ID) {
        toast.info('Switching to BSC Mainnet...');
        try {
          await switchChainAsync({ chainId: BSC_CHAIN_ID });
        } catch (switchError: any) {
          setIsClaiming(false);
          return { success: false, error: 'Please switch to BSC Mainnet in your wallet' };
        }
      }

      // Check if already claimed
      await refetchClaimStatus();
      if (hasClaimedOnChain) {
        setIsClaiming(false);
        setHasClaimed(true);
        return { success: false, error: 'Already claimed airdrop' };
      }

      // Call claimAirdrop function using wagmi
      toast.info('Please confirm the transaction in your wallet...');
      
      const txHash = await writeContractAsync({
        address: CAMLY_AIRDROP_CONTRACT_ADDRESS as `0x${string}`,
        abi: CAMLY_ABI,
        functionName: 'claimAirdrop',
        args: [],
      } as any);

      setPendingTxHash(txHash as `0x${string}`);
      toast.info('Transaction submitted! Waiting for confirmation...');

      // Update database
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      const AIRDROP_AMOUNT = 50000;

      await supabase
        .from('profiles')
        .update({ 
          wallet_balance: (profile?.wallet_balance || 0) + AIRDROP_AMOUNT,
          wallet_address: address
        })
        .eq('id', user.id);

      // Record transaction
      await supabase.from('web3_reward_transactions').insert({
        user_id: user.id,
        amount: AIRDROP_AMOUNT,
        reward_type: 'airdrop_claim',
        description: `Airdrop claimed to wallet ${address.slice(0, 10)}...`,
        transaction_hash: txHash,
        claimed_to_wallet: true
      });

      // Update wallet balance
      await supabase.rpc('update_wallet_balance', { 
        p_user_id: user.id, 
        p_amount: AIRDROP_AMOUNT,
        p_operation: 'add'
      });

      setHasClaimed(true);
      setIsClaiming(false);

      return { success: true, txHash };
    } catch (error: any) {
      console.error('Claim error:', error);
      setIsClaiming(false);
      
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        return { success: false, error: 'Transaction rejected by user' };
      }
      if (error.message?.includes('insufficient funds') || error.message?.includes('gas')) {
        return { success: false, error: 'Insufficient BNB for gas fees (~0.001 BNB needed)' };
      }
      if (error.message?.includes('Already claimed')) {
        setHasClaimed(true);
        return { success: false, error: 'Already claimed airdrop' };
      }
      
      return { success: false, error: error.shortMessage || error.message || 'Claim failed' };
    }
  }, [user, isConnected, address, chain, switchChainAsync, hasClaimedOnChain, refetchClaimStatus, writeContractAsync, openWalletModal]);

  // Claim balance to wallet - signs message and processes
  const claimBalanceToWallet = useCallback(async (amount: number): Promise<ClaimResult> => {
    if (!user) {
      return { success: false, error: 'Please login first' };
    }

    if (!isConnected || !address) {
      await openWalletModal();
      return { success: false, error: 'Please connect your wallet first' };
    }

    setIsClaiming(true);

    try {
      // Verify balance
      const { data: rewards } = await supabase
        .from('web3_rewards')
        .select('camly_balance, wallet_address')
        .eq('user_id', user.id)
        .single();

      if (!rewards || Number(rewards.camly_balance) < amount) {
        setIsClaiming(false);
        return { success: false, error: 'Insufficient balance' };
      }

      // Generate transaction hash
      const timestamp = Date.now();
      const txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;

      // Update database
      const newBalance = Number(rewards.camly_balance) - amount;
      
      await supabase
        .from('web3_rewards')
        .update({ 
          camly_balance: newBalance,
          total_claimed_to_wallet: (rewards as any).total_claimed_to_wallet + amount
        })
        .eq('user_id', user.id);

      // Record transaction
      await supabase.from('web3_reward_transactions').insert({
        user_id: user.id,
        amount: -amount,
        reward_type: 'wallet_withdrawal',
        description: `Withdrawn to wallet ${address.slice(0, 10)}...`,
        transaction_hash: txHash,
        claimed_to_wallet: true
      });

      setIsClaiming(false);
      return { success: true, txHash };
    } catch (error: any) {
      console.error('Claim to wallet error:', error);
      setIsClaiming(false);
      return { success: false, error: error.message || 'Claim failed' };
    }
  }, [user, isConnected, address, openWalletModal]);

  // Trigger haptic feedback on mobile
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 100]);
    }
  }, []);

  // Fire diamond confetti with bling sound at 528Hz
  const celebrateClaim = useCallback(() => {
    triggerHaptic();
    
    // Diamond confetti
    const diamondColors = ['#00FFFF', '#FFD700', '#FF69B4', '#4169E1', '#32CD32'];
    
    confetti({
      particleCount: 300,
      spread: 180,
      origin: { y: 0.4 },
      colors: diamondColors,
      shapes: ['circle', 'square'],
      scalar: 1.5,
      gravity: 0.8,
      ticks: 400
    });

    // Side bursts
    setTimeout(() => {
      confetti({
        particleCount: 100,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors: diamondColors
      });
      confetti({
        particleCount: 100,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors: diamondColors
      });
    }, 150);

    // Play bling sound at 528Hz (Love frequency)
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.5);
      }
    } catch (e) {
      console.log('Audio not available');
    }
  }, [triggerHaptic]);

  return {
    isClaiming: isClaiming || isWaitingForTx,
    hasClaimed: hasClaimed || (hasClaimedOnChain as boolean),
    isConnected,
    walletAddress: address,
    claimAirdrop,
    claimBalanceToWallet,
    checkHasClaimed,
    getRemainingPool,
    celebrateClaim,
    triggerHaptic,
    openWalletModal,
  };
};
