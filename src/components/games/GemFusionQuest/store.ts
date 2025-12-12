import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LevelProgress {
  levelId: number;
  stars: number;
  highScore: number;
  completed: boolean;
}

export interface GemFusionState {
  // Player Stats
  lives: number;
  maxLives: number;
  stars: number;
  coins: number;
  
  // Progress
  currentLevel: number;
  currentWorld: number;
  levelProgress: LevelProgress[];
  unlockedWorlds: number[];
  
  // Boosters
  boosters: {
    hammer: number;
    extraMoves: number;
    rainbow: number;
    fishSwarm: number;
  };
  
  // Settings
  soundEnabled: boolean;
  musicEnabled: boolean;
  vibrationEnabled: boolean;
  
  // Daily Rewards
  lastDailyReward: number;
  dailyStreak: number;
  
  // Actions
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleVibration: () => void;
  
  useLife: () => boolean;
  addLives: (amount: number) => void;
  regenerateLife: () => void;
  
  addStars: (amount: number) => void;
  addCoins: (amount: number) => void;
  
  completeLevel: (levelId: number, starsEarned: number, score: number) => void;
  setCurrentLevel: (level: number) => void;
  setCurrentWorld: (world: number) => void;
  unlockWorld: (worldId: number) => void;
  
  useBooster: (type: keyof GemFusionState['boosters']) => boolean;
  addBooster: (type: keyof GemFusionState['boosters'], amount: number) => void;
  
  claimDailyReward: () => { coins: number; boosters: number } | null;
  
  resetProgress: () => void;
}

const initialState = {
  lives: 5,
  maxLives: 5,
  stars: 0,
  coins: 100,
  currentLevel: 1,
  currentWorld: 1,
  levelProgress: [],
  unlockedWorlds: [1],
  boosters: {
    hammer: 3,
    extraMoves: 2,
    rainbow: 1,
    fishSwarm: 2,
  },
  soundEnabled: true,
  musicEnabled: true,
  vibrationEnabled: true,
  lastDailyReward: 0,
  dailyStreak: 0,
};

export const useGemFusionStore = create<GemFusionState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleMusic: () => set((state) => ({ musicEnabled: !state.musicEnabled })),
      toggleVibration: () => set((state) => ({ vibrationEnabled: !state.vibrationEnabled })),
      
      useLife: () => {
        const state = get();
        if (state.lives > 0) {
          set({ lives: state.lives - 1 });
          return true;
        }
        return false;
      },
      
      addLives: (amount) => {
        set((state) => ({
          lives: Math.min(state.maxLives, state.lives + amount),
        }));
      },
      
      regenerateLife: () => {
        const state = get();
        if (state.lives < state.maxLives) {
          set({ lives: state.lives + 1 });
        }
      },
      
      addStars: (amount) => {
        set((state) => ({ stars: state.stars + amount }));
      },
      
      addCoins: (amount) => {
        set((state) => ({ coins: state.coins + amount }));
      },
      
      completeLevel: (levelId, starsEarned, score) => {
        set((state) => {
          const existing = state.levelProgress.find((l) => l.levelId === levelId);
          const newProgress = existing
            ? state.levelProgress.map((l) =>
                l.levelId === levelId
                  ? {
                      ...l,
                      stars: Math.max(l.stars, starsEarned),
                      highScore: Math.max(l.highScore, score),
                      completed: true,
                    }
                  : l
              )
            : [
                ...state.levelProgress,
                { levelId, stars: starsEarned, highScore: score, completed: true },
              ];
          
          // Check if new world should unlock
          const completedInCurrentWorld = newProgress.filter(
            (l) => l.levelId > (state.currentWorld - 1) * 15 && l.levelId <= state.currentWorld * 15
          ).length;
          
          const unlockedWorlds = [...state.unlockedWorlds];
          if (completedInCurrentWorld >= 10 && !unlockedWorlds.includes(state.currentWorld + 1)) {
            unlockedWorlds.push(state.currentWorld + 1);
          }
          
          return {
            levelProgress: newProgress,
            stars: state.stars + starsEarned,
            unlockedWorlds,
            currentLevel: Math.max(state.currentLevel, levelId + 1),
          };
        });
      },
      
      setCurrentLevel: (level) => set({ currentLevel: level }),
      setCurrentWorld: (world) => set({ currentWorld: world }),
      
      unlockWorld: (worldId) => {
        set((state) => ({
          unlockedWorlds: state.unlockedWorlds.includes(worldId)
            ? state.unlockedWorlds
            : [...state.unlockedWorlds, worldId],
        }));
      },
      
      useBooster: (type) => {
        const state = get();
        if (state.boosters[type] > 0) {
          set({
            boosters: {
              ...state.boosters,
              [type]: state.boosters[type] - 1,
            },
          });
          return true;
        }
        return false;
      },
      
      addBooster: (type, amount) => {
        set((state) => ({
          boosters: {
            ...state.boosters,
            [type]: state.boosters[type] + amount,
          },
        }));
      },
      
      claimDailyReward: () => {
        const state = get();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const lastClaim = state.lastDailyReward;
        
        if (now - lastClaim < oneDay) {
          return null;
        }
        
        const isConsecutive = now - lastClaim < oneDay * 2;
        const newStreak = isConsecutive ? state.dailyStreak + 1 : 1;
        
        const coinReward = 50 + (newStreak - 1) * 25;
        const boosterReward = newStreak >= 3 ? 1 : 0;
        
        set({
          lastDailyReward: now,
          dailyStreak: newStreak,
          coins: state.coins + coinReward,
          boosters: {
            ...state.boosters,
            hammer: state.boosters.hammer + boosterReward,
          },
        });
        
        return { coins: coinReward, boosters: boosterReward };
      },
      
      resetProgress: () => set(initialState),
    }),
    {
      name: 'gem-fusion-quest-save',
    }
  )
);
