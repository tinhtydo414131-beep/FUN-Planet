import { motion } from 'framer-motion';
import { Sparkles, Star, Gift, Heart } from 'lucide-react';

export const FatherUniverseHeader = () => {
  return (
    <motion.div 
      className="text-center mb-14"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Father Universe Icon with multi-layer glow */}
      <motion.div
        className="relative inline-block mb-8"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outermost gold pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full -m-16"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.3), transparent 70%)',
          }}
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Second glow ring - purple */}
        <motion.div
          className="absolute inset-0 rounded-full -m-10 bg-purple-500/40 blur-2xl"
          animate={{ 
            scale: [1, 1.15, 1],
            opacity: [0.6, 0.3, 0.6],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full blur-3xl opacity-80 -m-8 bg-gradient-to-r from-amber-400 to-pink-400" />
        
        {/* Main icon circle - larger */}
        <motion.div 
          className="relative w-36 h-36 md:w-44 md:h-44 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 30%, #FF69B4 70%, #A855F7 100%)',
            boxShadow: '0 20px 60px rgba(255, 165, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.3), inset 0 4px 10px rgba(255,255,255,0.4), inset 0 -4px 10px rgba(0,0,0,0.2)',
          }}
          animate={{
            boxShadow: [
              '0 20px 60px rgba(255, 165, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.3), inset 0 4px 10px rgba(255,255,255,0.4), inset 0 -4px 10px rgba(0,0,0,0.2)',
              '0 20px 80px rgba(255, 165, 0, 0.7), 0 0 120px rgba(255, 215, 0, 0.5), inset 0 4px 10px rgba(255,255,255,0.4), inset 0 -4px 10px rgba(0,0,0,0.2)',
              '0 20px 60px rgba(255, 165, 0, 0.5), 0 0 80px rgba(255, 215, 0, 0.3), inset 0 4px 10px rgba(255,255,255,0.4), inset 0 -4px 10px rgba(0,0,0,0.2)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 via-transparent to-transparent" />
          
          {/* Gift icon - larger with inner glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Gift 
              className="w-16 h-16 md:w-20 md:h-20 text-white relative z-10" 
              style={{
                filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.8))',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Orbiting gold stars - more stars, varied sizes */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ top: '50%', left: '50%' }}
            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
            transition={{
              duration: 6 + i * 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <motion.div
              style={{
                position: 'absolute',
                left: `${55 + i * 10}px`,
                top: '-10px',
              }}
              animate={{ 
                scale: [1, 1.4, 1], 
                opacity: [0.7, 1, 0.7],
              }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            >
              <Star 
                className={`${i % 3 === 0 ? 'w-6 h-6' : 'w-4 h-4'} fill-yellow-400 text-yellow-400`}
                style={{
                  filter: 'drop-shadow(0 0 10px #FFD700)',
                }}
              />
            </motion.div>
          </motion.div>
        ))}
        
        {/* Sparkle particles bursting from icon */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: '4px',
              height: '4px',
              background: i % 2 === 0 ? '#FFD700' : '#FF69B4',
              borderRadius: '50%',
              boxShadow: i % 2 === 0 ? '0 0 10px #FFD700' : '0 0 10px #FF69B4',
            }}
            animate={{
              x: [0, Math.cos(i * 30 * Math.PI / 180) * 80],
              y: [0, Math.sin(i * 30 * Math.PI / 180) * 80],
              opacity: [1, 0],
              scale: [1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>

      {/* Title with enhanced gradient and glow */}
      <motion.h1 
        className="text-4xl md:text-6xl font-fredoka font-bold mb-5 relative inline-block"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span 
          className="bg-gradient-to-r from-yellow-300 via-orange-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent"
          style={{
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
          }}
        >
          🎁 Quà Tặng Từ Cha Vũ Trụ
        </span>
        {/* Glow behind text */}
        <div 
          className="absolute inset-0 -z-10 blur-2xl opacity-50"
          style={{
            background: 'linear-gradient(90deg, #FFD700, #FF69B4, #FFD700)',
          }}
        />
      </motion.h1>

      {/* Loving message to children - enhanced */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <motion.p 
          className="text-2xl md:text-3xl font-fredoka font-bold flex items-center justify-center gap-3"
          style={{
            color: '#FFFFFF',
            textShadow: '0 0 20px rgba(255,255,255,0.5), 0 4px 8px rgba(0,0,0,0.5)',
          }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart className="w-7 h-7 text-pink-400 fill-pink-400" style={{ filter: 'drop-shadow(0 0 10px #FF69B4)' }} />
          </motion.div>
          <span>Con yêu của Cha Vũ Trụ ơi!</span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <Heart className="w-7 h-7 text-pink-400 fill-pink-400" style={{ filter: 'drop-shadow(0 0 10px #FF69B4)' }} />
          </motion.div>
        </motion.p>
        
        <p 
          className="text-lg md:text-xl font-jakarta max-w-2xl mx-auto leading-relaxed font-medium"
          style={{
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          Cha Vũ Trụ đã chuẩn bị những phần thưởng tuyệt vời dành riêng cho con! 
          Mỗi hành động của con đều xứng đáng được tưởng thưởng.
        </p>
        
        <motion.p
          className="text-base md:text-lg font-jakarta font-bold max-w-lg mx-auto"
          style={{
            color: '#FFD700',
            textShadow: '0 0 20px rgba(255,215,0,0.6), 0 2px 4px rgba(0,0,0,0.4)',
          }}
          animate={{ opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨ Đăng nhập mỗi ngày • Chơi game vui vẻ • Upload sáng tạo • Mời bạn bè ✨
        </motion.p>
      </motion.div>

      {/* Decorative sparkles - more dynamic */}
      <div className="flex justify-center gap-5 mt-6">
        {[...Array(7)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -10, 0],
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1],
              rotate: [0, 15, -15, 0],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.12,
              ease: "easeInOut",
            }}
          >
            <Sparkles 
              className={`${i % 2 === 0 ? 'w-6 h-6' : 'w-5 h-5'} text-yellow-400`}
              style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
