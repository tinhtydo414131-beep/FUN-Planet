import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGemFusionStore, LevelProgress } from '../store';
import { useAuth } from '@/hooks/useAuth';

// Debounce helper
const debounce = <T extends (...args: unknown[]) => void>(fn: T, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

export const useGemFusionSync = () => {
  const store = useGemFusionStore();
  const { user } = useAuth();
  const isInitialized = useRef(false);
  const isSyncing = useRef(false);

  // Load progress from Supabase
  const loadProgress = useCallback(async () => {
    if (!user?.id || isInitialized.current) return;
    
    try {
      // Load main progress
      const { data: progress, error: progressError } = await supabase
        .from('gem_fusion_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (progressError) {
        console.error('Error loading gem fusion progress:', progressError);
        return;
      }
      
      // Load level progress
      const { data: levelData, error: levelError } = await supabase
        .from('gem_fusion_level_progress')
        .select('*')
        .eq('user_id', user.id);
      
      if (levelError) {
        console.error('Error loading level progress:', levelError);
        return;
      }
      
      // If we have saved data, restore it
      if (progress) {
        isSyncing.current = true;
        
        // Convert database format to store format
        const levelProgress: LevelProgress[] = (levelData || []).map(l => ({
          levelId: l.level_id,
          stars: l.stars || 0,
          highScore: l.high_score || 0,
          completed: l.completed || false,
        }));
        
        // Update store with saved data
        useGemFusionStore.setState({
          lives: progress.lives ?? 5,
          stars: progress.stars ?? 0,
          coins: progress.coins ?? 100,
          currentLevel: progress.current_level ?? 1,
          currentWorld: progress.current_world ?? 1,
          unlockedWorlds: progress.unlocked_worlds || [1],
          boosters: {
            hammer: progress.booster_hammer ?? 3,
            extraMoves: progress.booster_extra_moves ?? 2,
            rainbow: progress.booster_rainbow ?? 1,
            fishSwarm: progress.booster_fish_swarm ?? 2,
          },
          soundEnabled: progress.sound_enabled ?? true,
          musicEnabled: progress.music_enabled ?? true,
          lastDailyReward: progress.last_daily_reward 
            ? new Date(progress.last_daily_reward).getTime() 
            : 0,
          dailyStreak: progress.daily_streak ?? 0,
          levelProgress,
        });
        
        isSyncing.current = false;
      }
      
      isInitialized.current = true;
    } catch (error) {
      console.error('Failed to load gem fusion progress:', error);
    }
  }, [user?.id]);

  // Save progress to Supabase
  const saveProgress = useCallback(async () => {
    if (!user?.id || !isInitialized.current || isSyncing.current) return;
    
    const state = useGemFusionStore.getState();
    
    try {
      // Upsert main progress
      const { error: progressError } = await supabase
        .from('gem_fusion_progress')
        .upsert({
          user_id: user.id,
          lives: state.lives,
          stars: state.stars,
          coins: state.coins,
          current_level: state.currentLevel,
          current_world: state.currentWorld,
          unlocked_worlds: state.unlockedWorlds,
          booster_hammer: state.boosters.hammer,
          booster_extra_moves: state.boosters.extraMoves,
          booster_rainbow: state.boosters.rainbow,
          booster_fish_swarm: state.boosters.fishSwarm,
          sound_enabled: state.soundEnabled,
          music_enabled: state.musicEnabled,
          last_daily_reward: state.lastDailyReward 
            ? new Date(state.lastDailyReward).toISOString() 
            : null,
          daily_streak: state.dailyStreak,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
      
      if (progressError) {
        console.error('Error saving gem fusion progress:', progressError);
        return;
      }
      
      // Upsert level progress for each completed level
      if (state.levelProgress.length > 0) {
        const levelUpdates = state.levelProgress.map(l => ({
          user_id: user.id,
          level_id: l.levelId,
          stars: l.stars,
          high_score: l.highScore,
          completed: l.completed,
          completed_at: l.completed ? new Date().toISOString() : null,
        }));
        
        const { error: levelError } = await supabase
          .from('gem_fusion_level_progress')
          .upsert(levelUpdates, {
            onConflict: 'user_id,level_id',
          });
        
        if (levelError) {
          console.error('Error saving level progress:', levelError);
        }
      }
    } catch (error) {
      console.error('Failed to save gem fusion progress:', error);
    }
  }, [user?.id]);

  // Debounced save (500ms delay)
  const debouncedSave = useCallback(
    debounce(() => saveProgress(), 500),
    [saveProgress]
  );

  // Load on mount when user is available
  useEffect(() => {
    if (user?.id) {
      loadProgress();
    }
  }, [user?.id, loadProgress]);

  // Subscribe to store changes and save
  useEffect(() => {
    if (!user?.id || !isInitialized.current) return;
    
    const unsubscribe = useGemFusionStore.subscribe((state, prevState) => {
      // Only save if meaningful data changed
      if (
        state.stars !== prevState.stars ||
        state.currentLevel !== prevState.currentLevel ||
        state.lives !== prevState.lives ||
        state.coins !== prevState.coins ||
        state.levelProgress.length !== prevState.levelProgress.length ||
        state.dailyStreak !== prevState.dailyStreak ||
        JSON.stringify(state.boosters) !== JSON.stringify(prevState.boosters)
      ) {
        debouncedSave();
      }
    });
    
    return () => unsubscribe();
  }, [user?.id, debouncedSave]);

  return {
    isInitialized: isInitialized.current,
    syncNow: saveProgress,
  };
};
