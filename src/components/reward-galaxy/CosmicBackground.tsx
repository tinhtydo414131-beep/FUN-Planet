import { motion } from 'framer-motion';

export const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient - cosmic blue */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a2e] via-[#1a1a4e] to-[#2d1b4e]" />
      
      {/* Nebula effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-500/20 rounded-full blur-[80px]" />
      </div>
      
      {/* Stars */}
      {[...Array(100)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.8 + 0.2,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Shooting stars */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`shooting-${i}`}
          className="absolute w-20 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent"
          style={{
            top: `${10 + Math.random() * 30}%`,
            left: '-20%',
          }}
          animate={{
            x: ['0vw', '150vw'],
            y: ['0vh', '50vh'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: 3 + i * 5,
            ease: "easeOut",
          }}
        />
      ))}
      
      {/* Rotating planet in background */}
      <motion.div
        className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #8b5cf6, #4c1d95)',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.4), inset -20px -20px 40px rgba(0,0,0,0.4)',
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
      >
        {/* Planet ring */}
        <div 
          className="absolute inset-[-20px] rounded-full border-2 border-purple-400/30"
          style={{ transform: 'rotateX(75deg)' }}
        />
      </motion.div>
      
      {/* Small floating planet */}
      <motion.div
        className="absolute top-20 left-10 w-12 h-12 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #f472b6, #db2777)',
          boxShadow: '0 0 20px rgba(244, 114, 182, 0.4)',
        }}
        animate={{ 
          y: [0, -20, 0],
          rotate: 360,
        }}
        transition={{ 
          y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
      />
    </div>
  );
};
