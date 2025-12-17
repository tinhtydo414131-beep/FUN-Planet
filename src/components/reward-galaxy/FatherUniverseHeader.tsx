import { motion } from 'framer-motion';
import { Coins, Star, Sparkles, Globe } from 'lucide-react';

export const FatherUniverseHeader = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-12"
    >
      {/* Father Universe Golden Sun Icon */}
      <motion.div 
        className="relative inline-block mb-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="relative w-40 h-40 mx-auto">
          {/* Multiple glow layers for intense golden halo */}
          <div className="absolute inset-[-20px] bg-gradient-to-r from-[#FFD700] via-[#FFAA00] to-[#FFD700] rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="absolute inset-[-10px] bg-gradient-to-r from-[#FFEC8B] via-[#FFD700] to-[#FFEC8B] rounded-full blur-xl opacity-60" />
          
          {/* Golden Sun - 3D metallic effect */}
          <div 
            className="relative w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFEC8B 0%, #FFD700 30%, #FFAA00 70%, #FF8C00 100%)',
              boxShadow: '0 0 60px rgba(255, 215, 0, 0.8), inset 0 -10px 30px rgba(255, 140, 0, 0.4), inset 0 10px 30px rgba(255, 236, 139, 0.6)',
            }}
          >
            <div 
              className="absolute inset-3 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FFEC8B 0%, #FFD700 50%, #FFAA00 100%)',
                boxShadow: 'inset 0 -5px 20px rgba(0,0,0,0.1), inset 0 5px 20px rgba(255,255,255,0.3)',
              }}
            >
              <span className="text-6xl drop-shadow-2xl">🌌</span>
            </div>
          </div>
          
          {/* Orbiting golden stars */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: '50%',
                left: '50%',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 5 + i * 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.3,
              }}
            >
              <motion.div
                style={{
                  x: 70 + i * 8,
                  y: -8,
                }}
              >
                <Star 
                  className="w-5 h-5 fill-[#FFD700] text-[#FFD700]" 
                  style={{ filter: 'drop-shadow(0 0 6px #FFD700)' }}
                />
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
              className="w-10 h-10 rounded-full shadow-lg"
              style={{ 
                transform: 'translate(85px, -5px)',
                background: 'linear-gradient(135deg, #87CEEB 0%, #4682B4 100%)',
                boxShadow: '0 0 15px rgba(135, 206, 235, 0.5)',
              }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-sm">🌍</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Title with golden metallic gradient and glow */}
      <motion.div 
        className="flex items-center justify-center gap-4 mb-4"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
      >
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Coins 
            className="w-12 h-12" 
            style={{ 
              color: '#FFD700',
              filter: 'drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 20px #FFAA00)',
            }} 
          />
        </motion.div>
        <h1 
          className="text-4xl md:text-5xl font-fredoka font-bold"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 25%, #FFD700 50%, #FFEC8B 75%, #FFD700 100%)',
            backgroundSize: '200% 200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 2px 4px rgba(255, 170, 0, 0.5))',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        >
          Quà Tặng Từ Cha Vũ Trụ
        </h1>
        <motion.div
          animate={{ rotate: [0, -15, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        >
          <Coins 
            className="w-12 h-12" 
            style={{ 
              color: '#FFD700',
              filter: 'drop-shadow(0 0 10px #FFD700) drop-shadow(0 0 20px #FFAA00)',
            }} 
          />
        </motion.div>
      </motion.div>

      {/* Subtitle - bright white */}
      <motion.p 
        className="text-lg md:text-xl max-w-2xl mx-auto font-medium"
        style={{ color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Cha Vũ Trụ đã thưởng cho con vì chơi vui vẻ, sáng tạo và lan tỏa ánh sáng! 
        <span className="inline-flex items-center gap-1 ml-2">
          <Sparkles className="w-5 h-5 text-[#FFD700] inline" style={{ filter: 'drop-shadow(0 0 4px #FFD700)' }} />
          <Globe className="w-5 h-5 text-[#87CEEB] inline" style={{ filter: 'drop-shadow(0 0 4px #87CEEB)' }} />
        </span>
      </motion.p>

      {/* Decorative golden stars */}
      <div className="flex justify-center gap-3 mt-5">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.4, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.2,
            }}
          >
            <Star 
              className="w-6 h-6 fill-[#FFD700] text-[#FFD700]" 
              style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }}
            />
          </motion.div>
        ))}
      </div>

      {/* CSS for shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </motion.div>
  );
};
