import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AchievementProgress {
  type: string;
  progress: number;
  requiredCount: number;
  name: string;
}

const ACHIEVEMENT_THRESHOLDS: Record<string, { requiredCount: number; name: string }> = {
  first_game: { requiredCount: 1, name: "Bé Chơi Game 🎮" },
  explorer_5: { requiredCount: 5, name: "Bé Khám Phá 🌍" },
  explorer_10: { requiredCount: 10, name: "Nhà Thám Hiểm 🗺️" },
  explorer_25: { requiredCount: 25, name: "Siêu Khám Phá 🚀" },
  educational_3: { requiredCount: 3, name: "Bé Học Giỏi 📚" },
  creative_3: { requiredCount: 3, name: "Bé Sáng Tạo 🎨" },
  music_3: { requiredCount: 3, name: "Bé Yêu Nhạc 🎵" },
  streak_3: { requiredCount: 3, name: "Bé Chăm Chỉ ⚡" },
  streak_7: { requiredCount: 7, name: "Ngôi Sao Kiên Trì ⭐" },
  streak_30: { requiredCount: 30, name: "Huyền Thoại 👑" },
  play_time_60: { requiredCount: 60, name: "Bé Chơi Ngoan 💖" },
  champion: { requiredCount: 1, name: "Nhà Vô Địch 🏆" },
};

export function useGameAchievements() {
  const { user } = useAuth();

  const updateProgress = useCallback(async (
    achievementType: string,
    newProgress: number
  ): Promise<boolean> => {
    if (!user) return false;

    const threshold = ACHIEVEMENT_THRESHOLDS[achievementType];
    if (!threshold) return false;

    try {
      // Check if achievement already exists
      const { data: existing } = await supabase
        .from('game_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('achievement_type', achievementType)
        .single();

      // If already unlocked, no need to update
      if (existing?.unlocked_at) return false;

      const shouldUnlock = newProgress >= threshold.requiredCount;

      // Upsert the achievement
      const { error } = await supabase
        .from('game_achievements')
        .upsert({
          user_id: user.id,
          achievement_type: achievementType,
          progress: newProgress,
          unlocked_at: shouldUnlock ? new Date().toISOString() : null
        }, {
          onConflict: 'user_id,achievement_type'
        });

      if (error) throw error;

      // Show toast if newly unlocked
      if (shouldUnlock && !existing?.unlocked_at) {
        toast.success(`🎉 Chúc mừng! Đã mở khóa: ${threshold.name}`, {
          duration: 5000,
          icon: '🏆'
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error updating achievement:', error);
      return false;
    }
  }, [user]);

  const checkExplorerAchievements = useCallback(async () => {
    if (!user) return;

    try {
      // Count unique games played from user_game_plays table
      const { count: ugpCount } = await supabase
        .from('user_game_plays')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      let gamesPlayed = ugpCount || 0;

      // Fallback to profiles.total_plays if user_game_plays is empty
      // This ensures existing users can still unlock achievements
      if (gamesPlayed === 0) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_plays')
          .eq('id', user.id)
          .single();
        
        gamesPlayed = profile?.total_plays || 0;
      }

      // Update explorer achievements
      if (gamesPlayed >= 1) await updateProgress('first_game', gamesPlayed);
      if (gamesPlayed >= 5) await updateProgress('explorer_5', gamesPlayed);
      if (gamesPlayed >= 10) await updateProgress('explorer_10', gamesPlayed);
      if (gamesPlayed >= 25) await updateProgress('explorer_25', gamesPlayed);
    } catch (error) {
      console.error('Error checking explorer achievements:', error);
    }
  }, [user, updateProgress]);

  const checkCategoryAchievements = useCallback(async (category: string) => {
    if (!user) return;

    try {
      // Map category to achievement type
      const categoryMap: Record<string, string> = {
        'educational': 'educational_3',
        'creative': 'creative_3',
        'music': 'music_3'
      };

      const achievementType = categoryMap[category];
      if (!achievementType) return;

      // For simplicity, just increment progress by 1 each time a game of this category is played
      // The actual tracking will be done when the game is played
      const { data: existing } = await supabase
        .from('game_achievements')
        .select('progress')
        .eq('user_id', user.id)
        .eq('achievement_type', achievementType)
        .single();

      const currentProgress = existing?.progress || 0;
      await updateProgress(achievementType, currentProgress + 1);
    } catch (error) {
      console.error('Error checking category achievements:', error);
    }
  }, [user, updateProgress]);

  const checkPlayTimeAchievement = useCallback(async (totalMinutes: number) => {
    if (!user) return;
    
    if (totalMinutes >= 60) {
      await updateProgress('play_time_60', totalMinutes);
    }
  }, [user, updateProgress]);

  const checkStreakAchievement = useCallback(async (streakDays: number) => {
    if (!user) return;

    if (streakDays >= 3) await updateProgress('streak_3', streakDays);
    if (streakDays >= 7) await updateProgress('streak_7', streakDays);
    if (streakDays >= 30) await updateProgress('streak_30', streakDays);
  }, [user, updateProgress]);

  const checkChampionAchievement = useCallback(async (rank: number) => {
    if (!user) return;

    if (rank <= 10) {
      await updateProgress('champion', 1);
    }
  }, [user, updateProgress]);

  // Sync all achievements based on current data - useful for existing users
  const syncAllAchievements = useCallback(async () => {
    if (!user) return;
    
    try {
      // Check explorer achievements
      await checkExplorerAchievements();
      
      // Check champion achievement based on leaderboard
      const { data: rankings } = await supabase
        .from('profiles')
        .select('id')
        .order('wallet_balance', { ascending: false })
        .limit(10);
      
      if (rankings) {
        const rank = rankings.findIndex(p => p.id === user.id);
        if (rank !== -1) {
          await checkChampionAchievement(rank + 1);
        }
      }
      
      // Check playtime achievement
      const { data: playRewards } = await supabase
        .from('daily_play_rewards')
        .select('total_play_minutes')
        .eq('user_id', user.id);
      
      if (playRewards) {
        const totalMinutes = playRewards.reduce((sum, r) => sum + (r.total_play_minutes || 0), 0);
        await checkPlayTimeAchievement(totalMinutes);
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing achievements:', error);
      return false;
    }
  }, [user, checkExplorerAchievements, checkChampionAchievement, checkPlayTimeAchievement]);

  return {
    updateProgress,
    checkExplorerAchievements,
    checkCategoryAchievements,
    checkPlayTimeAchievement,
    checkStreakAchievement,
    checkChampionAchievement,
    syncAllAchievements
  };
}
