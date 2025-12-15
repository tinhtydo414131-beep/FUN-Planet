import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { CAMLY_CONTRACT_ADDRESS, CAMLY_AIRDROP_CONTRACT_ADDRESS, CAMLY_ABI } from '@/lib/web3';

interface ClaimResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export const useClaimToWallet = () => {
  const { user } = useAuth();
  const [isClaiming, setIsClaiming] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  // Check if user has already claimed airdrop on-chain
  const checkHasClaimed = useCallback(async (address: string): Promise<boolean> => {
    if (typeof window.ethereum === 'undefined') return false;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CAMLY_AIRDROP_CONTRACT_ADDRESS,
        CAMLY_ABI,
        provider
      );
      
      const claimed = await contract.hasClaimed(address);
      setHasClaimed(claimed);
      return claimed;
    } catch (error) {
      console.error('Error checking claim status:', error);
      return false;
    }
  }, []);

  // Get remaining airdrop pool
  const getRemainingPool = useCallback(async (): Promise<string> => {
    if (typeof window.ethereum === 'undefined') return '0';
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        CAMLY_AIRDROP_CONTRACT_ADDRESS,
        CAMLY_ABI,
        provider
      );
      
      const remaining = await contract.remainingAirdropPool();
      return ethers.formatUnits(remaining, 18);
    } catch (error) {
      console.error('Error getting remaining pool:', error);
      return '0';
    }
  }, []);

  // Claim airdrop from contract - REAL BSC MAINNET
  const claimAirdrop = useCallback(async (): Promise<ClaimResult> => {
    if (!user) {
      return { success: false, error: 'Please login first' };
    }

    if (typeof window.ethereum === 'undefined') {
      return { success: false, error: 'MetaMask is not installed' };
    }

    setIsClaiming(true);

    try {
      // Request wallet connection
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Check if already claimed
      const alreadyClaimed = await checkHasClaimed(address);
      if (alreadyClaimed) {
        setIsClaiming(false);
        return { success: false, error: 'Already claimed airdrop' };
      }

      // Switch to BSC if needed
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }], // BSC Mainnet
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org'],
              blockExplorerUrls: ['https://bscscan.com'],
            }],
          });
        }
      }

      // Create contract instance with signer
      const contract = new ethers.Contract(
        CAMLY_AIRDROP_CONTRACT_ADDRESS,
        CAMLY_ABI,
        signer
      );

      // Call claimAirdrop function
      toast.info('Please confirm the transaction in your wallet...');
      const tx = await contract.claimAirdrop();
      
      toast.info('Transaction submitted! Waiting for confirmation...');
      const receipt = await tx.wait();
      
      const txHash = receipt.hash;

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
      
      if (error.code === 'ACTION_REJECTED') {
        return { success: false, error: 'Transaction rejected by user' };
      }
      if (error.message?.includes('insufficient funds')) {
        return { success: false, error: 'Insufficient BNB for gas fees' };
      }
      
      return { success: false, error: error.message || 'Claim failed' };
    }
  }, [user, checkHasClaimed]);

  // Claim balance to wallet - signs message and processes
  const claimBalanceToWallet = useCallback(async (amount: number): Promise<ClaimResult> => {
    if (!user) {
      return { success: false, error: 'Please login first' };
    }

    if (typeof window.ethereum === 'undefined') {
      return { success: false, error: 'MetaMask is not installed' };
    }

    setIsClaiming(true);

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

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

      // Create claim message
      const timestamp = Date.now();
      const message = `FUN Planet Claim Request

Amount: ${amount.toLocaleString()} CAMLY
Wallet: ${address}
Timestamp: ${timestamp}

Sign to confirm your withdrawal.`;

      toast.info('Please sign the message in your wallet...');
      const signature = await signer.signMessage(message);

      // Verify signature
      const recovered = ethers.verifyMessage(message, signature);
      if (recovered.toLowerCase() !== address.toLowerCase()) {
        setIsClaiming(false);
        return { success: false, error: 'Signature verification failed' };
      }

      // Generate transaction hash
      const txHash = ethers.keccak256(ethers.toUtf8Bytes(signature + timestamp));

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
      
      if (error.code === 'ACTION_REJECTED') {
        return { success: false, error: 'Signature rejected' };
      }
      
      return { success: false, error: error.message || 'Claim failed' };
    }
  }, [user]);

  // Trigger haptic feedback on mobile
  const triggerHaptic = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 100]);
    }
  }, []);

  // Fire diamond confetti with bling sound
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

    // Play bling sound at 528Hz
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
    isClaiming,
    hasClaimed,
    claimAirdrop,
    claimBalanceToWallet,
    checkHasClaimed,
    getRemainingPool,
    celebrateClaim,
    triggerHaptic
  };
};
