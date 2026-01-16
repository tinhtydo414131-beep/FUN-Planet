// Fun Planet Theme Constants for Gem Fusion Quest
// Sky blue to rose gold gradient with golden accents

export const FUN_PLANET_COLORS = {
  // Background gradients (hex for Phaser)
  bgGradient: {
    top1: 0x87CEEB,    // Sky blue
    top2: 0xADD8E6,    // Light blue
    bottom1: 0xF8E8DC, // Rose cream
    bottom2: 0xE8B4B8, // Rose gold
  },
  
  // Grid cell colors
  cell: {
    even: 0xFFFFFF,    // White
    odd: 0xFFF8E7,     // Cream
    border: 0xFFD700,  // Gold
    shadow: 0xE8B4B8,  // Rose shadow
  },
  
  // HUD colors
  hud: {
    text: '#FFFFFF',
    textShadow: '#000000',
    score: '#FFD700',      // Gold
    moves: '#FFFFFF',
    movesLow: '#FF6B6B',   // Red when low
    movesWarn: '#FFD93D',  // Yellow warning
    label: '#87CEEB',      // Sky blue
  },
  
  // Button colors
  button: {
    primary: 0x2ECC71,     // Green
    secondary: 0xF1C40F,   // Gold
    danger: 0xE74C3C,      // Red
    purple: 0x9B59B6,      // Purple
    pink: 0xFF6B9D,        // Pink
  },
  
  // Gem glow colors (for selection/match effects)
  gemGlow: {
    red: 0xFF6B6B,
    yellow: 0xFFD93D,
    green: 0x6BCB77,
    blue: 0x4D96FF,
    purple: 0x9B59B6,
    orange: 0xFF8C42,
  },
};

// Gem styles with custom colors
export const GEM_VISUAL_STYLES = [
  { id: 'red', emoji: '❤️', color: '#FF6B6B', glow: '#FF9999' },
  { id: 'yellow', emoji: '⭐', color: '#FFD93D', glow: '#FFE566' },
  { id: 'green', emoji: '💚', color: '#6BCB77', glow: '#8FD99A' },
  { id: 'blue', emoji: '💎', color: '#4D96FF', glow: '#80B3FF' },
  { id: 'purple', emoji: '💜', color: '#9B59B6', glow: '#B380C9' },
  { id: 'orange', emoji: '🧡', color: '#FF8C42', glow: '#FFB380' },
];

// Animation constants
export const ANIMATION_DURATIONS = {
  gemSwap: 150,
  gemDestroy: 200,
  gemDrop: 300,
  gemBounce: 350,
  buttonPress: 50,
  screenTransition: 300,
};

// Level completion rewards (CAMLY coins)
export const LEVEL_REWARDS = {
  star1: 1000,
  star2: 2000,
  star3: 5000,
  firstClear: 500,    // Bonus for first-time completion
};

// Daily reward scaling
export const DAILY_REWARDS = {
  baseCoins: 50,
  streakBonus: 25,    // Per day streak
  boosterAtDay: 3,    // Get booster at this streak
};
