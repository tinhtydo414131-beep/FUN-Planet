import colorMatchImg from '@/assets/games/color-match.jpg';
import guessNumberImg from '@/assets/games/guess-number.jpg';
import mathQuizImg from '@/assets/games/math-quiz.jpg';
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
  // Casual & Happy Games
  {
    id: 'color-match',
    title: 'Color Match',
    description: 'Khớp màu sắc nhanh nhất có thể',
    category: 'casual',
    difficulty: 'easy',
    image: colorMatchImg,
    playable: true,
  },
  
  // Brain & Educational Games
  {
    id: 'guess-number',
    title: 'Guess The Number',
    description: 'Đoán số bí mật',
    category: 'brain',
    difficulty: 'easy',
    image: guessNumberImg,
    playable: true,
  },
  {
    id: 'math-quiz',
    title: 'Math Quiz',
    description: 'Trắc nghiệm toán học vui vẻ',
    category: 'brain',
    difficulty: 'medium',
    image: mathQuizImg,
    playable: true,
  },
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
