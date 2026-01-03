import { create } from 'zustand';

interface GameCompleteState {
  isOpen: boolean;
  score: number;
  gameName: string;
  bonusAmount: number;
  showPopup: (data: { score?: number; gameName?: string; bonusAmount?: number }) => void;
  hidePopup: () => void;
}

// NOTE: This popup is now used for first-play bonus only
// Level completion no longer awards 10,000 CAMLY
// Rewards are based on: first play (10,000 CAMLY) + playtime (500 CAMLY/min)
export const useGameCompletePopup = create<GameCompleteState>((set) => ({
  isOpen: false,
  score: 0,
  gameName: '',
  bonusAmount: 10000,
  showPopup: ({ score = 0, gameName = 'the game', bonusAmount = 10000 }) => {
    set({ isOpen: true, score, gameName, bonusAmount });
  },
  hidePopup: () => {
    set({ isOpen: false, score: 0, gameName: '', bonusAmount: 10000 });
  },
}));
