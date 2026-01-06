// 5D Light Economy: Behavior-based Rewards Hook
// Rewards for VALUE (kindness, sharing, cooperation, learning) not TIME

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PLAY_REWARDS, BEHAVIOR_TYPES, type BehaviorType } from '@/config/playtimeRewards';

interface BehaviorReward {
  id: string;
  behavior_type: string;
  amount: number;
  detected_by: string;
  game_id: string | null;
  description: string | null;
  created_at: string;
}

interface BehaviorRewardsState {
  rewards: BehaviorReward[];
  todayTotal: number;
  isLoading: boolean;
}

// Reward amounts by behavior type
const BEHAVIOR_REWARD_AMOUNTS: Record<BehaviorType, number> = {
  [BEHAVIOR_TYPES.KINDNESS]: PLAY_REWARDS.KINDNESS_ACTION,
  [BEHAVIOR_TYPES.SHARING]: PLAY_REWARDS.SHARING_BONUS,
  [BEHAVIOR_TYPES.COOPERATION]: PLAY_REWARDS.COOPERATION_BONUS,
  [BEHAVIOR_TYPES.LEARNING]: PLAY_REWARDS.LEARNING_MILESTONE,
  [BEHAVIOR_TYPES.GAME_COMPLETE]: PLAY_REWARDS.GAME_COMPLETE_BONUS,
  [BEHAVIOR_TYPES.MILESTONE]: PLAY_REWARDS.LEARNING_MILESTONE,
};

export function useBehaviorRewards() {
  const { user } = useAuth();
  const [state, setState] = useState<BehaviorRewardsState>({
    rewards: [],
    todayTotal: 0,
    isLoading: false,
  });

  // Load today's behavior rewards
  const loadTodayRewards = useCallback(async () => {
    if (!user?.id) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('behavior_rewards')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const todayTotal = (data || []).reduce((sum, r) => sum + r.amount, 0);

      setState({
        rewards: data || [],
        todayTotal,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load behavior rewards:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user?.id]);

  // Award a behavior reward
  const awardBehaviorReward = useCallback(async (
    behaviorType: BehaviorType,
    options?: {
      gameId?: string;
      description?: string;
      detectedBy?: 'ai_angel' | 'parent' | 'community' | 'system';
      customAmount?: number;
    }
  ) => {
    if (!user?.id) return { success: false, error: 'Not authenticated' };

    const amount = options?.customAmount || BEHAVIOR_REWARD_AMOUNTS[behaviorType] || 500;
    const detectedBy = options?.detectedBy || 'system';

    try {
      // Insert behavior reward record
      const { error: insertError } = await supabase
        .from('behavior_rewards')
        .insert({
          user_id: user.id,
          behavior_type: behaviorType,
          amount,
          detected_by: detectedBy,
          game_id: options?.gameId,
          description: options?.description,
        });

      if (insertError) throw insertError;

      // Update wallet balance
      const { error: updateError } = await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: amount,
        p_operation: 'add',
      });

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from('camly_coin_transactions').insert({
        user_id: user.id,
        amount,
        transaction_type: 'behavior_reward',
        description: getBehaviorDescription(behaviorType, options?.description),
      });

      // Show child-friendly notification
      showBehaviorRewardToast(behaviorType, amount);

      // Reload rewards
      await loadTodayRewards();

      return { success: true, amount };
    } catch (error) {
      console.error('Failed to award behavior reward:', error);
      return { success: false, error: 'Failed to award reward' };
    }
  }, [user?.id, loadTodayRewards]);

  // Award kindness reward
  const awardKindness = useCallback((description?: string, gameId?: string) => {
    return awardBehaviorReward(BEHAVIOR_TYPES.KINDNESS, {
      description: description || 'Hành vi tử tế được ghi nhận',
      gameId,
      detectedBy: 'ai_angel',
    });
  }, [awardBehaviorReward]);

  // Award sharing reward
  const awardSharing = useCallback((description?: string, gameId?: string) => {
    return awardBehaviorReward(BEHAVIOR_TYPES.SHARING, {
      description: description || 'Chia sẻ game với bạn bè',
      gameId,
      detectedBy: 'system',
    });
  }, [awardBehaviorReward]);

  // Award cooperation reward
  const awardCooperation = useCallback((description?: string, gameId?: string) => {
    return awardBehaviorReward(BEHAVIOR_TYPES.COOPERATION, {
      description: description || 'Hợp tác xây dựng Planet',
      gameId,
      detectedBy: 'system',
    });
  }, [awardBehaviorReward]);

  // Award learning milestone
  const awardLearning = useCallback((description?: string, gameId?: string) => {
    return awardBehaviorReward(BEHAVIOR_TYPES.LEARNING, {
      description: description || 'Đạt cột mốc học tập',
      gameId,
      detectedBy: 'ai_angel',
    });
  }, [awardBehaviorReward]);

  // Award game completion
  const awardGameComplete = useCallback((gameTitle: string, gameId?: string) => {
    return awardBehaviorReward(BEHAVIOR_TYPES.GAME_COMPLETE, {
      description: `Hoàn thành game: ${gameTitle}`,
      gameId,
      detectedBy: 'system',
    });
  }, [awardBehaviorReward]);

  return {
    ...state,
    loadTodayRewards,
    awardBehaviorReward,
    awardKindness,
    awardSharing,
    awardCooperation,
    awardLearning,
    awardGameComplete,
    BEHAVIOR_TYPES,
    BEHAVIOR_REWARD_AMOUNTS,
  };
}

// Helper: Get behavior description in Vietnamese
function getBehaviorDescription(behaviorType: BehaviorType, customDesc?: string): string {
  if (customDesc) return customDesc;
  
  const descriptions: Record<BehaviorType, string> = {
    [BEHAVIOR_TYPES.KINDNESS]: '❤️ Phần thưởng cho hành vi tử tế',
    [BEHAVIOR_TYPES.SHARING]: '🤝 Phần thưởng chia sẻ với bạn bè',
    [BEHAVIOR_TYPES.COOPERATION]: '🌍 Phần thưởng hợp tác nhóm',
    [BEHAVIOR_TYPES.LEARNING]: '🧠 Phần thưởng học tập',
    [BEHAVIOR_TYPES.GAME_COMPLETE]: '🎮 Hoàn thành game',
    [BEHAVIOR_TYPES.MILESTONE]: '⭐ Đạt cột mốc quan trọng',
  };
  
  return descriptions[behaviorType] || 'Phần thưởng giá trị';
}

// Helper: Show child-friendly toast notification
function showBehaviorRewardToast(behaviorType: BehaviorType, amount: number) {
  const messages: Record<BehaviorType, { title: string; emoji: string }> = {
    [BEHAVIOR_TYPES.KINDNESS]: { title: 'Tuyệt vời! Bạn thật tử tế!', emoji: '❤️' },
    [BEHAVIOR_TYPES.SHARING]: { title: 'Cảm ơn bạn đã chia sẻ!', emoji: '🤝' },
    [BEHAVIOR_TYPES.COOPERATION]: { title: 'Làm việc nhóm tuyệt vời!', emoji: '🌍' },
    [BEHAVIOR_TYPES.LEARNING]: { title: 'Xuất sắc! Bạn đang tiến bộ!', emoji: '🧠' },
    [BEHAVIOR_TYPES.GAME_COMPLETE]: { title: 'Hoàn thành xuất sắc!', emoji: '🎮' },
    [BEHAVIOR_TYPES.MILESTONE]: { title: 'Cột mốc mới đạt được!', emoji: '⭐' },
  };

  const msg = messages[behaviorType] || { title: 'Phần thưởng!', emoji: '🎁' };
  
  toast.success(`${msg.emoji} ${msg.title}`, {
    description: `+${amount.toLocaleString()} CAMLY`,
    duration: 4000,
  });
}
