import { motion } from 'framer-motion';
import { Sparkles, Star, Gift, Heart } from 'lucide-react';

export const FatherUniverseHeader = () => {
  return (
    <motion.div 
      className="text-center mb-12"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Father Universe Icon with gold glow */}
      <motion.div
        className="relative inline-block mb-6"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-full blur-3xl opacity-60 -m-8 bg-pastel-yellow" />
        
        {/* 3D Gold circle */}
        <div 
          className="relative w-32 h-32 md:w-36 md:h-36 rounded-full flex items-center justify-center mx-auto bg-gradient-to-br from-pastel-yellow via-amber-200 to-amber-400"
          style={{
            boxShadow: '0 15px 50px rgba(251, 191, 36, 0.5), inset 0 4px 8px rgba(255,255,255,0.5), inset 0 -4px 8px rgba(0,0,0,0.15)',
          }}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-transparent" />
          <Gift className="w-14 h-14 md:w-16 md:h-16 text-white drop-shadow-lg relative z-10" />
        </div>

        {/* Orbiting gold stars */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: '50%', left: '50%' }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                left: `${55 + i * 12}px`,
                top: '-8px',
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            >
              <Star className="w-4 h-4 md:w-5 md:h-5 fill-pastel-yellow text-pastel-yellow drop-shadow-lg" />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Title with gradient */}
      <motion.h1 
        className="text-3xl md:text-5xl font-fredoka font-bold mb-4 relative inline-block"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span 
          className="text-amber-500 drop-shadow-lg"
          style={{
            textShadow: '0 2px 4px rgba(0,0,0,0.2), 0 0 20px rgba(251, 191, 36, 0.4)',
          }}
        >
          🎁 Quà Tặng Từ Cha Vũ Trụ
        </span>
      </motion.h1>

      {/* Loving message to children */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <p className="text-xl md:text-2xl font-jakarta font-bold flex items-center justify-center gap-2 text-foreground">
          <Heart className="w-6 h-6 text-pastel-pink fill-pastel-pink" />
          <span>Con yêu của Cha Vũ Trụ ơi!</span>
          <Heart className="w-6 h-6 text-pastel-pink fill-pastel-pink" />
        </p>
        
        <p className="text-base md:text-lg font-jakarta max-w-xl mx-auto leading-relaxed text-muted-foreground">
          Cha Vũ Trụ đã chuẩn bị những phần thưởng tuyệt vời dành riêng cho con! 
          Mỗi hành động của con đều xứng đáng được tưởng thưởng.
        </p>
        
        <motion.p
          className="text-sm md:text-base font-jakarta font-medium text-white max-w-md mx-auto"
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨ Đăng nhập mỗi ngày • Chơi game vui vẻ • Upload sáng tạo • Mời bạn bè ✨
        </motion.p>
      </motion.div>

      {/* Decorative sparkles */}
      <div className="flex justify-center gap-4 mt-5">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -6, 0],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
          >
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-pastel-yellow" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
