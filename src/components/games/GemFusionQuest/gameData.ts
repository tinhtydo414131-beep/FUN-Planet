// Gem Fusion Quest - Game Data

export const GEM_COLORS = [
  { id: 'ruby', name: 'Ruby', color: 0xe74c3c, emoji: '🔴' },
  { id: 'topaz', name: 'Topaz', color: 0xf1c40f, emoji: '🟡' },
  { id: 'emerald', name: 'Emerald', color: 0x2ecc71, emoji: '🟢' },
  { id: 'sapphire', name: 'Sapphire', color: 0x3498db, emoji: '🔵' },
  { id: 'amethyst', name: 'Amethyst', color: 0x9b59b6, emoji: '🟣' },
  { id: 'citrine', name: 'Citrine', color: 0xe67e22, emoji: '🟠' },
];

export const SPECIAL_GEMS = {
  LINE_H: { id: 'line_h', name: 'Horizontal Line', power: 'clear_row' },
  LINE_V: { id: 'line_v', name: 'Vertical Line', power: 'clear_column' },
  BURST: { id: 'burst', name: 'Burst Gem', power: 'explode_3x3' },
  RAINBOW: { id: 'rainbow', name: 'Rainbow Orb', power: 'clear_color' },
  FISH: { id: 'fish', name: 'Spark Fish', power: 'target_blocker' },
};

export const BLOCKER_TYPES = {
  CRYSTAL: { id: 'crystal', name: 'Crystal', layers: 1, clearable: true },
  ICE: { id: 'ice', name: 'Ice Block', layers: 2, clearable: true },
  LOCK: { id: 'lock', name: 'Lock', layers: 3, clearable: true },
  GLOOM: { id: 'gloom', name: 'Gloom', layers: 1, spreads: true },
  BOMB: { id: 'bomb', name: 'Bomb', countdown: 10, explodes: true },
};

export const WORLDS = [
  {
    id: 1,
    name: 'Crystal Meadows',
    description: 'A peaceful starting ground with sparkling gems',
    color: 0x7ed6df,
    bgEmoji: '🌸',
    unlockStars: 0,
    levels: 15,
  },
  {
    id: 2,
    name: 'Frost Peaks',
    description: 'Icy mountains with frozen challenges',
    color: 0x74b9ff,
    bgEmoji: '❄️',
    unlockStars: 30,
    levels: 15,
  },
  {
    id: 3,
    name: 'Bubble Isles',
    description: 'Underwater gems in bubbly waters',
    color: 0x81ecec,
    bgEmoji: '🫧',
    unlockStars: 75,
    levels: 15,
  },
  {
    id: 4,
    name: 'Sunset Canyon',
    description: 'Warm desert gems under golden skies',
    color: 0xfdcb6e,
    bgEmoji: '🌅',
    unlockStars: 135,
    levels: 15,
  },
  {
    id: 5,
    name: 'Mystic Forest',
    description: 'Enchanted woods full of magic',
    color: 0x00b894,
    bgEmoji: '🌲',
    unlockStars: 210,
    levels: 15,
  },
  {
    id: 6,
    name: 'Cloud Kingdom',
    description: 'Floating islands among fluffy clouds',
    color: 0xdfe6e9,
    bgEmoji: '☁️',
    unlockStars: 300,
    levels: 15,
  },
  {
    id: 7,
    name: 'Lava Depths',
    description: 'Hot volcanic gems deep underground',
    color: 0xd63031,
    bgEmoji: '🌋',
    unlockStars: 405,
    levels: 15,
  },
  {
    id: 8,
    name: 'Starlight Valley',
    description: 'Cosmic gems from distant galaxies',
    color: 0x6c5ce7,
    bgEmoji: '⭐',
    unlockStars: 525,
    levels: 15,
  },
  {
    id: 9,
    name: 'Rainbow Bridge',
    description: 'Colorful realm of pure gem magic',
    color: 0xfd79a8,
    bgEmoji: '🌈',
    unlockStars: 660,
    levels: 15,
  },
  {
    id: 10,
    name: 'Eternal Palace',
    description: 'The final challenge for true Gem Masters',
    color: 0xffeaa7,
    bgEmoji: '👑',
    unlockStars: 810,
    levels: 15,
  },
];

export type LevelObjective = 
  | { type: 'score'; target: number }
  | { type: 'collect'; gemId: string; amount: number }
  | { type: 'clear_crystals'; amount: number }
  | { type: 'drop_treasures'; amount: number }
  | { type: 'clear_blockers'; blockerType: string; amount: number };

export interface LevelConfig {
  id: number;
  worldId: number;
  gridWidth: number;
  gridHeight: number;
  moves: number;
  objectives: LevelObjective[];
  starThresholds: [number, number, number];
  gemTypes: number; // How many gem colors to use (3-6)
  blockers?: {
    type: string;
    positions?: [number, number][];
    count?: number;
  }[];
  spawners?: [number, number][];
  holes?: [number, number][];
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
}

// Generate 100 levels
export const LEVELS: LevelConfig[] = [];

for (let i = 1; i <= 150; i++) {
  const worldId = Math.ceil(i / 15);
  const levelInWorld = ((i - 1) % 15) + 1;
  
  // Difficulty scales with level
  const baseDifficulty = Math.floor(i / 25);
  const difficulty: 'easy' | 'medium' | 'hard' | 'epic' = 
    baseDifficulty === 0 ? 'easy' : 
    baseDifficulty === 1 ? 'medium' : 
    baseDifficulty === 2 ? 'hard' : 'epic';
  
  // Grid size varies
  const gridWidth = 7;
  const gridHeight = i < 10 ? 6 : i < 30 ? 7 : 8;
  
  // Moves based on difficulty
  const baseMoves = 30 - baseDifficulty * 3;
  const moves = Math.max(20, baseMoves + Math.floor(Math.random() * 10));
  
  // Gem types increase with level
  const gemTypes = Math.min(6, 4 + Math.floor(i / 30));
  
  // Generate objectives
  const objectiveTypes = ['score', 'collect', 'clear_crystals', 'drop_treasures'];
  const numObjectives = i < 20 ? 1 : i < 50 ? Math.random() > 0.5 ? 2 : 1 : 2;
  
  const objectives: LevelObjective[] = [];
  
  // Always have a score objective
  const baseScore = 5000 + i * 500 + baseDifficulty * 2000;
  objectives.push({ type: 'score', target: baseScore });
  
  // Add secondary objectives based on level
  if (numObjectives > 1 || i % 3 === 0) {
    const randomType = objectiveTypes[Math.floor(Math.random() * objectiveTypes.length)];
    if (randomType === 'collect') {
      const gemId = GEM_COLORS[Math.floor(Math.random() * gemTypes)].id;
      objectives.push({ type: 'collect', gemId, amount: 20 + i * 2 });
    } else if (randomType === 'clear_crystals') {
      objectives.push({ type: 'clear_crystals', amount: 10 + Math.floor(i / 5) });
    } else if (randomType === 'drop_treasures') {
      objectives.push({ type: 'drop_treasures', amount: 5 + Math.floor(i / 10) });
    }
  }
  
  // Star thresholds
  const star1 = Math.floor(baseScore * 0.7);
  const star2 = baseScore;
  const star3 = Math.floor(baseScore * 1.5);
  
  // Blockers appear after level 5
  const blockers: LevelConfig['blockers'] = [];
  if (i > 5) {
    if (i > 10) {
      blockers.push({ type: 'crystal', count: Math.min(20, 5 + Math.floor(i / 5)) });
    }
    if (i > 25) {
      blockers.push({ type: 'ice', count: Math.min(10, Math.floor(i / 10)) });
    }
    if (i > 40) {
      blockers.push({ type: 'lock', count: Math.min(8, Math.floor(i / 15)) });
    }
    if (i > 60) {
      blockers.push({ type: 'gloom', count: Math.min(5, Math.floor((i - 60) / 10)) });
    }
  }
  
  // Holes in grid for harder levels
  const holes: [number, number][] = [];
  if (i > 30 && i % 5 === 0) {
    const numHoles = Math.min(4, Math.floor((i - 30) / 15));
    for (let h = 0; h < numHoles; h++) {
      holes.push([
        Math.floor(Math.random() * gridWidth),
        Math.floor(Math.random() * gridHeight),
      ]);
    }
  }
  
  LEVELS.push({
    id: i,
    worldId,
    gridWidth,
    gridHeight,
    moves,
    objectives,
    starThresholds: [star1, star2, star3],
    gemTypes,
    blockers: blockers.length > 0 ? blockers : undefined,
    holes: holes.length > 0 ? holes : undefined,
    difficulty,
  });
}

export const CHARACTERS = {
  KIRA: {
    name: 'Kira',
    role: 'Crystal Explorer',
    emoji: '👧',
    color: 0xff6b9d,
  },
  GEO: {
    name: 'Geo',
    role: 'Wise Elder',
    emoji: '🧙',
    color: 0x7d5fff,
  },
  LUNA: {
    name: 'Luna',
    role: 'Cloud Fox Companion',
    emoji: '🦊',
    color: 0x81ecec,
  },
  SHADOW_IMP: {
    name: 'Shadow Imp',
    role: 'Mischievous Villain',
    emoji: '👿',
    color: 0x2d3436,
  },
};

export const DIALOGUES = {
  INTRO: [
    { character: 'GEO', text: "Welcome, young explorer! The Gem Worlds need your help." },
    { character: 'KIRA', text: "I'm ready, Master Geo! What do I need to do?" },
    { character: 'GEO', text: "Match gems to restore the shine to our fractured realms." },
    { character: 'LUNA', text: "Yip! I'll guide you through the worlds!" },
  ],
  WORLD_1_START: [
    { character: 'KIRA', text: "Crystal Meadows! It's so beautiful!" },
    { character: 'LUNA', text: "Watch out for crystal blockers. Match gems nearby to clear them!" },
  ],
  FIRST_SPECIAL: [
    { character: 'GEO', text: "Excellent! You created a Line Gem!" },
    { character: 'GEO', text: "Match 4 in a row to create special gems with powerful effects." },
  ],
};

export const BOOSTERS = {
  HAMMER: {
    id: 'hammer',
    name: 'Tap Hammer',
    description: 'Smash any single gem',
    icon: '🔨',
    cost: 50,
  },
  EXTRA_MOVES: {
    id: 'extraMoves',
    name: 'Extra Swaps',
    description: '+5 extra moves',
    icon: '➕',
    cost: 100,
  },
  RAINBOW: {
    id: 'rainbow',
    name: 'Rainbow Start',
    description: 'Start with a Rainbow Orb',
    icon: '🌈',
    cost: 150,
  },
  FISH_SWARM: {
    id: 'fishSwarm',
    name: 'Fish Swarm',
    description: '5 fish target blockers',
    icon: '🐟',
    cost: 120,
  },
};
