import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface CelebrationNotificationProps {
  amount: number;
  token: string;
  onComplete?: () => void;
  duration?: number; // Optional duration in milliseconds (default: 25000)
}

export const CelebrationNotification = ({ amount, token, onComplete, duration: customDuration }: CelebrationNotificationProps) => {
  const [show, setShow] = useState(true);
  const [showBadge, setShowBadge] = useState(false);
  
  // Use custom duration or default to 25000ms
  const celebrationDuration = customDuration || 25000;
  const badgeDuration = celebrationDuration * 2;

  useEffect(() => {
    // Vibration
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    // Voice announcement "FUN AND RICH!!!"
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("FUN AND RICH!!!");
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      utterance.volume = 1;
      utterance.lang = 'vi-VN'; // Prefer Vietnamese if available
      speechSynthesis.speak(utterance);
    }

    // Play victory sound (using Web Audio API for synthetic sound)
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Jackpot sound
    const playJackpotSound = () => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };

    playJackpotSound();
    setTimeout(playJackpotSound, 200);
    setTimeout(playJackpotSound, 400);

    // Continuous confetti with custom duration
    const duration = celebrationDuration;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const confettiInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(confettiInterval);
        return;
      }

      const particleCount = 50;
      
      // Golden cosmic confetti with glow
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        },
        colors: ['#FFD700', '#FFA500', '#FFFF00', '#C0C0C0', '#8B00FF', '#00D4FF'],
        scalar: 1.5,
        gravity: 0.8
      });

      // Neon cosmic sparkles
      confetti({
        particleCount: 30,
        startVelocity: 25,
        spread: 360,
        origin: {
          x: randomInRange(0.1, 0.9),
          y: Math.random() - 0.2
        },
        shapes: ['circle', 'square'],
        colors: ['#FFFFFF', '#00D4FF', '#8B00FF', '#FFD700', '#FF00FF']
      });
    }, 200);

    // Fireworks
    const fireworksInterval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(fireworksInterval);
        return;
      }

      confetti({
        particleCount: 120,
        startVelocity: 45,
        spread: 360,
        origin: {
          x: randomInRange(0.2, 0.8),
          y: randomInRange(0.3, 0.7)
        },
        colors: ['#FFD700', '#00FFFF', '#8B00FF', '#FF00FF', '#00FF00', '#FFA500'],
        scalar: 1.8,
        ticks: 300
      });
    }, 800);

    // Main celebration ends after custom duration
    const mainTimeout = setTimeout(() => {
      setShow(false);
      setShowBadge(true);
      clearInterval(confettiInterval);
      clearInterval(fireworksInterval);
    }, celebrationDuration);
 
    // Badge disappears after double the celebration duration
    const badgeTimeout = setTimeout(() => {
      setShowBadge(false);
      onComplete?.();
    }, badgeDuration);

    return () => {
      clearTimeout(mainTimeout);
      clearTimeout(badgeTimeout);
      clearInterval(confettiInterval);
      clearInterval(fireworksInterval);
    };
  }, [amount, token, onComplete, celebrationDuration, badgeDuration]);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #120038 0%, #8B00FF 50%, #00D4FF 100%)',
              backdropFilter: 'blur(16px)'
            }}
          >
            {/* Cosmic neon pulsing border */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 30px 5px rgba(139,0,255,0.6), 0 0 60px 10px rgba(0,212,255,0.4)',
                  '0 0 60px 15px rgba(139,0,255,0.9), 0 0 90px 20px rgba(0,212,255,0.7)',
                  '0 0 30px 5px rgba(139,0,255,0.6), 0 0 60px 10px rgba(0,212,255,0.4)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-4 border-8 rounded-3xl pointer-events-none"
              style={{
                borderImage: 'linear-gradient(45deg, #8B00FF, #00D4FF, #FFD700, #8B00FF) 1',
                background: 'linear-gradient(45deg, transparent 30%, rgba(139,0,255,0.2) 50%, transparent 70%)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 2s ease infinite'
              }}
            />

            {/* Screen shake effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                x: [0, -2, 2, -2, 2, 0],
                y: [0, -2, 2, -2, 2, 0]
              }}
              transition={{ duration: 0.5, repeat: 2 }}
            />

            {/* Shooting stars */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 50}%`,
                  boxShadow: '0 0 10px 2px rgba(255,255,255,0.8), 0 0 20px 4px rgba(0,212,255,0.6)'
                }}
                animate={{
                  x: [0, Math.random() * 400 - 200],
                  y: [0, Math.random() * 400],
                  opacity: [1, 0],
                  scale: [1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}

            {/* Nebula particles */}
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={`nebula-${i}`}
                className="absolute rounded-full"
                style={{
                  width: `${Math.random() * 8 + 2}px`,
                  height: `${Math.random() * 8 + 2}px`,
                  background: `radial-gradient(circle, ${['#8B00FF', '#00D4FF', '#FFD700'][i % 3]} 0%, transparent 70%)`,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  filter: 'blur(1px)'
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}

            <div className="text-center z-10">
              {/* Galaxy particles rotating around text */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={`galaxy-${i}`}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${['#FFD700', '#8B00FF', '#00D4FF'][i % 3]}, transparent)`,
                      left: '50%',
                      top: '50%',
                      transformOrigin: '0 0',
                      transform: `rotate(${i * 30}deg) translate(250px)`,
                      boxShadow: `0 0 20px ${['#FFD700', '#8B00FF', '#00D4FF'][i % 3]}`
                    }}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </motion.div>

              {/* Main text with 3D cosmic effect */}
              <motion.h1
                initial={{ scale: 0, rotate: -180, z: -100 }}
                animate={{ 
                  scale: [1, 1.15, 1, 1.08, 1],
                  rotate: 0,
                  z: 0
                }}
                transition={{ 
                  duration: 0.6,
                  scale: { repeat: Infinity, duration: 2 }
                }}
                className="text-9xl font-black mb-8 relative"
                style={{
                  background: 'linear-gradient(45deg, #FFD700 0%, #FFA500 25%, #00D4FF 50%, #8B00FF 75%, #FFD700 100%)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 40px rgba(255,215,0,0.9)) drop-shadow(0 0 80px rgba(139,0,255,0.7)) drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                  textShadow: '0 0 100px rgba(255,215,0,0.9), 0 0 60px rgba(0,212,255,0.8)',
                  animation: 'gradient-x 3s linear infinite',
                  transform: 'perspective(1000px) rotateX(5deg)',
                  letterSpacing: '0.05em'
                }}
              >
                FUN AND RICH!!!
              </motion.h1>

              {/* Amount with cosmic 3D effect */}
              <motion.div
                initial={{ scale: 0, y: 50, z: -100 }}
                animate={{ 
                  scale: [1, 1.12, 1],
                  y: 0,
                  z: 0
                }}
                transition={{ 
                  delay: 0.3,
                  scale: { repeat: Infinity, duration: 1.5 }
                }}
                className="flex items-center justify-center gap-4 text-8xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #00D4FF 50%, #8B00FF 100%)',
                  backgroundSize: '300% auto',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 10px 30px rgba(255,215,0,0.7)) drop-shadow(0 0 60px rgba(0,212,255,0.6))',
                  animation: 'gradient-x 2s linear infinite',
                  transform: 'perspective(1000px) rotateX(3deg)',
                  textShadow: '0 0 80px rgba(255,215,0,0.9)'
                }}
              >
                <span>+{amount}</span>
                <span className="text-6xl">{token}</span>
              </motion.div>

              {/* Cosmic particles explosion */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      width: `${Math.random() * 12 + 4}px`,
                      height: `${Math.random() * 12 + 4}px`,
                      background: `radial-gradient(circle, ${['#FFD700', '#00D4FF', '#8B00FF', '#FF00FF'][i % 4]}, transparent)`,
                      left: '50%',
                      top: '50%',
                      boxShadow: `0 0 30px ${['#FFD700', '#00D4FF', '#8B00FF', '#FF00FF'][i % 4]}`
                    }}
                    animate={{
                      x: [0, (Math.random() - 0.5) * 500],
                      y: [0, (Math.random() - 0.5) * 500],
                      scale: [1, 0],
                      opacity: [1, 0],
                      rotate: [0, Math.random() * 360]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      delay: i * 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </motion.div>
            </div>

            {/* Cosmic flash effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(0,212,255,0.3) 50%, transparent 100%)'
              }}
              animate={{
                opacity: [0, 0.4, 0],
                scale: [0.8, 1.2, 0.8]
              }}
              transition={{
                duration: 0.6,
                repeat: 6,
                repeatDelay: 0.4
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating badge */}
      <AnimatePresence>
        {showBadge && (
          <motion.div
            initial={{ scale: 0, x: 100 }}
            animate={{ scale: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed top-20 right-6 z-50 px-6 py-3 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              boxShadow: '0 10px 30px rgba(255,215,0,0.5), 0 0 60px rgba(255,215,0,0.3)',
            }}
          >
            <span className="text-2xl font-black text-white drop-shadow-lg">
              +{amount} {token}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </>
  );
};
