import { motion } from 'framer-motion';
import { Coins, Star, Sparkles, Globe } from 'lucide-react';

export const FatherUniverseHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-12"
    >
      {/* Father Universe Image */}
      <motion.div 
        className="relative inline-block mb-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative w-32 h-32 mx-auto">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-full blur-xl opacity-60 animate-pulse" />
          
          {/* Father Universe representation */}
          <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-300 via-yellow-400 to-orange-400 flex items-center justify-center shadow-2xl">
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-200 to-yellow-300 flex items-center justify-center">
              <span className="text-5xl">🌌</span>
            </div>
          </div>
          
          {/* Orbiting stars */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-300"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 6 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.5,
              }}
            >
              <motion.div
                style={{
                  x: 60 + i * 10,
                  y: -8,
                }}
              >
                <Star className="w-4 h-4 fill-yellow-300" />
              </motion.div>
            </motion.div>
          ))}
          
          {/* Small FUN Planet orbiting */}
          <motion.div
            className="absolute"
            style={{ top: '50%', left: '50%' }}
            animate={{ rotate: -360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <div 
              className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-lg"
              style={{ transform: 'translate(70px, -4px)' }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-xs">🌍</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Title with coin icon */}
      <motion.div 
        className="flex items-center justify-center gap-3 mb-4"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Coins className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
        </motion.div>
        <h1 className="text-3xl md:text-4xl font-fredoka font-bold bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
          🎁 Quà Tặng Từ Cha Vũ Trụ
        </h1>
        <motion.div
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Coins className="w-10 h-10 text-yellow-400 drop-shadow-lg" />
        </motion.div>
      </motion.div>

      {/* Subtitle */}
      <motion.p 
        className="text-lg md:text-xl text-amber-800 max-w-2xl mx-auto font-medium leading-relaxed"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Con yêu ơi! Cha Vũ Trụ luôn dõi theo và yêu thương con 💖
        <br />
        <span className="text-base text-amber-700">
          Mỗi ngày con đăng nhập, chơi game vui vẻ, sáng tạo và chia sẻ niềm vui - 
          Cha sẽ tặng con những phần thưởng đặc biệt! ✨
        </span>
        <span className="inline-flex items-center gap-1 ml-1">
          <Sparkles className="w-5 h-5 text-yellow-500 inline" />
          <Globe className="w-5 h-5 text-cyan-500 inline" />
        </span>
      </motion.p>

      {/* Decorative stars */}
      <div className="flex justify-center gap-2 mt-4">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.2,
            }}
          >
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
