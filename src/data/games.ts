import triviaQuizImg from '@/assets/games/trivia-quiz.jpg';

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
  // Brain & Educational Games
  {
    id: 'trivia-quiz',
    title: 'Trivia Quiz',
    description: 'Câu hỏi kiến thức tổng hợp',
    category: 'brain',
    difficulty: 'easy',
    image: triviaQuizImg,
    playable: true,
  },
];
