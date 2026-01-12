import { motion } from 'framer-motion';
import { Sparkles, Star, Gift, Heart } from 'lucide-react';

export const FatherUniverseHeader = () => {
  return (
    <motion.div 
      className="text-center mb-8 sm:mb-14 bg-white/90 backdrop-blur-xl rounded-3xl p-4 sm:p-8 md:p-12 mx-2 sm:mx-4 shadow-[0_8px_32px_rgba(168,85,247,0.15),0_0_60px_rgba(255,182,193,0.2)] border border-white/60"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Father Universe Icon with multi-layer glow */}
      <motion.div
        className="relative inline-block mb-6 sm:mb-10"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outermost gold pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full -m-12 sm:-m-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.3), transparent 70%)',
          }}
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Second glow ring - purple */}
        <motion.div
          className="absolute inset-0 rounded-full -m-8 sm:-m-14 bg-purple-500/40 blur-2xl sm:blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        
        {/* Third glow ring - pink */}
        <motion.div
          className="absolute inset-0 rounded-full -m-6 sm:-m-10 bg-pink-400/30 blur-xl sm:blur-2xl"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full blur-2xl sm:blur-3xl opacity-80 -m-6 sm:-m-10 bg-gradient-to-r from-amber-400 via-pink-400 to-amber-400" />
        
        {/* Main icon circle - responsive sizes */}
        <motion.div 
          className="relative w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF69B4 60%, #A855F7 100%)',
            boxShadow: '0 20px 60px rgba(255, 165, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.3), inset 0 4px 12px rgba(255,255,255,0.5), inset 0 -4px 12px rgba(0,0,0,0.2)',
          }}
          animate={{
            boxShadow: [
              '0 20px 60px rgba(255, 165, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.3), inset 0 4px 12px rgba(255,255,255,0.5), inset 0 -4px 12px rgba(0,0,0,0.2)',
              '0 20px 80px rgba(255, 165, 0, 0.7), 0 0 100px rgba(255, 215, 0, 0.5), inset 0 4px 12px rgba(255,255,255,0.5), inset 0 -4px 12px rgba(0,0,0,0.2)',
              '0 20px 60px rgba(255, 165, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.3), inset 0 4px 12px rgba(255,255,255,0.5), inset 0 -4px 12px rgba(0,0,0,0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 via-transparent to-transparent" />
          
          {/* Gift icon - responsive sizes */}
          <motion.div
            animate={{ 
              scale: [1, 1.12, 1],
              rotate: [0, 6, -6, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Gift 
              className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 text-white relative z-10" 
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.9)) drop-shadow(0 0 40px rgba(255,255,255,0.5))',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Orbiting gold stars - fewer on mobile */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute hidden sm:block"
            style={{ top: '50%', left: '50%' }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{
              duration: 5 + i * 1.2,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                left: `${65 + i * 12}px`,
                top: '-12px',
              }}
              animate={{ 
                scale: [1, 1.5, 1], 
                opacity: [0.8, 1, 0.8],
              }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.12 }}
            >
              <Star 
                className={`${i % 3 === 0 ? 'w-7 h-7' : i % 2 === 0 ? 'w-5 h-5' : 'w-4 h-4'} fill-yellow-400 text-yellow-400`}
                style={{
                  filter: 'drop-shadow(0 0 12px #FFD700) drop-shadow(0 0 24px #FFD700)',
                }}
              />
            </motion.div>
          </motion.div>
        ))}
        
        {/* Sparkle particles bursting from icon - fewer on mobile */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute left-1/2 top-1/2 hidden sm:block"
            style={{
              width: '5px',
              height: '5px',
              background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF69B4' : '#3B82F6',
              borderRadius: '50%',
              boxShadow: i % 3 === 0 ? '0 0 12px #FFD700' : i % 3 === 1 ? '0 0 12px #FF69B4' : '0 0 12px #3B82F6',
            }}
            animate={{
              x: [0, Math.cos(i * 36 * Math.PI / 180) * 80],
              y: [0, Math.sin(i * 36 * Math.PI / 180) * 80],
              opacity: [1, 0],
              scale: [1, 0.3],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      {/* Title with yellow-pink-blue gradient */}
      <motion.h1 
        className="text-3xl sm:text-5xl md:text-6xl font-fredoka font-bold mb-4 sm:mb-6 relative inline-block tracking-tight drop-shadow-[0_0_20px_rgba(255,200,0,0.3)]"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span 
          className="bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent"
          style={{
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.1))',
          }}
        >
          🎁 Quà Tặng Từ Cha Vũ Trụ
        </span>
        {/* Subtle glow behind text */}
        <motion.div 
          className="absolute inset-0 -z-10 blur-2xl sm:blur-3xl opacity-40"
          style={{
            background: 'linear-gradient(90deg, #EAB308, #EC4899, #3B82F6)',
          }}
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.h1>

      {/* Loving message to children */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4 sm:space-y-5"
      >
        <motion.p 
          className="text-xl sm:text-3xl md:text-4xl font-fredoka font-bold flex items-center justify-center gap-2 sm:gap-4"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart 
              className="w-6 h-6 sm:w-9 sm:h-9 text-pink-500 fill-pink-500" 
              style={{ filter: 'drop-shadow(0 0 10px #EC4899)' }} 
            />
          </motion.div>
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Con yêu của Cha Vũ Trụ ơi!
          </span>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <Heart 
              className="w-6 h-6 sm:w-9 sm:h-9 text-pink-500 fill-pink-500" 
              style={{ filter: 'drop-shadow(0 0 10px #EC4899)' }} 
            />
          </motion.div>
        </motion.p>
        
        <p className="text-lg sm:text-2xl md:text-3xl font-fredoka max-w-3xl mx-auto leading-relaxed font-semibold tracking-wide text-blue-700/90 px-2">
          Cha Vũ Trụ đã chuẩn bị những phần thưởng tuyệt vời dành riêng cho con! 
          Mỗi hành động của con đều xứng đáng được tưởng thưởng.
        </p>
        
        <motion.p
          className="text-sm sm:text-xl md:text-2xl font-fredoka font-bold max-w-xl mx-auto tracking-wide px-2"
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
            ✨ Đăng nhập mỗi ngày • Chơi game vui vẻ • Upload sáng tạo • Mời bạn bè ✨
          </span>
        </motion.p>
      </motion.div>

      {/* Decorative sparkles - yellow, pink, blue */}
      <div className="flex justify-center gap-4 sm:gap-6 mt-6 sm:mt-8">
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -10, 0],
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.2, 1],
              rotate: [0, 15, -15, 0],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          >
            <Sparkles 
              className={`${i % 2 === 0 ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-5 h-5 sm:w-6 sm:h-6'} ${
                i % 3 === 0 ? 'text-yellow-500' : i % 3 === 1 ? 'text-pink-500' : 'text-blue-500'
              }`}
              style={{ 
                filter: i % 3 === 0 
                  ? 'drop-shadow(0 0 8px #EAB308)' 
                  : i % 3 === 1 
                    ? 'drop-shadow(0 0 8px #EC4899)' 
                    : 'drop-shadow(0 0 8px #3B82F6)' 
              }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
