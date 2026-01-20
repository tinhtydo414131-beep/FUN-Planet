import { motion } from 'framer-motion';

export const CosmicBackground = () => {
  // Reduced star count for better performance (30 instead of 80)
  const starCount = 30;
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - Light pastel white theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/50 to-pink-50/50" />
      
      {/* Radial center glow - soft pastel center */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(255,235,180,0.2) 0%, rgba(255,182,193,0.1) 30%, transparent 70%)',
        }}
      />
      
      {/* Soft pastel clouds for depth - hidden on mobile */}
      <div className="absolute inset-0 opacity-30 hidden sm:block">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-200/30 rounded-full blur-[180px]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-pink-200/25 rounded-full blur-[160px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.25, 0.2, 0.25] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-yellow-200/20 rounded-full blur-[140px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Twinkling stars - Reduced count: 30 instead of 80 */}
      {[...Array(starCount)].map((_, i) => {
        const size = 2 + Math.random() * 4;
        const colorIndex = i % 3;
        const colors = ['#FFD700', '#FF69B4', '#60A5FA']; // Yellow, Pink, Blue
        const color = colors[colorIndex];
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${size}px`,
              height: `${size}px`,
              background: color,
              boxShadow: `0 0 ${size * 3}px ${color}40, 0 0 ${size * 6}px ${color}20`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        );
      })}
      
      {/* Shooting stars with pastel trails - Reduced to 2, hidden on mobile */}
      <div className="hidden sm:block">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`shooting-star-${i}`}
            className="absolute"
            style={{
              left: `${10 + i * 40}%`,
              top: '-5%',
            }}
            animate={{
              x: ['0%', '50%'],
              y: ['0vh', '100vh'],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 7 + i * 0.8,
              repeat: Infinity,
              delay: i * 5,
              ease: "linear",
            }}
          >
            {/* Star head - pastel colors */}
            <div 
              className="w-3 h-3 rounded-full"
              style={{
                background: i % 2 === 0 
                  ? 'radial-gradient(circle at 30% 30%, #FFD700, #FFA500)' 
                  : 'radial-gradient(circle at 30% 30%, #FF69B4, #EC4899)',
                boxShadow: i % 2 === 0 
                  ? '0 0 15px #FFD700, 0 0 30px #FFA50060' 
                  : '0 0 15px #FF69B4, 0 0 30px #EC489960',
              }}
            />
            {/* Soft tail */}
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-24 rounded-full"
              style={{
                background: i % 2 === 0 
                  ? 'linear-gradient(to bottom, #FFD70080, transparent)' 
                  : 'linear-gradient(to bottom, #FF69B480, transparent)',
                filter: 'blur(2px)',
              }}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Decorative elements - Pastel planets - Hidden on mobile */}
      {/* Planet 1 - Bottom right - Soft purple/pink */}
      <motion.div
        className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full opacity-40 hidden sm:block"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #F5D0FE, #E879F9, #C026D3)',
          boxShadow: '0 0 60px rgba(232, 121, 249, 0.3), inset 0 -20px 40px rgba(192, 38, 211, 0.3)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
      >
        {/* Planet ring - gold */}
        <div 
          className="absolute inset-[-15px] rounded-full border-3 border-yellow-400/40"
          style={{ 
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
          }}
        />
      </motion.div>
      
      {/* Planet 2 - Top left - Soft pink/blue - Hidden on mobile */}
      <motion.div
        className="absolute -top-8 -left-8 w-28 h-28 rounded-full opacity-30 hidden sm:block"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FBCFE8, #F472B6, #EC4899)',
          boxShadow: '0 0 40px rgba(244, 114, 182, 0.3)',
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Soft vignette for depth - very subtle */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(255,240,245,0.3) 100%)',
        }}
      />
    </div>
  );
};
