import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CREATOR_REWARDS } from '@/config/playtimeRewards';

interface GameEarnings {
  gameId: string;
  gameType: string;
  uploadBonusClaimed: boolean;
  uploadBonusAmount: number;
  firstPlaysCount: number;
  firstPlayEarnings: number;
  totalPlayMinutes: number;
  royaltyEarnings: number;
  milestone100Claimed: boolean;
  milestone500Claimed: boolean;
  milestone1000Claimed: boolean;
  totalMilestoneEarnings: number;
  dailyEarningsToday: number;
  totalEarnings: number;
}

interface CreatorEarningsState {
  games: GameEarnings[];
  totalEarnings: number;
  dailyEarnings: number;
  dailyCap: number;
  remainingDailyCap: number;
  isLoading: boolean;
}

export const useCreatorEarnings = () => {
  const { user } = useAuth();
  const [state, setState] = useState<CreatorEarningsState>({
    games: [],
    totalEarnings: 0,
    dailyEarnings: 0,
    dailyCap: CREATOR_REWARDS.DAILY_CAP,
    remainingDailyCap: CREATOR_REWARDS.DAILY_CAP,
    isLoading: true,
  });

  // Load creator earnings
  const loadEarnings = useCallback(async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: earnings, error } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id);

      if (error) {
        console.error('Error loading creator earnings:', error);
        return;
      }

      if (earnings) {
        let totalEarnings = 0;
        let dailyEarnings = 0;

        const games: GameEarnings[] = earnings.map(e => {
          // Reset daily earnings if it's a new day
          const needsReset = e.last_daily_reset !== today;
          const currentDailyEarnings = needsReset ? 0 : e.daily_earnings_today;

          totalEarnings += e.total_earnings;
          dailyEarnings += currentDailyEarnings;

          return {
            gameId: e.game_id,
            gameType: e.game_type,
            uploadBonusClaimed: e.upload_bonus_claimed,
            uploadBonusAmount: e.upload_bonus_amount,
            firstPlaysCount: e.first_plays_count,
            firstPlayEarnings: e.first_play_earnings,
            totalPlayMinutes: e.total_play_minutes,
            royaltyEarnings: e.royalty_earnings,
            milestone100Claimed: e.milestone_100_claimed,
            milestone500Claimed: e.milestone_500_claimed,
            milestone1000Claimed: e.milestone_1000_claimed,
            totalMilestoneEarnings: e.total_milestone_earnings,
            dailyEarningsToday: currentDailyEarnings,
            totalEarnings: e.total_earnings,
          };
        });

        setState({
          games,
          totalEarnings,
          dailyEarnings,
          dailyCap: CREATOR_REWARDS.DAILY_CAP,
          remainingDailyCap: Math.max(0, CREATOR_REWARDS.DAILY_CAP - dailyEarnings),
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading earnings:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  // Claim upload bonus when game is approved
  const claimUploadBonus = useCallback(async (gameId: string, gameType: 'uploaded' | 'builtin' = 'uploaded') => {
    if (!user) return false;

    try {
      // Check if already claimed
      const { data: existing } = await supabase
        .from('creator_earnings')
        .select('upload_bonus_claimed')
        .eq('creator_id', user.id)
        .eq('game_id', gameId)
        .eq('game_type', gameType)
        .single();

      if (existing?.upload_bonus_claimed) {
        toast({
          title: "Đã Nhận",
          description: "Bạn đã nhận thưởng upload cho game này rồi!",
          variant: "destructive",
        });
        return false;
      }

      const bonus = CREATOR_REWARDS.UPLOAD_BONUS;

      // Create or update earnings record
      const { error } = await supabase
        .from('creator_earnings')
        .upsert({
          creator_id: user.id,
          game_id: gameId,
          game_type: gameType,
          upload_bonus_claimed: true,
          upload_bonus_amount: bonus,
          total_earnings: bonus,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'creator_id,game_id,game_type',
        });

      if (error) throw error;

      // Update wallet using existing RPC
      await supabase.rpc('update_wallet_balance', {
        p_user_id: user.id,
        p_amount: bonus,
        p_operation: 'add',
      });

      // Record transaction
      await supabase.from('camly_coin_transactions').insert({
        user_id: user.id,
        amount: bonus,
        transaction_type: 'creator_upload_bonus',
        description: `Upload bonus for game ${gameId}`,
      });

      toast({
        title: "🎉 Thưởng Upload Game!",
        description: `+${bonus.toLocaleString()} CAMLY đã được thêm vào ví!`,
      });

      loadEarnings();
      return true;
    } catch (error) {
      console.error('Error claiming upload bonus:', error);
      return false;
    }
  }, [user, loadEarnings]);

  // Record a first play from a player (called when someone plays your game for first time)
  const recordFirstPlay = useCallback(async (gameId: string, playerId: string, gameType: 'uploaded' | 'builtin' = 'uploaded') => {
    if (!user || state.remainingDailyCap <= 0) return;

    try {
      const bonus = Math.min(CREATOR_REWARDS.FIRST_PLAY_BONUS, state.remainingDailyCap);
      const today = new Date().toISOString().split('T')[0];

      // Get current earnings
      const { data: current } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .eq('game_id', gameId)
        .eq('game_type', gameType)
        .single();

      if (current) {
        // Check daily reset
        const needsReset = current.last_daily_reset !== today;
        const newDailyEarnings = (needsReset ? 0 : current.daily_earnings_today) + bonus;

        // Check milestone
        const newFirstPlaysCount = current.first_plays_count + 1;
        let milestoneBonus = 0;
        let milestone100 = current.milestone_100_claimed;
        let milestone500 = current.milestone_500_claimed;
        let milestone1000 = current.milestone_1000_claimed;

        if (newFirstPlaysCount >= 100 && !milestone100) {
          milestoneBonus += CREATOR_REWARDS.MILESTONES[100];
          milestone100 = true;
        }
        if (newFirstPlaysCount >= 500 && !milestone500) {
          milestoneBonus += CREATOR_REWARDS.MILESTONES[500];
          milestone500 = true;
        }
        if (newFirstPlaysCount >= 1000 && !milestone1000) {
          milestoneBonus += CREATOR_REWARDS.MILESTONES[1000];
          milestone1000 = true;
        }

        const totalBonus = bonus + milestoneBonus;

        await supabase
          .from('creator_earnings')
          .update({
            first_plays_count: newFirstPlaysCount,
            first_play_earnings: current.first_play_earnings + bonus,
            daily_earnings_today: newDailyEarnings,
            last_daily_reset: today,
            milestone_100_claimed: milestone100,
            milestone_500_claimed: milestone500,
            milestone_1000_claimed: milestone1000,
            total_milestone_earnings: current.total_milestone_earnings + milestoneBonus,
            total_earnings: current.total_earnings + totalBonus,
            updated_at: new Date().toISOString(),
          })
          .eq('creator_id', user.id)
          .eq('game_id', gameId)
          .eq('game_type', gameType);

        // Update wallet
        if (totalBonus > 0) {
          await supabase.rpc('update_wallet_balance', {
            p_user_id: user.id,
            p_amount: totalBonus,
            p_operation: 'add',
          });
        }

        if (milestoneBonus > 0) {
          toast({
            title: "🏆 Milestone Đạt Được!",
            description: `+${milestoneBonus.toLocaleString()} CAMLY từ milestone ${newFirstPlaysCount} người chơi!`,
          });
        }
      } else {
        // Create new record
        await supabase.from('creator_earnings').insert({
          creator_id: user.id,
          game_id: gameId,
          game_type: gameType,
          first_plays_count: 1,
          first_play_earnings: bonus,
          daily_earnings_today: bonus,
          last_daily_reset: today,
          total_earnings: bonus,
        });

        // Update wallet
        await supabase.rpc('update_wallet_balance', {
          p_user_id: user.id,
          p_amount: bonus,
          p_operation: 'add',
        });
      }

      loadEarnings();
    } catch (error) {
      console.error('Error recording first play:', error);
    }
  }, [user, state.remainingDailyCap, loadEarnings]);

  // Record royalty from playtime
  const recordRoyalty = useCallback(async (gameId: string, minutes: number, gameType: 'uploaded' | 'builtin' = 'uploaded') => {
    if (!user || state.remainingDailyCap <= 0) return;

    try {
      const royalty = Math.min(
        CREATOR_REWARDS.ROYALTY_PER_MINUTE * minutes,
        state.remainingDailyCap
      );
      const today = new Date().toISOString().split('T')[0];

      const { data: current } = await supabase
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', user.id)
        .eq('game_id', gameId)
        .eq('game_type', gameType)
        .single();

      if (current) {
        const needsReset = current.last_daily_reset !== today;
        const newDailyEarnings = (needsReset ? 0 : current.daily_earnings_today) + royalty;

        if (newDailyEarnings <= CREATOR_REWARDS.DAILY_CAP) {
          await supabase
            .from('creator_earnings')
            .update({
              total_play_minutes: current.total_play_minutes + minutes,
              royalty_earnings: current.royalty_earnings + royalty,
              daily_earnings_today: newDailyEarnings,
              last_daily_reset: today,
              total_earnings: current.total_earnings + royalty,
              updated_at: new Date().toISOString(),
            })
            .eq('creator_id', user.id)
            .eq('game_id', gameId)
            .eq('game_type', gameType);

          // Update wallet
          await supabase.rpc('update_wallet_balance', {
            p_user_id: user.id,
            p_amount: royalty,
            p_operation: 'add',
          });
        }
      }

      loadEarnings();
    } catch (error) {
      console.error('Error recording royalty:', error);
    }
  }, [user, state.remainingDailyCap, loadEarnings]);

  return {
    ...state,
    loadEarnings,
    claimUploadBonus,
    recordFirstPlay,
    recordRoyalty,
    rewards: CREATOR_REWARDS,
  };
};
