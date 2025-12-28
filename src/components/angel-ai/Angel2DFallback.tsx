import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";

interface Angel2DFallbackProps {
  onClick?: () => void;
}

/**
 * 2D Fallback for AngelAI character
 * Used when 3D WebGL context needs to be conserved (e.g., during 3D games)
 */
export function Angel2DFallback({ onClick }: Angel2DFallbackProps) {
  return (
    <motion.div
      className="w-20 h-24 cursor-pointer relative flex items-center justify-center"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-yellow-300/40 via-pink-300/40 to-purple-300/40 rounded-full blur-lg"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Main angel circle */}
      <motion.div
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 via-yellow-100 to-purple-200 shadow-lg border-2 border-yellow-300/50 flex items-center justify-center"
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Halo */}
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-3 rounded-full border-2 border-yellow-400"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.3), transparent)"
          }}
        />
        
        {/* Face */}
        <div className="relative">
          {/* Eyes */}
          <div className="flex gap-3 mb-1">
            <motion.div 
              className="w-2.5 h-2.5 bg-slate-800 rounded-full"
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
            <motion.div 
              className="w-2.5 h-2.5 bg-slate-800 rounded-full"
              animate={{ scaleY: [1, 0.2, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
          </div>
          
          {/* Smile */}
          <motion.div
            className="w-4 h-2 border-b-2 border-pink-400 rounded-b-full mx-auto"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Blush */}
          <div className="absolute top-2 -left-3 w-2 h-1.5 bg-pink-300/60 rounded-full" />
          <div className="absolute top-2 -right-3 w-2 h-1.5 bg-pink-300/60 rounded-full" />
        </div>
        
        {/* Wings */}
        <motion.div
          className="absolute -left-4 top-3"
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="w-5 h-8 bg-gradient-to-r from-white to-yellow-100 rounded-full opacity-80 shadow-sm" 
               style={{ transform: "rotate(-15deg)" }} />
        </motion.div>
        <motion.div
          className="absolute -right-4 top-3"
          animate={{ rotate: [5, -5, 5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="w-5 h-8 bg-gradient-to-l from-white to-yellow-100 rounded-full opacity-80 shadow-sm"
               style={{ transform: "rotate(15deg)" }} />
        </motion.div>
      </motion.div>
      
      {/* Sparkles */}
      <motion.div
        className="absolute top-1 right-2"
        animate={{ 
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5]
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
      >
        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
      </motion.div>
      <motion.div
        className="absolute bottom-2 left-2"
        animate={{ 
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5]
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
      >
        <Sparkles className="w-3 h-3 text-pink-400" />
      </motion.div>
      <motion.div
        className="absolute top-3 left-0"
        animate={{ 
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5]
        }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
      >
        <Star className="w-2 h-2 text-purple-400 fill-purple-400" />
      </motion.div>
    </motion.div>
  );
}

export default Angel2DFallback;
