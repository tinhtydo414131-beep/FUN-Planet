// CAMLY Playtime Reward System Configuration
// Launch Phase - Attractive rewards for early adoption

export const PLAY_REWARDS = {
  NEW_GAME_BONUS: 10000,        // 10,000 CAMLY for first time playing each game
  MAX_NEW_GAME_BONUSES: 999,    // Unlimited new games (each game only once)
  CAMLY_PER_MINUTE: 500,        // 500 CAMLY per minute of play
  MIN_SESSION_SECONDS: 60,      // Minimum 60 seconds to earn rewards
  AFK_TIMEOUT_SECONDS: 120,     // 2 minutes without activity = AFK
  COOLDOWN_SECONDS: 60,         // 1 minute cooldown between reward claims
} as const;

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

export const AGE_DAILY_CAPS = {
  '3-6': { maxMinutes: 30, maxCamly: 15000 },
  '7-12': { maxMinutes: 60, maxCamly: 30000 },
  '13-17': { maxMinutes: 90, maxCamly: 45000 },
  '18+': { maxMinutes: 120, maxCamly: 60000 },
} as const;

export type AgeGroup = keyof typeof AGE_DAILY_CAPS;

export const getAgeGroup = (age: number | null): AgeGroup => {
  if (!age || age >= 18) return '18+';
  if (age >= 13) return '13-17';
  if (age >= 7) return '7-12';
  return '3-6';
};

export const getDailyCap = (ageGroup: AgeGroup) => AGE_DAILY_CAPS[ageGroup];
