import { motion } from 'framer-motion';

export const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - Bright pastel sunrise */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#FFB6C1] to-[#FFFACD]" />
      
      {/* Pastel clouds */}
      <div className="absolute inset-0 opacity-40">
        <motion.div 
          className="absolute top-10 left-[10%] w-40 h-20 bg-white rounded-full blur-2xl"
          animate={{ x: [0, 30, 0], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-32 right-[15%] w-56 h-24 bg-white rounded-full blur-3xl"
          animate={{ x: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-[30%] left-[20%] w-48 h-16 bg-white rounded-full blur-2xl"
          animate={{ x: [0, 40, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Subtle pastel nebula effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E6E6FA] rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FFE4E1] rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-[#E0FFFF] rounded-full blur-[80px]" />
      </div>
      
      {/* Sparkling stars */}
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
            background: i % 3 === 0 ? '#FFD700' : i % 3 === 1 ? '#FF69B4' : '#87CEEB',
            boxShadow: `0 0 ${4 + Math.random() * 8}px currentColor`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Floating small planets - pastel colors */}
      <motion.div
        className="absolute top-[15%] left-[8%] w-16 h-16 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #98FB98, #3CB371)',
          boxShadow: '0 0 30px rgba(152, 251, 152, 0.5)',
        }}
        animate={{ 
          y: [0, -15, 0],
          rotate: 360,
        }}
        transition={{ 
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 25, repeat: Infinity, ease: "linear" }
        }}
      />
      
      <motion.div
        className="absolute top-[25%] right-[12%] w-12 h-12 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFB6C1, #FF69B4)',
          boxShadow: '0 0 25px rgba(255, 182, 193, 0.6)',
        }}
        animate={{ 
          y: [0, -20, 0],
          rotate: -360,
        }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
      />
      
      <motion.div
        className="absolute bottom-[20%] left-[5%] w-10 h-10 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFFACD, #FFD700)',
          boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
        }}
        animate={{ 
          y: [0, -10, 0],
          x: [0, 10, 0],
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Large decorative planet - bottom right */}
      <motion.div
        className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full opacity-60"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #DDA0DD, #BA55D3)',
          boxShadow: '0 0 60px rgba(221, 160, 221, 0.4)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        {/* Planet ring */}
        <div 
          className="absolute inset-[-15px] rounded-full border-4 border-[#E6E6FA]/40"
          style={{ transform: 'rotateX(75deg)' }}
        />
      </motion.div>
      
      {/* Gentle falling stars on hover areas */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`falling-${i}`}
          className="absolute w-1 h-8 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, #FFD700, transparent)',
            left: `${15 + i * 18}%`,
            top: '-10%',
          }}
          animate={{
            y: ['0vh', '120vh'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 3,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};
