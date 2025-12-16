import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useReadContract, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { 
  CAMLY_AIRDROP_CONTRACT_ADDRESS, 
  CAMLY_ABI, 
  REWARDS_CLAIM_ABI,
  appKit 
} from '@/lib/web3';

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

      // Show success toast with BSCScan link
      toast.success(`🎉 Claim successful! +50,000 CAMLY`, {
        duration: 10000,
        description: `View on BSCScan: https://bscscan.com/tx/${txHash}`,
        action: {
          label: 'View TX ↗',
          onClick: () => window.open(`https://bscscan.com/tx/${txHash}`, '_blank')
        }
      });

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

  // Claim balance to wallet - calls edge function for signature, then smart contract
  const claimBalanceToWallet = useCallback(async (amount: number): Promise<ClaimResult> => {
    if (!user) {
      return { success: false, error: 'Vui lòng đăng nhập trước' };
    }

    if (!isConnected || !address) {
      await openWalletModal();
      return { success: false, error: 'Vui lòng kết nối ví trước' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Số lượng phải lớn hơn 0' };
    }

    setIsClaiming(true);

    try {
      // Switch to BSC if needed
      if (chain?.id !== BSC_CHAIN_ID) {
        toast.info('Đang chuyển sang BSC Mainnet...');
        try {
          await switchChainAsync({ chainId: BSC_CHAIN_ID });
        } catch (switchError: any) {
          setIsClaiming(false);
          return { success: false, error: 'Vui lòng chuyển sang BSC Mainnet trong ví' };
        }
      }

      // (Don't block here) Contract address is provided by backend after validation.
      // If backend isn't configured, it will return a clear error.
      // Get signature from backend
      toast.info('Đang xác thực số dư...');
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setIsClaiming(false);
        return { success: false, error: 'Phiên đăng nhập hết hạn' };
      }

      const response = await supabase.functions.invoke('sign-rewards-claim', {
        body: { wallet_address: address, amount },
      });

      if (response.error || !response.data?.success) {
        setIsClaiming(false);
        const errorMsg = response.data?.error || response.error?.message || 'Không thể xác thực';
        return { success: false, error: errorMsg };
      }

      const { signature, nonce, amount_wei, contract_address } = response.data;

      console.log('Withdrawal signature received:', { 
        contract_address, 
        amount_wei, 
        nonce: nonce?.slice(0, 20) + '...', 
        signature: signature?.slice(0, 20) + '...' 
      });

      // Validate contract address
      if (!contract_address || contract_address === '0x0000000000000000000000000000000000000000') {
        setIsClaiming(false);
        return { success: false, error: 'Contract chưa được cấu hình. Liên hệ admin!' };
      }

      // Call smart contract
      toast.info('Vui lòng xác nhận giao dịch trong ví...');
      
      console.log('Calling claimRewards on contract:', contract_address);
      
      const txHash = await writeContractAsync({
        address: contract_address as `0x${string}`,
        abi: REWARDS_CLAIM_ABI,
        functionName: 'claimRewards',
        args: [BigInt(amount_wei), nonce as `0x${string}`, signature as `0x${string}`],
      } as any);
      
      console.log('Transaction hash:', txHash);

      setPendingTxHash(txHash as `0x${string}`);
      toast.info('Giao dịch đã gửi! Đang chờ xác nhận...');

      // Record successful claim
      await supabase.from('camly_coin_transactions').insert({
        user_id: user.id,
        amount: -amount,
        transaction_type: 'withdrawal_completed',
        description: `Rút thành công ${amount.toLocaleString()} CAMLY về ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

      setIsClaiming(false);

      // Show success toast with BSCScan link
      toast.success(`🎉 Rút thành công! ${amount.toLocaleString()} CAMLY`, {
        duration: 10000,
        description: `Xem trên BSCScan: https://bscscan.com/tx/${txHash}`,
        action: {
          label: 'Xem TX ↗',
          onClick: () => window.open(`https://bscscan.com/tx/${txHash}`, '_blank')
        }
      });

      return { success: true, txHash };
    } catch (error: any) {
      console.error('Claim to wallet error:', error);
      setIsClaiming(false);
      
      // Rollback balance if contract call failed (backend already deducted)
      // The pending transaction record already exists, admin can review
      
      if (error.message?.includes('User rejected') || error.message?.includes('rejected')) {
        return { success: false, error: 'Giao dịch bị từ chối' };
      }
      if (error.message?.includes('insufficient funds') || error.message?.includes('gas')) {
        return { success: false, error: 'Không đủ BNB để trả gas (~0.003 BNB cần thiết)' };
      }
      if (error.message?.includes('Insufficient pool') || error.message?.includes('InsufficientPool')) {
        return { success: false, error: 'Pool rút tiền tạm hết. Vui lòng liên hệ admin!' };
      }
      if (error.message?.includes('InvalidSignature')) {
        return { success: false, error: 'Chữ ký không hợp lệ. Vui lòng thử lại!' };
      }
      if (error.message?.includes('NonceUsed')) {
        return { success: false, error: 'Giao dịch đã xử lý. Vui lòng thử lại!' };
      }
      if (error.message?.includes('execution reverted') || error.message?.includes('revert')) {
        console.error('Contract reverted:', error);
        return { success: false, error: 'Contract từ chối giao dịch. Pool có thể chưa có token!' };
      }
      
      return { success: false, error: error.shortMessage || error.message || 'Rút tiền thất bại' };
    }
  }, [user, isConnected, address, chain, switchChainAsync, writeContractAsync, openWalletModal]);

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
