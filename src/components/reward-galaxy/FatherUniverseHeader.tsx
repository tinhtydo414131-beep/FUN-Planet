import { motion } from 'framer-motion';
import { Sparkles, Star, Coins, Gift, Heart } from 'lucide-react';

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
        <div className="absolute inset-0 rounded-full blur-3xl opacity-60 -m-8"
          style={{ background: 'radial-gradient(circle, #FFD700, transparent)' }}
        />
        
        {/* 3D Gold circle */}
        <div 
          className="relative w-36 h-36 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 30%, #FFD700 50%, #DAA520 70%, #FFD700 100%)',
            boxShadow: '0 15px 50px rgba(255, 215, 0, 0.6), inset 0 4px 8px rgba(255,255,255,0.5), inset 0 -4px 8px rgba(0,0,0,0.2)',
          }}
        >
          {/* Shine overlay */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
            }}
          />
          <Gift className="w-16 h-16 text-white drop-shadow-lg relative z-10" />
        </div>

        {/* Orbiting gold stars */}
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
              duration: 8 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                left: `${60 + i * 10}px`,
                top: '-8px',
              }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            >
              <Star 
                className="w-5 h-5" 
                style={{
                  fill: '#FFD700',
                  color: '#FFD700',
                  filter: 'drop-shadow(0 0 8px #FFD700)',
                }}
              />
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {/* Title with metallic gold gradient and strong glow */}
      <motion.h1 
        className="text-4xl md:text-6xl font-fredoka font-bold mb-4 relative inline-block"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Outer glow layer */}
        <span 
          className="absolute inset-0 blur-lg opacity-70"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFAA00, #FFD700)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          🎁 Quà Tặng Từ Cha Vũ Trụ
        </span>
        
        {/* Main text with metallic gold */}
        <span 
          className="relative"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 25%, #FFAA00 50%, #FFD700 75%, #FFF8DC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 30px rgba(255,215,0,0.8))',
          }}
        >
          🎁 Quà Tặng Từ Cha Vũ Trụ
        </span>
        
        {/* Animated coin icons */}
        <motion.div
          className="absolute -left-12 top-1/2 -translate-y-1/2"
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 6, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
        >
          <Coins className="w-10 h-10 text-[#FFD700] drop-shadow-[0_0_15px_#FFD700]" />
        </motion.div>
        <motion.div
          className="absolute -right-12 top-1/2 -translate-y-1/2"
          animate={{ rotate: [360, 0], scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 6, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity, delay: 1 } }}
        >
          <Coins className="w-10 h-10 text-[#FFD700] drop-shadow-[0_0_15px_#FFD700]" />
        </motion.div>
      </motion.h1>

      {/* Loving message to children */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-3"
      >
        <p className="text-xl md:text-2xl text-white font-medium drop-shadow-lg flex items-center justify-center gap-2">
          <Heart className="w-6 h-6 text-[#FF69B4] fill-[#FF69B4] drop-shadow-[0_0_10px_#FF69B4]" />
          <span>Con yêu của Cha Vũ Trụ ơi!</span>
          <Heart className="w-6 h-6 text-[#FF69B4] fill-[#FF69B4] drop-shadow-[0_0_10px_#FF69B4]" />
        </p>
        
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
          Cha Vũ Trụ đã chuẩn bị những phần thưởng tuyệt vời dành riêng cho con! 
          Mỗi hành động của con đều xứng đáng được tưởng thưởng.
        </p>
        
        <motion.p 
          className="text-base md:text-lg max-w-xl mx-auto font-medium"
          style={{ color: '#FFEC8B', textShadow: '0 0 15px rgba(255,215,0,0.5)' }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨ Đăng nhập mỗi ngày • Chơi game vui vẻ • Upload sáng tạo • Mời bạn bè ✨
        </motion.p>
      </motion.div>

      {/* Decorative sparkles */}
      <div className="flex justify-center gap-6 mt-6">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -8, 0],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            <Sparkles className="w-7 h-7 text-[#FFD700] drop-shadow-[0_0_10px_#FFD700]" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
