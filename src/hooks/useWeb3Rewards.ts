import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

const CAMLY_CONTRACT_ADDRESS = '0x0910320181889feFDE0BB1Ca63962b0A8882e413';
const POINTS_TO_CAMLY_RATIO = 100; // 1 point = 100 Camly

// Reward amounts
const REWARDS = {
  FIRST_WALLET_CONNECT: 50000,
  FIRST_GAME_PLAY: 10000,
  DAILY_CHECKIN: 5000,
};

// ERC20 ABI for transfer
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

interface Web3RewardsState {
  camlyBalance: number;
  walletAddress: string | null;
  isConnected: boolean;
  isLoading: boolean;
  firstWalletClaimed: boolean;
  firstGameClaimed: boolean;
  lastDailyCheckin: string | null;
  dailyStreak: number;
}

export const useWeb3Rewards = () => {
  const { user } = useAuth();
  
  const [state, setState] = useState<Web3RewardsState>({
    camlyBalance: 0,
    walletAddress: null,
    isConnected: false,
    isLoading: true,
    firstWalletClaimed: false,
    firstGameClaimed: false,
    lastDailyCheckin: null,
    dailyStreak: 0,
  });
  const [pendingReward, setPendingReward] = useState<{
    amount: number;
    type: string;
    description: string;
  } | null>(null);

  // Load user rewards from database
  const loadRewards = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('web3_rewards')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setState(prev => ({
          ...prev,
          camlyBalance: Number(data.camly_balance) || 0,
          walletAddress: data.wallet_address,
          isConnected: !!data.wallet_address,
          firstWalletClaimed: data.first_wallet_claimed,
          firstGameClaimed: data.first_game_claimed,
          lastDailyCheckin: data.last_daily_checkin,
          dailyStreak: data.daily_streak || 0,
          isLoading: false,
        }));
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    loadRewards();
  }, [loadRewards]);

  // Connect wallet using MetaMask
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!user) {
      toast.error('Please login first');
      return null;
    }

    if (typeof window.ethereum === 'undefined') {
      toast.error('MetaMask is not installed');
      return null;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = accounts[0];

      // ANTI-FRAUD: Check if user can claim wallet_connection reward using database function
      const { data: canClaimData } = await supabase
        .rpc('can_claim_reward', { p_user_id: user.id, p_transaction_type: 'wallet_connection' });
      
      const canClaimBonus = canClaimData === true;

      // Also check web3_rewards table for backward compatibility
      const { data: existing } = await supabase
        .from('web3_rewards')
        .select('first_wallet_claimed, wallet_address, camly_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      // First connect bonus: only if can_claim_reward returns true AND not already claimed
      const isFirstConnect = canClaimBonus && !existing?.first_wallet_claimed;
      const currentBalance = Number(existing?.camly_balance) || 0;

      // Upsert rewards record
      const { error } = await supabase
        .from('web3_rewards')
        .upsert({
          user_id: user.id,
          wallet_address: address,
          first_wallet_claimed: existing?.first_wallet_claimed ?? false,
          camly_balance: isFirstConnect 
            ? currentBalance + REWARDS.FIRST_WALLET_CONNECT 
            : undefined,
        }, { onConflict: 'user_id' });

      if (error) throw error;

      // Award first connection bonus only if not already claimed
      if (isFirstConnect) {
        // ANTI-FRAUD: Use add_reward_safely function to prevent duplicate claims
        const { data: rewardResult, error: rewardError } = await supabase
          .rpc('add_reward_safely', {
            p_user_id: user.id,
            p_amount: REWARDS.FIRST_WALLET_CONNECT,
            p_transaction_type: 'wallet_connection',
            p_description: 'First wallet connection bonus'
          });

        if (rewardError) {
          console.error('Error adding reward:', rewardError);
          // Fallback: still log to web3_reward_transactions for backward compatibility
        }

        await supabase.from('web3_reward_transactions').insert({
          user_id: user.id,
          amount: REWARDS.FIRST_WALLET_CONNECT,
          reward_type: 'first_wallet_connect',
          description: 'First wallet connection bonus',
        });

        await supabase
          .from('web3_rewards')
          .update({ first_wallet_claimed: true })
          .eq('user_id', user.id);

        setPendingReward({
          amount: REWARDS.FIRST_WALLET_CONNECT,
          type: 'first_wallet_connect',
          description: 'First Wallet Connection Bonus!',
        });

        // Process referral bonus for referrer (if user was referred)
        // IMPORTANT: Read the code BEFORE removing it from localStorage
        const storedCode = localStorage.getItem('fun_planet_referral_code');
        
        // Clear referral code from localStorage immediately after reading
        // This prevents the welcome banner from showing again
        localStorage.removeItem('fun_planet_referral_code');
        
        if (storedCode) {
          try {
            // Find the referrer by referral code
            const { data: referrer } = await supabase
              .from('profiles')
              .select('id, username')
              .eq('referral_code', storedCode.toUpperCase())
              .maybeSingle();

            if (referrer && referrer.id !== user.id) {
              // Use secure RPC function to process referral (bypasses RLS)
              const { data: result, error } = await supabase.rpc('process_referral_reward', {
                p_referrer_id: referrer.id,
                p_referred_id: user.id,
                p_referral_code: storedCode.toUpperCase(),
                p_reward_amount: 25000
              });

              if (error) {
                console.error('Error processing referral:', error);
              } else if (result && typeof result === 'object' && 'success' in result && result.success) {
                toast.success(`Bạn đã được ${referrer.username} mời thành công! 🎉`);
              }
            }
          } catch (refError) {
            console.error('Error processing referral:', refError);
          }
        }
      }

      setState(prev => ({
        ...prev,
        walletAddress: address,
        isConnected: true,
        camlyBalance: isFirstConnect ? currentBalance + REWARDS.FIRST_WALLET_CONNECT : prev.camlyBalance,
        firstWalletClaimed: true,
      }));

      return address;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      toast.error(error.message || 'Failed to connect wallet');
      return null;
    }
  }, [user]);

  // Claim first game play reward
  const claimFirstGameReward = useCallback(async () => {
    if (!user || state.firstGameClaimed) return false;

    try {
      // ANTI-FRAUD: Check if user can claim first_game_play reward using database function
      const { data: canClaimData } = await supabase
        .rpc('can_claim_reward', { p_user_id: user.id, p_transaction_type: 'first_game_play' });
      
      if (canClaimData !== true) {
        console.log('First game reward already claimed');
        return false;
      }

      // Check current state
      const { data: current } = await supabase
        .from('web3_rewards')
        .select('first_game_claimed, camly_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      if (current?.first_game_claimed) return false;

      // ANTI-FRAUD: Use add_reward_safely function
      const { data: rewardResult, error: rewardError } = await supabase
        .rpc('add_reward_safely', {
          p_user_id: user.id,
          p_amount: REWARDS.FIRST_GAME_PLAY,
          p_transaction_type: 'first_game_play',
          p_description: 'First game play bonus'
        });

      if (rewardError) {
        console.error('Error adding reward safely:', rewardError);
      }

      const newBalance = (Number(current?.camly_balance) || 0) + REWARDS.FIRST_GAME_PLAY;

      await supabase
        .from('web3_rewards')
        .upsert({
          user_id: user.id,
          first_game_claimed: true,
          camly_balance: newBalance,
        }, { onConflict: 'user_id' });

      await supabase.from('web3_reward_transactions').insert({
        user_id: user.id,
        amount: REWARDS.FIRST_GAME_PLAY,
        reward_type: 'first_game_play',
        description: 'First game play bonus',
      });

      setState(prev => ({
        ...prev,
        camlyBalance: newBalance,
        firstGameClaimed: true,
      }));

      setPendingReward({
        amount: REWARDS.FIRST_GAME_PLAY,
        type: 'first_game_play',
        description: 'First Game Play Bonus!',
      });

      return true;
    } catch (error) {
      console.error('Error claiming first game reward:', error);
      return false;
    }
  }, [user, state.firstGameClaimed]);

  // Claim daily check-in reward
  const claimDailyCheckin = useCallback(async () => {
    if (!user) return false;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    try {
      // ANTI-FRAUD: Check if user can claim daily_checkin reward using database function
      const { data: canClaimData } = await supabase
        .rpc('can_claim_reward', { p_user_id: user.id, p_transaction_type: 'daily_checkin' });
      
      if (canClaimData !== true) {
        toast.info('Already claimed daily check-in today');
        return false;
      }

      const { data: current } = await supabase
        .from('web3_rewards')
        .select('last_daily_checkin, camly_balance, daily_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      if (current?.last_daily_checkin === today) {
        toast.info('Already claimed daily check-in today');
        return false;
      }

      // Calculate new streak
      let newStreak = 1;
      if (current?.last_daily_checkin === yesterday) {
        // Consecutive day - increase streak
        newStreak = (current.daily_streak || 0) + 1;
      }
      // If not yesterday, streak resets to 1

      // Fixed daily reward - no streak multiplier
      const dailyReward = REWARDS.DAILY_CHECKIN;

      // ANTI-FRAUD: Use add_reward_safely function
      const { data: rewardResult, error: rewardError } = await supabase
        .rpc('add_reward_safely', {
          p_user_id: user.id,
          p_amount: dailyReward,
          p_transaction_type: 'daily_checkin',
          p_description: 'Daily check-in reward'
        });

      if (rewardError) {
        console.error('Error adding reward safely:', rewardError);
      }

      const newBalance = (Number(current?.camly_balance) || 0) + dailyReward;

      await supabase
        .from('web3_rewards')
        .upsert({
          user_id: user.id,
          last_daily_checkin: today,
          camly_balance: newBalance,
          daily_streak: newStreak,
        }, { onConflict: 'user_id' });

      await supabase.from('web3_reward_transactions').insert({
        user_id: user.id,
        amount: dailyReward,
        reward_type: 'daily_checkin',
        description: 'Daily check-in reward',
      });

      setState(prev => ({
        ...prev,
        camlyBalance: newBalance,
        lastDailyCheckin: today,
        dailyStreak: newStreak,
      }));

      setPendingReward({
        amount: dailyReward,
        type: 'daily_checkin',
        description: 'Daily Check-in Reward!',
      });

      return true;
    } catch (error) {
      console.error('Error claiming daily checkin:', error);
      return false;
    }
  }, [user]);

  // Convert points to Camly
  const convertPointsToCamly = useCallback(async (points: number) => {
    if (!user || points <= 0) return false;

    const camlyAmount = points * POINTS_TO_CAMLY_RATIO;

    try {
      const { data: current } = await supabase
        .from('web3_rewards')
        .select('camly_balance')
        .eq('user_id', user.id)
        .maybeSingle();

      const newBalance = (Number(current?.camly_balance) || 0) + camlyAmount;

      await supabase
        .from('web3_rewards')
        .upsert({
          user_id: user.id,
          camly_balance: newBalance,
        }, { onConflict: 'user_id' });

      await supabase.from('web3_reward_transactions').insert({
        user_id: user.id,
        amount: camlyAmount,
        reward_type: 'points_conversion',
        description: `Converted ${points} points to ${camlyAmount} Camly`,
      });

      setState(prev => ({
        ...prev,
        camlyBalance: newBalance,
      }));

      setPendingReward({
        amount: camlyAmount,
        type: 'points_conversion',
        description: `Converted ${points} points!`,
      });

      return true;
    } catch (error) {
      console.error('Error converting points:', error);
      return false;
    }
  }, [user]);


  const today = new Date().toISOString().split('T')[0];
  const canClaimDailyCheckin = state.lastDailyCheckin !== today;

  const clearPendingReward = useCallback(() => {
    setPendingReward(null);
  }, []);

  return {
    ...state,
    pendingReward,
    connectWallet,
    claimFirstGameReward,
    claimDailyCheckin,
    convertPointsToCamly,
    canClaimDailyCheckin,
    clearPendingReward,
    loadRewards,
    REWARDS,
    POINTS_TO_CAMLY_RATIO,
    CAMLY_CONTRACT_ADDRESS,
  };
};
