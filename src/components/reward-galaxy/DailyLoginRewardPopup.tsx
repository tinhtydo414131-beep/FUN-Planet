import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Star, Sparkles, Gift, Check, CalendarHeart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

interface DailyLoginRewardPopupProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}

export function DailyLoginRewardPopup({ isOpen, amount, onClose }: DailyLoginRewardPopupProps) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Play celebration sound
      audioRef.current = new Audio('/sounds/coin-collect.mp3');
      audioRef.current.play().catch(() => {});
      
      // Trigger golden fireworks celebration
      setShowCelebration(true);
      
      // Golden confetti burst
      const colors = ['#FFD700', '#FFEC8B', '#FFA500', '#FFB347', '#FFDAB9'];
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
      });
      
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });
      }, 250);
    }
  }, [isOpen]);

  const handleReceivedToday = () => {
    onClose();
  };

  const handleViewRewards = () => {
    onClose();
    navigate('/reward-galaxy');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-lg border-0 overflow-hidden p-0"
        style={{
          background: 'linear-gradient(135deg, #87CEEB 0%, #FFDAB9 50%, #FFEC8B 100%)',
        }}
      >
        <DialogTitle className="sr-only">Daily Login Reward</DialogTitle>
        
        {/* Spreading yellow light animation on load */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-0"
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,236,139,0.4) 40%, transparent 70%)',
                borderRadius: '50%',
              }}
            />
          )}
        </AnimatePresence>

        {/* Sparkling gold stars and pastel planets background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Falling gold stars */}
          {[...Array(25)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute"
              initial={{ 
                top: -20, 
                left: `${Math.random() * 100}%`,
                opacity: 0,
                scale: 0.5 + Math.random() * 0.5
              }}
              animate={{ 
                top: '120%',
                opacity: [0, 1, 1, 0],
                rotate: 360,
              }}
              transition={{ 
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              <Star 
                className="w-4 h-4 drop-shadow-lg" 
                style={{ 
                  color: '#FFD700',
                  fill: '#FFD700',
                  filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.8))'
                }}
              />
            </motion.div>
          ))}
          
          {/* Pastel floating planets */}
          <motion.div
            className="absolute top-8 left-8 w-10 h-10 rounded-full"
            style={{ background: 'linear-gradient(135deg, #FFB6C1, #FFC0CB)' }}
            animate={{ y: [-5, 5, -5], rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-20 right-6 w-8 h-8 rounded-full"
            style={{ background: 'linear-gradient(135deg, #DDA0DD, #E6E6FA)' }}
            animate={{ y: [5, -5, 5], rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-20 right-10 w-6 h-6 rounded-full"
            style={{ background: 'linear-gradient(135deg, #98FB98, #90EE90)' }}
            animate={{ x: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Main glassmorphism card */}
        <div className="relative z-10 m-3">
          {/* Gold gradient border glow */}
          <div 
            className="absolute -inset-1 rounded-3xl opacity-80"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFEC8B, #FFD700, #FFA500, #FFD700)',
              filter: 'blur(8px)',
            }}
          />
          <div 
            className="absolute -inset-0.5 rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFEC8B, #FFD700)',
            }}
          />
          
          {/* Glass card content */}
          <div 
            className="relative rounded-3xl p-8"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(15px)',
              WebkitBackdropFilter: 'blur(15px)',
            }}
          >
            {/* Sparkle decorations */}
            <motion.div
              className="absolute top-4 left-4"
              animate={{ scale: [0.8, 1.2, 0.8], rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5" style={{ color: '#FFD700', filter: 'drop-shadow(0 0 4px #FFD700)' }} />
            </motion.div>
            <motion.div
              className="absolute top-6 right-6"
              animate={{ scale: [1, 0.8, 1], rotate: [360, 180, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              <Sparkles className="w-4 h-4" style={{ color: '#FFA500', filter: 'drop-shadow(0 0 4px #FFA500)' }} />
            </motion.div>

            {/* Large 3D gold glow calendar icon */}
            <motion.div
              className="mx-auto mb-6 relative w-28 h-28"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              {/* Outer glow */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,215,0,0.6) 0%, rgba(255,236,139,0.3) 50%, transparent 70%)',
                  filter: 'blur(15px)',
                  transform: 'scale(1.5)',
                }}
              />
              
              {/* Main icon container */}
              <motion.div 
                className="relative w-full h-full rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFEC8B 30%, #FFD700 50%, #FFA500 70%, #FFD700 100%)',
                  boxShadow: '0 10px 40px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.3), inset 0 2px 20px rgba(255,255,255,0.4)',
                }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Gift 
                  className="w-14 h-14 text-white drop-shadow-lg" 
                  strokeWidth={2.5}
                />
              </motion.div>
              
              {/* Orbiting sparkle */}
              <motion.div
                className="absolute -top-1 -right-1"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: '50% 100%' }}
              >
                <Star className="w-7 h-7" style={{ color: '#FFD700', fill: '#FFD700', filter: 'drop-shadow(0 0 8px #FFD700)' }} />
              </motion.div>
            </motion.div>

            {/* Title with gold metallic shine */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-2"
            >
              <h2 
                className="text-3xl font-fredoka font-black mb-1"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #FFEC8B 75%, #FFD700 100%)',
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: '0 2px 10px rgba(255,215,0,0.3)',
                  animation: 'shimmer 3s ease-in-out infinite',
                }}
              >
                🎁 Daily Login 🎁
              </h2>
              <p 
                className="text-xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #DAA520, #FFD700, #DAA520)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Daily Login Reward
              </p>
            </motion.div>

            {/* Super large reward amount with gold gradient */}
            <motion.div
              className="rounded-2xl p-6 mb-5 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,236,139,0.2) 50%, rgba(255,215,0,0.15) 100%)',
                border: '2px solid rgba(255,215,0,0.4)',
                boxShadow: '0 4px 20px rgba(255,215,0,0.2), inset 0 0 20px rgba(255,215,0,0.1)',
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <motion.span 
                  className="text-6xl font-fredoka font-black"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 20%, #FFD700 40%, #FFEC8B 60%, #FFD700 80%, #FFA500 100%)',
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 4px 8px rgba(255,165,0,0.4))',
                    animation: 'shimmer 2s ease-in-out infinite',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  +{amount.toLocaleString()}
                </motion.span>
                <span 
                  className="text-4xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  CAMLY
                </span>
              </div>
              
              {/* Notification message */}
              <motion.p
                className="text-lg font-bold"
                style={{ color: '#B8860B' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                ✨ Con đã nhận được quà từ Cha Vũ Trụ! 🌟
              </motion.p>
              <p className="text-base mt-1" style={{ color: '#DAA520' }}>
                Little one has received a gift from Father Universe!
              </p>
            </motion.div>

            {/* Large clear description text */}
            <motion.p
              className="text-center mb-6 text-lg font-semibold px-2"
              style={{ color: '#8B7355' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Phần thưởng đã được thêm vào{' '}
              <span style={{ color: '#DAA520', fontWeight: 'bold' }}>Số Dư Chờ Nhận</span>{' '}
              của con!
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {/* Received Today - Mint green glow */}
              <Button
                onClick={handleReceivedToday}
                className="w-full font-fredoka font-bold text-lg py-6 rounded-2xl border-0 transform hover:scale-105 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #98FB98 0%, #90EE90 50%, #7CFC00 100%)',
                  color: '#228B22',
                  boxShadow: '0 4px 20px rgba(152,251,152,0.5), 0 0 30px rgba(144,238,144,0.3)',
                }}
              >
                <Check className="w-6 h-6 mr-2" strokeWidth={3} />
                ✅ Đã Nhận Hôm Nay!
              </Button>
              
              {/* Come Back Tomorrow - Pastel pink/purple */}
              <Button
                onClick={handleViewRewards}
                variant="outline"
                className="w-full font-fredoka font-bold text-lg py-6 rounded-2xl transform hover:scale-105 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FFB6C1 0%, #DDA0DD 50%, #E6E6FA 100%)',
                  color: '#8B008B',
                  border: '2px solid rgba(221,160,221,0.5)',
                  boxShadow: '0 4px 20px rgba(255,182,193,0.4)',
                }}
              >
                <CalendarHeart className="w-6 h-6 mr-2" />
                🗓️ Xem Thêm Phần Thưởng
              </Button>
            </motion.div>
          </div>
        </div>

        {/* CSS for shimmer animation */}
        <style>{`
          @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
