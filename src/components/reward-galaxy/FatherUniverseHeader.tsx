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
        className="relative inline-block mb-10"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Outermost gold pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full -m-20"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.4), transparent 70%)',
          }}
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Second glow ring - purple */}
        <motion.div
          className="absolute inset-0 rounded-full -m-14 bg-purple-500/50 blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.3, 0.7],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        
        {/* Third glow ring - pink */}
        <motion.div
          className="absolute inset-0 rounded-full -m-10 bg-pink-400/40 blur-2xl"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        
        {/* Inner glow */}
        <div className="absolute inset-0 rounded-full blur-3xl opacity-90 -m-10 bg-gradient-to-r from-amber-400 via-pink-400 to-amber-400" />
        
        {/* Main icon circle - LARGER 3D effect */}
        <motion.div 
          className="relative w-44 h-44 md:w-56 md:h-56 rounded-full flex items-center justify-center mx-auto"
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF69B4 60%, #A855F7 100%)',
            boxShadow: '0 25px 80px rgba(255, 165, 0, 0.6), 0 0 100px rgba(255, 215, 0, 0.4), inset 0 6px 15px rgba(255,255,255,0.5), inset 0 -6px 15px rgba(0,0,0,0.25)',
          }}
          animate={{
            boxShadow: [
              '0 25px 80px rgba(255, 165, 0, 0.6), 0 0 100px rgba(255, 215, 0, 0.4), inset 0 6px 15px rgba(255,255,255,0.5), inset 0 -6px 15px rgba(0,0,0,0.25)',
              '0 25px 100px rgba(255, 165, 0, 0.8), 0 0 140px rgba(255, 215, 0, 0.6), inset 0 6px 15px rgba(255,255,255,0.5), inset 0 -6px 15px rgba(0,0,0,0.25)',
              '0 25px 80px rgba(255, 165, 0, 0.6), 0 0 100px rgba(255, 215, 0, 0.4), inset 0 6px 15px rgba(255,255,255,0.5), inset 0 -6px 15px rgba(0,0,0,0.25)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Shine overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 via-transparent to-transparent" />
          
          {/* Gift icon - BIGGER with inner glow */}
          <motion.div
            animate={{ 
              scale: [1, 1.12, 1],
              rotate: [0, 6, -6, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Gift 
              className="w-20 h-20 md:w-28 md:h-28 text-white relative z-10" 
              style={{
                filter: 'drop-shadow(0 0 25px rgba(255,255,255,0.9)) drop-shadow(0 0 50px rgba(255,255,255,0.5))',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Orbiting gold stars - more stars, varied sizes */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
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
                className={`${i % 3 === 0 ? 'w-8 h-8' : i % 2 === 0 ? 'w-6 h-6' : 'w-5 h-5'} fill-yellow-400 text-yellow-400`}
                style={{
                  filter: 'drop-shadow(0 0 15px #FFD700) drop-shadow(0 0 30px #FFD700)',
                }}
              />
            </motion.div>
          </motion.div>
        ))}
        
        {/* Sparkle particles bursting from icon */}
        {[...Array(16)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute left-1/2 top-1/2"
            style={{
              width: '6px',
              height: '6px',
              background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF69B4' : '#A855F7',
              borderRadius: '50%',
              boxShadow: i % 3 === 0 ? '0 0 15px #FFD700' : i % 3 === 1 ? '0 0 15px #FF69B4' : '0 0 15px #A855F7',
            }}
            animate={{
              x: [0, Math.cos(i * 22.5 * Math.PI / 180) * 100],
              y: [0, Math.sin(i * 22.5 * Math.PI / 180) * 100],
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

      {/* Title with enhanced gradient and glow - BIGGER */}
      <motion.h1 
        className="text-5xl md:text-7xl font-fredoka font-bold mb-6 relative inline-block tracking-tight"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span 
          className="bg-gradient-to-r from-yellow-300 via-orange-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent"
          style={{
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
          }}
        >
          🎁 Quà Tặng Từ Cha Vũ Trụ
        </span>
        {/* Glow behind text */}
        <motion.div 
          className="absolute inset-0 -z-10 blur-3xl opacity-60"
          style={{
            background: 'linear-gradient(90deg, #FFD700, #FF69B4, #FFD700)',
          }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </motion.h1>

      {/* Loving message to children - enhanced BIGGER */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="space-y-5"
      >
        <motion.p 
          className="text-3xl md:text-4xl font-fredoka font-bold flex items-center justify-center gap-4"
          style={{
            color: '#FFD700',
            textShadow: '0 0 30px rgba(255,215,0,0.7), 0 0 60px rgba(255,215,0,0.4), 0 5px 10px rgba(0,0,0,0.6)',
          }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart 
              className="w-9 h-9 text-pink-400 fill-pink-400" 
              style={{ filter: 'drop-shadow(0 0 15px #FF69B4) drop-shadow(0 0 30px #FF69B4)' }} 
            />
          </motion.div>
          <span>Con yêu của Cha Vũ Trụ ơi!</span>
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
          >
            <Heart 
              className="w-9 h-9 text-pink-400 fill-pink-400" 
              style={{ filter: 'drop-shadow(0 0 15px #FF69B4) drop-shadow(0 0 30px #FF69B4)' }} 
            />
          </motion.div>
        </motion.p>
        
        <p 
          className="text-xl md:text-2xl font-jakarta max-w-3xl mx-auto leading-relaxed font-medium"
          style={{
            color: 'rgba(255,255,255,0.98)',
            textShadow: '0 3px 10px rgba(0,0,0,0.6)',
          }}
        >
          Cha Vũ Trụ đã chuẩn bị những phần thưởng tuyệt vời dành riêng cho con! 
          Mỗi hành động của con đều xứng đáng được tưởng thưởng.
        </p>
        
        <motion.p
          className="text-lg md:text-xl font-jakarta font-bold max-w-xl mx-auto"
          style={{
            color: '#FFD700',
            textShadow: '0 0 30px rgba(255,215,0,0.7), 0 3px 6px rgba(0,0,0,0.5)',
          }}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          ✨ Đăng nhập mỗi ngày • Chơi game vui vẻ • Upload sáng tạo • Mời bạn bè ✨
        </motion.p>
      </motion.div>

      {/* Decorative sparkles - more dynamic, BIGGER */}
      <div className="flex justify-center gap-6 mt-8">
        {[...Array(9)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -12, 0],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.3, 1],
              rotate: [0, 20, -20, 0],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          >
            <Sparkles 
              className={`${i % 2 === 0 ? 'w-8 h-8' : 'w-6 h-6'} text-yellow-400`}
              style={{ filter: 'drop-shadow(0 0 12px #FFD700) drop-shadow(0 0 24px #FFD700)' }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
