import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  PLAY_REWARDS, 
  AGE_DAILY_CAPS, 
  getDailyCap,
  type AgeGroup 
} from '@/config/playtimeRewards';

interface PlaySession {
  id: string;
  gameId: string;
  gameType: 'uploaded' | 'builtin';
  startedAt: Date;
  lastActivityAt: Date;
  totalSeconds: number;
  rewardsEarned: number;
  isActive: boolean;
}

interface DailyRewardState {
  newGameCount: number;
  newGameRewards: number;
  timeRewards: number;
  totalMinutes: number;
  dailyCap: number;
  remainingCap: number;
}

interface PlayTimeRewardsState {
  currentSession: PlaySession | null;
  dailyState: DailyRewardState;
  isNewGame: boolean;
  canEarnRewards: boolean;
  pendingRewards: number;
  ageGroup: AgeGroup;
}

export const usePlayTimeRewards = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PlayTimeRewardsState>({
    currentSession: null,
    dailyState: {
      newGameCount: 0,
      newGameRewards: 0,
      timeRewards: 0,
      totalMinutes: 0,
      dailyCap: 60000,
      remainingCap: 60000,
    },
    isNewGame: false,
    canEarnRewards: true,
    pendingRewards: 0,
    ageGroup: '18+',
  });
  
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rewardTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastRewardTimeRef = useRef<number>(0);

  // Load daily reward state
  const loadDailyState = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // For now, assume 18+ since we don't have age in profiles
      const ageGroup = '18+' as AgeGroup;
      const cap = getDailyCap(ageGroup);

      // Get or create daily reward record
      const { data: dailyReward, error } = await supabase
        .from('daily_play_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('reward_date', today)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record for today, create one
        await supabase.from('daily_play_rewards').insert({
          user_id: user.id,
          reward_date: today,
          age_group: ageGroup,
          daily_cap: cap.maxCamly,
        });

        setState(prev => ({
          ...prev,
          ageGroup,
          dailyState: {
            newGameCount: 0,
            newGameRewards: 0,
            timeRewards: 0,
            totalMinutes: 0,
            dailyCap: cap.maxCamly,
            remainingCap: cap.maxCamly,
          },
          canEarnRewards: true,
        }));
      } else if (dailyReward) {
        const totalEarned = dailyReward.new_game_rewards_earned + dailyReward.time_rewards_earned;
        const remaining = Math.max(0, cap.maxCamly - totalEarned);

        setState(prev => ({
          ...prev,
          ageGroup,
          dailyState: {
            newGameCount: dailyReward.new_game_count,
            newGameRewards: dailyReward.new_game_rewards_earned,
            timeRewards: dailyReward.time_rewards_earned,
            totalMinutes: dailyReward.total_play_minutes,
            dailyCap: cap.maxCamly,
            remainingCap: remaining,
          },
          canEarnRewards: remaining > 0,
        }));
      }
    } catch (error) {
      console.error('Error loading daily state:', error);
    }
  }, [user]);

  useEffect(() => {
    loadDailyState();
  }, [loadDailyState]);

  // Check if this is a new game for the user
  const checkIsNewGame = useCallback(async (gameId: string, gameType: 'uploaded' | 'builtin') => {
    if (!user) return false;

    const { data } = await supabase
      .from('user_game_plays')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .eq('game_type', gameType)
      .single();

    return !data;
  }, [user]);

  // Start a play session
  const startSession = useCallback(async (gameId: string, gameType: 'uploaded' | 'builtin' = 'builtin') => {
    if (!user || !state.canEarnRewards) return;

    const isNew = await checkIsNewGame(gameId, gameType);
    const canClaimNewGameBonus = isNew && state.dailyState.newGameCount < PLAY_REWARDS.MAX_NEW_GAME_BONUSES;

    // Create session in database
    const { data: session, error } = await supabase
      .from('play_sessions')
      .insert({
        user_id: user.id,
        game_id: gameId,
        game_type: gameType,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return;
    }

    // Create or update user_game_plays record
    if (isNew) {
      await supabase.from('user_game_plays').insert({
        user_id: user.id,
        game_id: gameId,
        game_type: gameType,
        new_game_reward_claimed: canClaimNewGameBonus,
        new_game_reward_amount: canClaimNewGameBonus ? PLAY_REWARDS.NEW_GAME_BONUS : 0,
      });

      // Award new game bonus if eligible
      if (canClaimNewGameBonus) {
        const bonus = Math.min(PLAY_REWARDS.NEW_GAME_BONUS, state.dailyState.remainingCap);
        
        if (bonus > 0) {
          // Update wallet balance using existing RPC
          await supabase.rpc('update_wallet_balance', {
            p_user_id: user.id,
            p_amount: bonus,
            p_operation: 'add',
          });

          // Update daily rewards
          const today = new Date().toISOString().split('T')[0];
          await supabase
            .from('daily_play_rewards')
            .update({
              new_game_count: state.dailyState.newGameCount + 1,
              new_game_rewards_earned: state.dailyState.newGameRewards + bonus,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .eq('reward_date', today);

          toast({
            title: "🎮 Game Mới!",
            description: `+${bonus.toLocaleString()} CAMLY cho game đầu tiên!`,
          });

          setState(prev => ({
            ...prev,
            pendingRewards: prev.pendingRewards + bonus,
            dailyState: {
              ...prev.dailyState,
              newGameCount: prev.dailyState.newGameCount + 1,
              newGameRewards: prev.dailyState.newGameRewards + bonus,
              remainingCap: prev.dailyState.remainingCap - bonus,
            },
          }));
        }
      }
    }

    setState(prev => ({
      ...prev,
      currentSession: {
        id: session.id,
        gameId,
        gameType,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        totalSeconds: 0,
        rewardsEarned: 0,
        isActive: true,
      },
      isNewGame: isNew,
    }));

    // Start reward timer (every minute)
    startRewardTimer(session.id);

  }, [user, state.canEarnRewards, state.dailyState, checkIsNewGame]);

  // Start reward timer
  const startRewardTimer = useCallback((sessionId: string) => {
    // Clear existing timer
    if (rewardTimerRef.current) {
      clearInterval(rewardTimerRef.current);
    }

    // Award rewards every minute
    rewardTimerRef.current = setInterval(async () => {
      if (!user) return;

      const now = Date.now();
      const timeSinceLastReward = now - lastRewardTimeRef.current;
      
      // Check cooldown
      if (timeSinceLastReward < PLAY_REWARDS.COOLDOWN_SECONDS * 1000) {
        return;
      }

      // Check if session has minimum duration
      setState(prev => {
        if (!prev.currentSession || !prev.currentSession.isActive) return prev;
        
        const sessionDuration = (now - prev.currentSession.startedAt.getTime()) / 1000;
        if (sessionDuration < PLAY_REWARDS.MIN_SESSION_SECONDS) return prev;

        // Check AFK
        const timeSinceActivity = (now - prev.currentSession.lastActivityAt.getTime()) / 1000;
        if (timeSinceActivity > PLAY_REWARDS.AFK_TIMEOUT_SECONDS) {
          return {
            ...prev,
            currentSession: { ...prev.currentSession, isActive: false },
          };
        }

        return prev;
      });

      // Award time-based rewards
      const reward = Math.min(PLAY_REWARDS.CAMLY_PER_MINUTE, state.dailyState.remainingCap);
      
      if (reward > 0 && state.currentSession?.isActive) {
        lastRewardTimeRef.current = now;

        // Update wallet using existing RPC
        await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_amount: reward,
          p_operation: 'add',
        });

        // Update session
        await supabase
          .from('play_sessions')
          .update({
            duration_seconds: Math.floor((now - (state.currentSession?.startedAt.getTime() || now)) / 1000),
            rewards_earned: (state.currentSession?.rewardsEarned || 0) + reward,
            last_activity_at: new Date().toISOString(),
          })
          .eq('id', sessionId);

        // Update daily rewards
        const today = new Date().toISOString().split('T')[0];
        await supabase
          .from('daily_play_rewards')
          .update({
            time_rewards_earned: state.dailyState.timeRewards + reward,
            total_play_minutes: state.dailyState.totalMinutes + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id)
          .eq('reward_date', today);

        setState(prev => ({
          ...prev,
          pendingRewards: prev.pendingRewards + reward,
          currentSession: prev.currentSession ? {
            ...prev.currentSession,
            totalSeconds: prev.currentSession.totalSeconds + 60,
            rewardsEarned: prev.currentSession.rewardsEarned + reward,
          } : null,
          dailyState: {
            ...prev.dailyState,
            timeRewards: prev.dailyState.timeRewards + reward,
            totalMinutes: prev.dailyState.totalMinutes + 1,
            remainingCap: prev.dailyState.remainingCap - reward,
          },
          canEarnRewards: prev.dailyState.remainingCap - reward > 0,
        }));

        toast({
          title: "⏱️ Thưởng Thời Gian!",
          description: `+${reward.toLocaleString()} CAMLY (${state.dailyState.totalMinutes + 1} phút)`,
        });
      }
    }, 60000); // Every minute
  }, [user, state.dailyState, state.currentSession]);

  // Record user activity (for AFK detection)
  const recordActivity = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentSession: prev.currentSession ? {
        ...prev.currentSession,
        lastActivityAt: new Date(),
        isActive: true,
      } : null,
    }));
  }, []);

  // End session
  const endSession = useCallback(async () => {
    if (!state.currentSession || !user) return;

    // Clear timers
    if (rewardTimerRef.current) {
      clearInterval(rewardTimerRef.current);
    }
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }

    const now = new Date();
    const duration = Math.floor((now.getTime() - state.currentSession.startedAt.getTime()) / 1000);

    // Update session
    await supabase
      .from('play_sessions')
      .update({
        ended_at: now.toISOString(),
        duration_seconds: duration,
      })
      .eq('id', state.currentSession.id);

    // Update user_game_plays
    await supabase
      .from('user_game_plays')
      .update({
        last_play_at: now.toISOString(),
        total_play_seconds: state.currentSession.totalSeconds + duration,
        session_count: 1, // Will be incremented
        total_time_rewards: state.currentSession.rewardsEarned,
        updated_at: now.toISOString(),
      })
      .eq('user_id', user.id)
      .eq('game_id', state.currentSession.gameId)
      .eq('game_type', state.currentSession.gameType);

    setState(prev => ({
      ...prev,
      currentSession: null,
      isNewGame: false,
    }));
  }, [state.currentSession, user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rewardTimerRef.current) {
        clearInterval(rewardTimerRef.current);
      }
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startSession,
    endSession,
    recordActivity,
    loadDailyState,
    rewards: PLAY_REWARDS,
    ageCaps: AGE_DAILY_CAPS,
  };
};
