export interface Game {
  id: string;
  title: string;
  description: string;
  category: 'casual' | 'brain' | 'adventure';
  difficulty: 'easy' | 'medium' | 'hard';
  image: string;
  playable: boolean;
}

export const games: Game[] = [];
