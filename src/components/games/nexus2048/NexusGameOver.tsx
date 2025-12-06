import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trophy, RotateCcw, Share2, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

interface NexusGameOverProps {
  isVisible: boolean;
  isWin: boolean;
  score: number;
  highScore: number;
  highestTile: number;
  onRestart: () => void;
  onShare: () => void;
}

export const NexusGameOver = ({
  isVisible,
  isWin,
  score,
  highScore,
  highestTile,
  onRestart,
  onShare
}: NexusGameOverProps) => {
  useEffect(() => {
    if (isVisible && isWin) {
      // Epic win celebration
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const colors = ['#00FFFF', '#FF00FF', '#FFD700', '#00FF00', '#FF1493'];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isVisible, isWin]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="text-center p-8 rounded-3xl max-w-sm mx-4"
            style={{
              background: isWin 
                ? 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,140,0,0.2) 100%)'
                : 'linear-gradient(135deg, rgba(100,100,100,0.3) 0%, rgba(50,50,50,0.2) 100%)',
              border: `2px solid ${isWin ? 'rgba(255,215,0,0.5)' : 'rgba(100,100,100,0.5)'}`,
              boxShadow: isWin 
                ? '0 0 60px rgba(255,215,0,0.4), 0 0 120px rgba(255,140,0,0.2)'
                : '0 0 30px rgba(100,100,100,0.3)'
            }}
          >
            {/* Icon */}
            <motion.div
              animate={{ 
                rotate: isWin ? [0, -10, 10, -10, 10, 0] : 0,
                scale: isWin ? [1, 1.1, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: isWin ? Infinity : 0, repeatDelay: 2 }}
              className="mb-4"
            >
              {isWin ? (
                <div className="relative inline-block">
                  <Trophy className="w-20 h-20 text-yellow-400 mx-auto" />
                  <Sparkles className="w-8 h-8 text-yellow-300 absolute -top-2 -right-2 animate-pulse" />
                </div>
              ) : (
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-600/50 flex items-center justify-center">
                  <span className="text-4xl">😢</span>
                </div>
              )}
            </motion.div>

            {/* Title */}
            <h2 
              className="text-3xl sm:text-4xl font-bold mb-2 font-orbitron"
              style={{
                background: isWin 
                  ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                  : 'linear-gradient(135deg, #888 0%, #666 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {isWin ? 'NEXUS ACHIEVED!' : 'GAME OVER'}
            </h2>

            {/* Stats */}
            <div className="space-y-3 my-6">
              <div className="flex justify-between items-center px-4 py-2 rounded-lg"
                style={{ background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)' }}
              >
                <span className="text-cyan-300/80">Final Score</span>
                <span className="text-xl font-bold text-cyan-300 font-orbitron">{score.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center px-4 py-2 rounded-lg"
                style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)' }}
              >
                <span className="text-yellow-300/80">High Score</span>
                <span className="text-xl font-bold text-yellow-300 font-orbitron">{highScore.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center px-4 py-2 rounded-lg"
                style={{ background: 'rgba(255,0,255,0.1)', border: '1px solid rgba(255,0,255,0.3)' }}
              >
                <span className="text-pink-300/80">Highest Tile</span>
                <span className="text-xl font-bold text-pink-300 font-orbitron">{highestTile}</span>
              </div>

              {score >= highScore && score > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center justify-center gap-2 py-2"
                >
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 font-bold">NEW HIGH SCORE!</span>
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </motion.div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onRestart}
                  size="lg"
                  className="px-6 py-3 rounded-xl font-orbitron"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,255,0,0.4) 0%, rgba(0,200,100,0.4) 100%)',
                    border: '2px solid rgba(0,255,0,0.6)',
                    boxShadow: '0 0 25px rgba(0,255,0,0.4)',
                  }}
                >
                  <RotateCcw className="w-5 h-5 mr-2 text-green-300" />
                  <span className="text-green-300">Play Again</span>
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={onShare}
                  size="lg"
                  className="px-6 py-3 rounded-xl font-orbitron"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,255,255,0.4) 0%, rgba(0,191,255,0.4) 100%)',
                    border: '2px solid rgba(0,255,255,0.6)',
                    boxShadow: '0 0 25px rgba(0,255,255,0.4)',
                  }}
                >
                  <Share2 className="w-5 h-5 mr-2 text-cyan-300" />
                  <span className="text-cyan-300">Share</span>
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
