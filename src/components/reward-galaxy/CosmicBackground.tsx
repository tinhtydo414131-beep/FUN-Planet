import { motion } from 'framer-motion';

export const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - Pale sky blue to warm rose gold */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#87CEEB] via-[#FFDAB9] to-[#FFEC8B]" />
      
      {/* Strong glassmorphism blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[15px] bg-white/10" />
      
      {/* Gold ambient glow */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FFD700] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#FFAA00] rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-[#FFEC8B] rounded-full blur-[100px]" />
      </div>
      
      {/* Sparkling gold particles */}
      {[...Array(80)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 5}px`,
            height: `${2 + Math.random() * 5}px`,
            background: i % 4 === 0 
              ? 'linear-gradient(135deg, #FFD700, #FFAA00)' 
              : i % 4 === 1 
              ? '#FFEC8B' 
              : i % 4 === 2
              ? '#FFD700'
              : '#FFF8DC',
            boxShadow: `0 0 ${8 + Math.random() * 15}px #FFD700`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.8, 1],
          }}
          transition={{
            duration: 1.5 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Slow-moving gold meteors */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`meteor-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 15}%`,
            top: '-5%',
          }}
          animate={{
            x: ['0%', '50%'],
            y: ['0vh', '110vh'],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 6 + i * 0.5,
            repeat: Infinity,
            delay: i * 4,
            ease: "linear",
          }}
        >
          {/* Meteor head */}
          <div 
            className="w-4 h-4 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, #FFF8DC, #FFD700, #DAA520)',
              boxShadow: '0 0 20px #FFD700, 0 0 40px #FFAA00',
            }}
          />
          {/* Meteor tail */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-20 rounded-full"
            style={{
              background: 'linear-gradient(to bottom, #FFD700, transparent)',
              filter: 'blur(2px)',
            }}
          />
        </motion.div>
      ))}
      
      {/* Floating gold orbs */}
      <motion.div
        className="absolute top-[15%] left-[8%] w-20 h-20 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFF8DC, #FFD700, #DAA520)',
          boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 -10px 20px rgba(218, 165, 32, 0.5)',
        }}
        animate={{ 
          y: [0, -20, 0],
          rotate: 360,
        }}
        transition={{ 
          y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 25, repeat: Infinity, ease: "linear" }
        }}
      />
      
      <motion.div
        className="absolute top-[25%] right-[12%] w-14 h-14 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFEC8B, #FFD700, #B8860B)',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.7), inset 0 -8px 15px rgba(184, 134, 11, 0.5)',
        }}
        animate={{ 
          y: [0, -25, 0],
          rotate: -360,
        }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
      />
      
      <motion.div
        className="absolute bottom-[20%] left-[5%] w-12 h-12 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFF8DC, #FFAA00, #CD853F)',
          boxShadow: '0 0 25px rgba(255, 170, 0, 0.6)',
        }}
        animate={{ 
          y: [0, -15, 0],
          x: [0, 15, 0],
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Large decorative gold planet - bottom right */}
      <motion.div
        className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full opacity-70"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFF8DC, #FFD700, #B8860B)',
          boxShadow: '0 0 80px rgba(255, 215, 0, 0.5), inset 0 -30px 60px rgba(184, 134, 11, 0.6)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        {/* Planet ring - gold */}
        <div 
          className="absolute inset-[-20px] rounded-full border-4 border-[#FFD700]/50"
          style={{ 
            transform: 'rotateX(75deg)',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
          }}
        />
      </motion.div>
      
      {/* Ambient gold light rays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`ray-${i}`}
            className="absolute top-0 left-1/2 w-2 origin-top"
            style={{
              height: '100vh',
              background: 'linear-gradient(to bottom, #FFD700, transparent)',
              transform: `rotate(${i * 45}deg) translateX(-50%)`,
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
};
