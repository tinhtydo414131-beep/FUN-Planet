// CAMLY Playtime Reward System Configuration
// 5D Light Economy - Rewards for VALUE, not grinding
// "Camly Coin = phần thưởng cho GIÁ TRỊ, KHÔNG cho THỜI GIAN"

export const PLAY_REWARDS = {
  // === VALUE-BASED REWARDS (Primary) ===
  NEW_GAME_BONUS: 5000,           // 5,000 CAMLY for first time playing each game
  MAX_NEW_GAME_BONUSES: 999,      // Unlimited new games (each game only once)
  GAME_COMPLETE_BONUS: 2000,      // 2,000 CAMLY for completing a game/level
  LEARNING_MILESTONE: 5000,       // 5,000 CAMLY for achieving learning milestones
  SHARING_BONUS: 1000,            // 1,000 CAMLY for sharing game with friends
  KINDNESS_ACTION: 500,           // 500 CAMLY for kind behaviors (AI detected)
  COOPERATION_BONUS: 1500,        // 1,500 CAMLY for cooperative play
  
  // === TIME-BASED REWARDS (DISABLED - value over time) ===
  CAMLY_PER_MINUTE: 0,            // DISABLED: No more time-based grinding rewards
  MIN_SESSION_SECONDS: 60,        // Minimum 60 seconds to earn rewards
  AFK_TIMEOUT_SECONDS: 120,       // 2 minutes without activity = AFK
  COOLDOWN_SECONDS: 60,           // 1 minute cooldown between reward claims
} as const;

// Behavior types for value-based rewards
export const BEHAVIOR_TYPES = {
  KINDNESS: 'kindness',           // Helping others, sharing
  SHARING: 'sharing',             // Sharing games/planets with friends
  COOPERATION: 'cooperation',     // Team building, group activities
  LEARNING: 'learning',           // Educational achievements
  GAME_COMPLETE: 'game_complete', // Completing games/levels
  MILESTONE: 'milestone',         // Major achievements
} as const;

export type BehaviorType = typeof BEHAVIOR_TYPES[keyof typeof BEHAVIOR_TYPES];

// Game category multipliers - Reward QUALITY over quantity
export const GAME_CATEGORY_MULTIPLIERS = {
  educational: 2.0,    // ×2 for educational games
  brain: 1.5,          // ×1.5 for brain training games
  puzzle: 1.2,         // ×1.2 for puzzle games
  kindness: 1.5,       // ×1.5 for kindness/sharing games
  creativity: 1.5,     // ×1.5 for creative games
  creative: 1.5,       // alias for creativity
  adventure: 1.0,      // ×1 for adventure games
  casual: 1.0,         // ×1 for casual games
  music: 1.0,          // ×1 for music games
  default: 1.0,        // ×1 for other games
} as const;

export type GameCategory = keyof typeof GAME_CATEGORY_MULTIPLIERS;

export const CREATOR_REWARDS = {
  UPLOAD_BONUS: 500000,         // 500,000 CAMLY when game is approved
  FIRST_PLAY_BONUS: 100,        // 100 CAMLY per new player
  ROYALTY_PER_MINUTE: 50,       // 50 CAMLY per minute players spend
  DAILY_CAP: 200000,            // Max 200,000 CAMLY per day
  MILESTONES: {
    100: 50000,                 // 50,000 CAMLY at 100 total plays
    500: 150000,                // 150,000 CAMLY at 500 total plays
    1000: 300000,               // 300,000 CAMLY at 1,000 total plays
  },
} as const;

// Age-based daily caps - adjusted for new CAMLY_PER_MINUTE rate
export const AGE_DAILY_CAPS = {
  '3-6': { maxMinutes: 30, maxCamly: 3000 },    // 30 min × 100 = 3,000 base
  '7-12': { maxMinutes: 60, maxCamly: 6000 },   // 60 min × 100 = 6,000 base
  '13-17': { maxMinutes: 90, maxCamly: 9000 },  // 90 min × 100 = 9,000 base
  '18+': { maxMinutes: 120, maxCamly: 15000 },  // 120 min × 100 + bonus = 15,000
} as const;

export type AgeGroup = keyof typeof AGE_DAILY_CAPS;

export const getAgeGroup = (age: number | null): AgeGroup => {
  if (!age || age >= 18) return '18+';
  if (age >= 13) return '13-17';
  if (age >= 7) return '7-12';
  return '3-6';
};

export const getDailyCap = (ageGroup: AgeGroup) => AGE_DAILY_CAPS[ageGroup];
