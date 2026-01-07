import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, ChefHat, Clock, Heart } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameAudio } from '@/hooks/useGameAudio';
import { AudioControls } from '@/components/AudioControls';
import { toast } from 'sonner';

interface Recipe {
  id: string;
  name: string;
  emoji: string;
  difficulty: number;
  steps: MiniGame[];
}

interface MiniGame {
  type: 'chop' | 'stir' | 'time' | 'temperature' | 'pour';
  instruction: string;
  target: number;
  tolerance: number;
}

const RECIPES: Recipe[] = [
  {
    id: 'salad',
    name: 'Fresh Salad',
    emoji: '🥗',
    difficulty: 1,
    steps: [
      { type: 'chop', instruction: 'Chop vegetables precisely!', target: 50, tolerance: 10 },
      { type: 'pour', instruction: 'Pour dressing carefully!', target: 75, tolerance: 15 },
    ]
  },
  {
    id: 'pasta',
    name: 'Pasta Delight',
    emoji: '🍝',
    difficulty: 2,
    steps: [
      { type: 'time', instruction: 'Boil water - wait for bubbles!', target: 100, tolerance: 5 },
      { type: 'stir', instruction: 'Stir pasta gently!', target: 60, tolerance: 12 },
      { type: 'temperature', instruction: 'Perfect heat for sauce!', target: 80, tolerance: 10 },
    ]
  },
  {
    id: 'cake',
    name: 'Birthday Cake',
    emoji: '🎂',
    difficulty: 3,
    steps: [
      { type: 'stir', instruction: 'Mix ingredients smoothly!', target: 70, tolerance: 8 },
      { type: 'pour', instruction: 'Pour batter evenly!', target: 85, tolerance: 10 },
      { type: 'temperature', instruction: 'Bake at perfect temp!', target: 90, tolerance: 8 },
      { type: 'time', instruction: 'Wait for golden brown!', target: 100, tolerance: 5 },
    ]
  },
  {
    id: 'sushi',
    name: 'Sushi Roll',
    emoji: '🍣',
    difficulty: 4,
    steps: [
      { type: 'chop', instruction: 'Slice fish precisely!', target: 45, tolerance: 5 },
      { type: 'pour', instruction: 'Add rice carefully!', target: 80, tolerance: 8 },
      { type: 'stir', instruction: 'Roll with precision!', target: 65, tolerance: 7 },
      { type: 'chop', instruction: 'Cut perfect pieces!', target: 55, tolerance: 6 },
    ]
  },
  {
    id: 'pizza',
    name: 'Gourmet Pizza',
    emoji: '🍕',
    difficulty: 5,
    steps: [
      { type: 'stir', instruction: 'Knead dough perfectly!', target: 75, tolerance: 10 },
      { type: 'pour', instruction: 'Spread sauce evenly!', target: 70, tolerance: 8 },
      { type: 'chop', instruction: 'Slice toppings finely!', target: 60, tolerance: 7 },
      { type: 'temperature', instruction: 'Perfect oven heat!', target: 95, tolerance: 5 },
      { type: 'time', instruction: 'Bake to perfection!', target: 100, tolerance: 3 },
    ]
  },
];

export function CookingMama() {
  const [stars, setStars] = useState(0);
  const [hearts, setHearts] = useState(3);
  const [currentRecipeIndex, setCurrentRecipeIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'success' | 'failed'>('menu');
  const [progress, setProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [reaction, setReaction] = useState('');
  
  const { playClick, playSuccess, playPop, playJump, playScore, startBackgroundMusic, stopBackgroundMusic, isMusicEnabled, isSoundEnabled, toggleMusic, toggleSound } = useGameAudio();

  useEffect(() => {
    // Không cần gọi startBackgroundMusic - đã có BackgroundMusicPlayer global
    const saved = localStorage.getItem('cookingMamaProgress');
    if (saved) {
      const data = JSON.parse(saved);
      setStars(data.stars || 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cookingMamaProgress', JSON.stringify({ stars }));
  }, [stars]);

  const currentRecipe = RECIPES[currentRecipeIndex];
  const currentStep = currentRecipe?.steps[currentStepIndex];

  const startRecipe = (index: number) => {
    playClick();
    setCurrentRecipeIndex(index);
    setCurrentStepIndex(0);
    setGameState('playing');
    setProgress(0);
    setIsActive(false);
    setReaction('');
  };

  const handleAction = () => {
    if (!isActive) {
      setIsActive(true);
      playPop();
      
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);

      return;
    }

    // Check if progress is within target range
    const isSuccess = Math.abs(progress - currentStep.target) <= currentStep.tolerance;
    
    if (isSuccess) {
      playSuccess();
      setReaction('Perfect! 🌟');
      
      setTimeout(() => {
        if (currentStepIndex < currentRecipe.steps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
          setProgress(0);
          setIsActive(false);
          setReaction('');
        } else {
          completeRecipe();
        }
      }, 1000);
    } else {
      playPop();
      setReaction('Try again! 💫');
      setHearts(prev => prev - 1);
      
      setTimeout(() => {
        if (hearts <= 1) {
          setGameState('failed');
        } else {
          setProgress(0);
          setIsActive(false);
          setReaction('');
        }
      }, 1000);
    }
  };

  const completeRecipe = () => {
    const earnedStars = currentRecipe.difficulty;
    setStars(prev => prev + earnedStars);
    setGameState('success');
    playScore();
    playJump();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    toast.success(`${currentRecipe.name} completed! +${earnedStars} ⭐`);
  };

  const resetGame = () => {
    playClick();
    setGameState('menu');
    setHearts(3);
    setCurrentStepIndex(0);
    setProgress(0);
    setIsActive(false);
    setReaction('');
  };

  const getMiniGameIcon = (type: string) => {
    switch (type) {
      case 'chop': return '🔪';
      case 'stir': return '🥄';
      case 'time': return '⏰';
      case 'temperature': return '🌡️';
      case 'pour': return '🥤';
      default: return '👨‍🍳';
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-orange-800">Cooking Mama</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/80 backdrop-blur rounded-full px-4 py-2 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current" />
                <span className="font-bold text-orange-800">{stars}</span>
              </div>
              <AudioControls 
                isMusicEnabled={isMusicEnabled}
                isSoundEnabled={isSoundEnabled}
                onToggleMusic={toggleMusic}
                onToggleSound={toggleSound}
              />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl mb-6">
            <h2 className="text-xl font-bold text-orange-700 mb-2">Welcome to Cooking Mama! 👩‍🍳</h2>
            <p className="text-gray-700">
              Master recipes with perfect timing and precision. Each mini-game tests your skills!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RECIPES.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white/90 backdrop-blur rounded-xl p-6 shadow-lg cursor-pointer"
                onClick={() => startRecipe(index)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-5xl">{recipe.emoji}</span>
                    <div>
                      <h3 className="font-bold text-lg text-orange-800">{recipe.name}</h3>
                      <div className="flex gap-1">
                        {[...Array(recipe.difficulty)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recipe.steps.map((step, i) => (
                    <span key={i} className="text-2xl">{getMiniGameIcon(step.type)}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-pink-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <Button onClick={resetGame} variant="outline">← Back</Button>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-6 h-6 ${i < hearts ? 'text-red-500 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
            <AudioControls 
              isMusicEnabled={isMusicEnabled}
              isSoundEnabled={isSoundEnabled}
              onToggleMusic={toggleMusic}
              onToggleSound={toggleSound}
            />
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-xl mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{currentRecipe.emoji}</span>
                <div>
                  <h2 className="text-xl font-bold text-orange-800">{currentRecipe.name}</h2>
                  <p className="text-sm text-gray-600">
                    Step {currentStepIndex + 1} of {currentRecipe.steps.length}
                  </p>
                </div>
              </div>
            </div>

            <Progress value={(currentStepIndex / currentRecipe.steps.length) * 100} className="mb-4" />
          </div>

          <motion.div
            key={currentStepIndex}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl text-center"
          >
            <div className="text-6xl mb-4">{getMiniGameIcon(currentStep.type)}</div>
            <h3 className="text-2xl font-bold text-orange-800 mb-4">{currentStep.instruction}</h3>

            <div className="mb-6">
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className="absolute h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute h-full w-1 bg-green-500"
                  style={{ left: `${currentStep.target}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">Stop at the green line!</p>
            </div>

            <Button
              onClick={handleAction}
              size="lg"
              className="w-full text-xl py-6"
              disabled={isActive && progress >= 100}
            >
              {!isActive ? '🎯 Start!' : '⏸️ Stop!'}
            </Button>

            <AnimatePresence>
              {reaction && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="mt-4 text-2xl font-bold text-orange-600"
                >
                  {reaction}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    );
  }

  if (gameState === 'success' || gameState === 'failed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-yellow-100 to-pink-100 p-4 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white/90 backdrop-blur rounded-2xl p-8 shadow-xl text-center max-w-md"
        >
          {gameState === 'success' ? (
            <>
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-orange-800 mb-2">Perfect! 🎉</h2>
              <p className="text-xl mb-4">You cooked {currentRecipe.name}!</p>
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(currentRecipe.difficulty)].map((_, i) => (
                  <Star key={i} className="w-8 h-8 text-yellow-500 fill-current" />
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">😢</div>
              <h2 className="text-2xl font-bold text-orange-800 mb-2">Don't Give Up!</h2>
              <p className="text-lg mb-6">Practice makes perfect, Mama!</p>
            </>
          )}
          <Button onClick={resetGame} size="lg" className="w-full">
            Back to Menu
          </Button>
        </motion.div>
      </div>
    );
  }

  return null;
}