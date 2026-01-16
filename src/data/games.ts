export interface Game {
  id: string;
  title: string;
  description: string;
  category: 'casual' | 'brain' | 'adventure';
  difficulty: 'easy' | 'medium' | 'hard';
  image: string;
  playable: boolean;
}

export const games: Game[] = [
  {
    id: 'gem-fusion-quest',
    title: 'Gem Fusion Quest',
    description: 'Ghép các viên đá quý để hoàn thành nhiệm vụ! Match 3+ gems để tạo combo và sử dụng special gems.',
    category: 'brain',
    difficulty: 'medium',
    image: '/assets/games/gem-fusion-quest-thumbnail.png',
    playable: true,
  }
];
