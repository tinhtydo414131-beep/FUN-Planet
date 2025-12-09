import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const UPLOAD_REWARD_AMOUNT = 500000; // 500K CAMLY
const MAX_DAILY_REWARDS = 4;

interface UseUploadRewardReturn {
  claimReward: (gameId: string) => Promise<boolean>;
  isClaimingReward: boolean;
  dailyRewardsRemaining: number;
  checkDailyRewards: () => Promise<void>;
}

export function useUploadReward(): UseUploadRewardReturn {
  const { user } = useAuth();
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [dailyRewardsRemaining, setDailyRewardsRemaining] = useState(MAX_DAILY_REWARDS);

  const checkDailyRewards = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('get_or_create_daily_reward', {
        p_user_id: user.id
      });

      if (!error && data && data.length > 0) {
        setDailyRewardsRemaining(data[0].remaining_rewards || MAX_DAILY_REWARDS);
      }
    } catch (error) {
      console.error('Error checking daily rewards:', error);
    }
  }, [user]);

  const claimReward = useCallback(async (gameId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để nhận thưởng');
      return false;
    }

    if (dailyRewardsRemaining <= 0) {
      toast.error('Bạn đã nhận đủ 4 lần thưởng hôm nay. Quay lại ngày mai nhé! 💝');
      return false;
    }

    setIsClaimingReward(true);

    try {
      // Check if can receive reward
      const { data: rewardCheck } = await supabase.rpc('get_or_create_daily_reward', {
        p_user_id: user.id
      });

      if (!rewardCheck || rewardCheck.length === 0 || !rewardCheck[0].can_receive_reward) {
        toast.error('Bạn đã nhận đủ thưởng hôm nay!');
        setIsClaimingReward(false);
        return false;
      }

      // Get current balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', user.id)
        .single();

      const currentBalance = profile?.wallet_balance || 0;
      const newBalance = currentBalance + UPLOAD_REWARD_AMOUNT;

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Increment daily reward count
      await supabase.rpc('increment_daily_reward', {
        p_user_id: user.id,
        p_coins_amount: UPLOAD_REWARD_AMOUNT
      });

      // Record transaction
      await supabase
        .from('web3_reward_transactions')
        .insert({
          user_id: user.id,
          amount: UPLOAD_REWARD_AMOUNT,
          reward_type: 'upload_game_approved',
          description: `Game approved reward - Game ID: ${gameId}`
        });

      // Fire confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#00FF00', '#00BFFF']
      });

      toast.success(`🎉 Bạn nhận được ${UPLOAD_REWARD_AMOUNT.toLocaleString()} CAMLY!`);
      
      // Update remaining rewards
      setDailyRewardsRemaining(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error('Có lỗi khi nhận thưởng. Vui lòng thử lại.');
      return false;
    } finally {
      setIsClaimingReward(false);
    }
  }, [user, dailyRewardsRemaining]);

  return {
    claimReward,
    isClaimingReward,
    dailyRewardsRemaining,
    checkDailyRewards
  };
}
