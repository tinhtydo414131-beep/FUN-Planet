import { motion } from 'framer-motion';
import camlyCoin from '@/assets/camly-coin.png';

export const CosmicBackground = () => {
  // Generate random coin positions and animations
  const flyingCoins = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    initialX: Math.random() * 100,
    initialY: Math.random() * 100,
    size: 40 + Math.random() * 40,
    duration: 8 + Math.random() * 6,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - Purple to Pink to Orange (matching reference) */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900 via-purple-700 to-pink-500" />
      
      {/* Secondary gradient overlay for orange tint */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-600/30 to-orange-400/40" />
      
      {/* Strong glassmorphism blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[8px] bg-black/10" />
      
      {/* Purple/Pink ambient glow */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-500 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-orange-400 rounded-full blur-[100px]" />
      </div>
      
      {/* Sparkling white/gold star particles */}
      {[...Array(80)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${1 + Math.random() * 3}px`,
            height: `${1 + Math.random() * 3}px`,
            background: i % 3 === 0 
              ? '#FFD700' 
              : i % 3 === 1 
              ? '#FFFFFF' 
              : '#FFEC8B',
            boxShadow: i % 3 === 0 
              ? '0 0 8px #FFD700, 0 0 16px #FFD700' 
              : '0 0 6px rgba(255,255,255,0.8)',
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Flying Camly Coins */}
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
            x: [0, 100, -50, 80, 0],
            y: [0, -80, 50, -100, 0],
            rotate: [0, 360, 720, 1080, 1440],
            scale: [1, 1.1, 0.9, 1.15, 1],
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
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]"
            animate={{
              filter: [
                'drop-shadow(0 0 15px rgba(255,215,0,0.8))',
                'drop-shadow(0 0 25px rgba(255,215,0,1))',
                'drop-shadow(0 0 15px rgba(255,215,0,0.8))',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      ))}
      
      {/* Slow-moving gold meteors */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`meteor-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 20}%`,
            top: '-5%',
          }}
          animate={{
            x: ['0%', '50%'],
            y: ['0vh', '110vh'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 8 + i * 0.5,
            repeat: Infinity,
            delay: i * 5,
            ease: "linear",
          }}
        >
          {/* Meteor head */}
          <div 
            className="w-3 h-3 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #FFF8DC, #FFD700, #DAA520)',
              boxShadow: '0 0 15px #FFD700, 0 0 30px #FFAA00',
            }}
          />
          {/* Meteor tail */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-16 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, #FFD700, transparent)',
              filter: 'blur(2px)',
            }}
          />
        </motion.div>
      ))}
      
      {/* Large decorative planet - bottom right with purple tint */}
      <motion.div
        className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #E9D5FF, #A855F7, #7E22CE)',
          boxShadow: '0 0 60px rgba(168, 85, 247, 0.4), inset 0 -25px 50px rgba(126, 34, 206, 0.5)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        {/* Planet ring - purple/gold */}
        <div 
          className="absolute inset-[-15px] rounded-full border-4 border-purple-400/40"
          style={{ 
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 15px rgba(168, 85, 247, 0.3)',
          }}
        />
      </motion.div>
      
      {/* Ambient light rays - purple/pink tones */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-10">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`ray-${i}`}
            className="absolute top-0 left-1/2 w-2 origin-top"
            style={{
              height: '100vh',
              background: i % 2 === 0 
                ? 'linear-gradient(to bottom, #A855F7, transparent)' 
                : 'linear-gradient(to bottom, #FFD700, transparent)',
              transform: `rotate(${i * 60}deg) translateX(-50%)`,
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
};
