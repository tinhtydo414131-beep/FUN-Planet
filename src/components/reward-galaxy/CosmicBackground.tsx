import { motion } from 'framer-motion';
import camlyCoin from '@/assets/camly-coin.png';

export const CosmicBackground = () => {
  // Generate random coin positions and animations
  const flyingCoins = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    size: 35 + Math.random() * 35,
    duration: 10 + Math.random() * 8,
    delay: Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - Deep cosmic purple/indigo/violet */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-950 via-indigo-900 to-violet-900" />
      
      {/* Radial center glow - warm golden center */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255,200,100,0.15) 0%, rgba(168,85,247,0.1) 30%, transparent 70%)',
        }}
      />
      
      {/* Nebula clouds for depth */}
      <div className="absolute inset-0 opacity-40">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[180px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-500/25 rounded-full blur-[160px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.3, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-400/20 rounded-full blur-[140px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-0 right-1/3 w-[350px] h-[350px] bg-cyan-400/15 rounded-full blur-[120px]"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Twinkling stars with trails */}
      {[...Array(120)].map((_, i) => {
        const size = 1 + Math.random() * 3;
        const isGold = i % 4 === 0;
        const isPink = i % 5 === 0;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: isGold 
                ? '#FFD700' 
                : isPink 
                ? '#FF69B4' 
                : '#FFFFFF',
              boxShadow: isGold 
                ? `0 0 ${size * 4}px #FFD700, 0 0 ${size * 8}px #FFD700` 
                : isPink
                ? `0 0 ${size * 3}px #FF69B4`
                : `0 0 ${size * 2}px rgba(255,255,255,0.8)`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.8, 1],
            }}
            transition={{
              duration: 1 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        );
      })}
      
      {/* Flying Camly Coins with enhanced glow */}
      {flyingCoins.map((coin) => (
        <motion.div
          key={`coin-${coin.id}`}
          className="absolute"
          style={{
            left: `${coin.initialX}%`,
            top: `${coin.initialY}%`,
            width: coin.size,
            height: coin.size,
          }}
          animate={{
            x: [0, 120, -60, 100, 0],
            y: [0, -100, 60, -120, 0],
            rotate: [0, 360, 720, 1080, 1440],
            scale: [1, 1.15, 0.9, 1.2, 1],
          }}
          transition={{
            duration: coin.duration,
            repeat: Infinity,
            delay: coin.delay,
            ease: "easeInOut",
          }}
        >
          <motion.img
            src={camlyCoin}
            alt="Camly Coin"
            className="w-full h-full object-contain"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.9)) drop-shadow(0 0 40px rgba(255,215,0,0.5))',
            }}
            animate={{
              filter: [
                'drop-shadow(0 0 20px rgba(255,215,0,0.9)) drop-shadow(0 0 40px rgba(255,215,0,0.5))',
                'drop-shadow(0 0 35px rgba(255,215,0,1)) drop-shadow(0 0 60px rgba(255,215,0,0.7))',
                'drop-shadow(0 0 20px rgba(255,215,0,0.9)) drop-shadow(0 0 40px rgba(255,215,0,0.5))',
              ],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}
      
      {/* Enhanced meteors with long sparkle trails */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`meteor-${i}`}
          className="absolute"
          style={{
            left: `${5 + i * 18}%`,
            top: '-8%',
          }}
          animate={{
            x: ['0%', '60%'],
            y: ['0vh', '120vh'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 6 + i * 0.8,
            repeat: Infinity,
            delay: i * 4,
            ease: "linear",
          }}
        >
          {/* Meteor head - brighter */}
          <div 
            className="w-4 h-4 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #FFFFFF, #FFD700, #FFA500)',
              boxShadow: '0 0 20px #FFD700, 0 0 40px #FFAA00, 0 0 60px #FF8800',
            }}
          />
          {/* Long sparkle tail */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-32 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, #FFD700, #FFA500 30%, transparent)',
              filter: 'blur(2px)',
            }}
          />
          {/* Sparkle particles along trail */}
          {[...Array(6)].map((_, j) => (
            <motion.div
              key={j}
              className="absolute rounded-full"
              style={{
                left: `${-2 + Math.random() * 4}px`,
                top: `${10 + j * 15}px`,
                width: `${2 + Math.random() * 2}px`,
                height: `${2 + Math.random() * 2}px`,
                background: '#FFD700',
                boxShadow: '0 0 8px #FFD700',
              }}
              animate={{
                opacity: [1, 0],
                scale: [1, 0.5],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: j * 0.1,
              }}
            />
          ))}
        </motion.div>
      ))}
      
      {/* Decorative planets */}
      {/* Planet 1 - Bottom right - Purple/Gold */}
      <motion.div
        className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #E9D5FF, #A855F7, #7E22CE)',
          boxShadow: '0 0 80px rgba(168, 85, 247, 0.5), inset 0 -30px 60px rgba(126, 34, 206, 0.6)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
      >
        {/* Planet ring */}
        <div 
          className="absolute inset-[-20px] rounded-full border-4 border-amber-400/50"
          style={{ 
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
          }}
        />
      </motion.div>
      
      {/* Planet 2 - Top left - Pink/Cyan smaller */}
      <motion.div
        className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-40"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FBCFE8, #EC4899, #BE185D)',
          boxShadow: '0 0 50px rgba(236, 72, 153, 0.4)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Ambient light rays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-8">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`ray-${i}`}
            className="absolute top-0 left-1/2 w-3 origin-top"
            style={{
              height: '100vh',
              background: i % 3 === 0 
                ? 'linear-gradient(to bottom, rgba(255,215,0,0.3), transparent 60%)' 
                : i % 3 === 1
                ? 'linear-gradient(to bottom, rgba(168,85,247,0.2), transparent 60%)'
                : 'linear-gradient(to bottom, rgba(236,72,153,0.2), transparent 60%)',
              transform: `rotate(${i * 45}deg) translateX(-50%)`,
              filter: 'blur(12px)',
            }}
            animate={{
              opacity: [0.08, 0.2, 0.08],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
      
      {/* Subtle vignette overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(15,5,30,0.4) 100%)',
        }}
      />
    </div>
  );
};
