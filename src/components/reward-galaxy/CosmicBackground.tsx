import { motion } from 'framer-motion';

export const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - Pale sky blue to warm peach-gold */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#FFE4B5] to-[#FFDAB9]" />
      
      {/* Golden nebula glow effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FFD700] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#FFAA00] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-[#FFE4B5] rounded-full blur-[100px]" />
      </div>
      
      {/* Golden sparkling particles */}
      {[...Array(80)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 5}px`,
            height: `${2 + Math.random() * 5}px`,
            background: i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#FFAA00' : i % 4 === 2 ? '#FFEC8B' : '#FFF8DC',
            boxShadow: `0 0 ${6 + Math.random() * 12}px ${i % 2 === 0 ? '#FFD700' : '#FFAA00'}`,
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
      
      {/* Golden shooting stars */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`shooting-${i}`}
          className="absolute w-1 h-12 rounded-full"
          style={{
            background: 'linear-gradient(to bottom, transparent, #FFD700, #FFAA00, transparent)',
            left: `${10 + i * 15}%`,
            top: '-5%',
            boxShadow: '0 0 10px #FFD700',
          }}
          animate={{
            y: ['0vh', '120vh'],
            x: [0, 50],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 2.5,
            ease: "easeIn",
          }}
        />
      ))}
      
      {/* Floating golden planets */}
      <motion.div
        className="absolute top-[12%] left-[8%] w-20 h-20 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFEC8B, #FFD700, #FFAA00)',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 -5px 20px rgba(0,0,0,0.1)',
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
        className="absolute top-[22%] right-[10%] w-14 h-14 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFF8DC, #FFEC8B, #FFD700)',
          boxShadow: '0 0 30px rgba(255, 236, 139, 0.5), inset 0 -3px 15px rgba(0,0,0,0.1)',
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
        className="absolute bottom-[25%] left-[5%] w-12 h-12 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFE4B5, #FFDAB9, #FFAA00)',
          boxShadow: '0 0 25px rgba(255, 170, 0, 0.5)',
        }}
        animate={{ 
          y: [0, -12, 0],
          x: [0, 10, 0],
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Large decorative golden planet - bottom right */}
      <motion.div
        className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFEC8B, #FFD700, #FFAA00)',
          boxShadow: '0 0 80px rgba(255, 215, 0, 0.5), inset 0 -10px 40px rgba(0,0,0,0.15)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        {/* Golden planet ring */}
        <div 
          className="absolute inset-[-20px] rounded-full border-4 border-[#FFD700]/50"
          style={{ 
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
          }}
        />
      </motion.div>

      {/* Subtle golden clouds */}
      <div className="absolute inset-0 opacity-20">
        <motion.div 
          className="absolute top-16 left-[10%] w-48 h-24 bg-[#FFD700] rounded-full blur-3xl"
          animate={{ x: [0, 30, 0], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute top-40 right-[15%] w-64 h-28 bg-[#FFEC8B] rounded-full blur-3xl"
          animate={{ x: [0, -25, 0], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
};
