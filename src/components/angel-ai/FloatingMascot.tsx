import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface FloatingMascotProps {
  size?: "sm" | "md" | "lg";
}

export const FloatingMascot = ({ size = "md" }: FloatingMascotProps) => {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  const iconSize = {
    sm: 20,
    md: 28,
    lg: 40,
  };

  return (
    <motion.div
      className="relative"
      animate={{
        y: [0, -8, 0],
        rotateZ: [-2, 2, -2],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {/* Outer glow ring */}
      <motion.div
        className={`absolute inset-0 ${sizeClasses[size]} rounded-full`}
        animate={{
          boxShadow: [
            "0 0 20px rgba(147, 51, 234, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)",
            "0 0 30px rgba(236, 72, 153, 0.5), 0 0 60px rgba(147, 51, 234, 0.3)",
            "0 0 20px rgba(147, 51, 234, 0.4), 0 0 40px rgba(236, 72, 153, 0.2)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Halo ring */}
      <motion.div
        className={`absolute -inset-2 rounded-full border-2 border-white/20`}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main mascot container */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 p-0.5`}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center overflow-hidden">
          {/* Angel face */}
          <div className="relative flex flex-col items-center justify-center">
            {/* Halo */}
            <motion.div
              className="absolute -top-1 w-8 h-2 rounded-full bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300"
              animate={{
                opacity: [0.8, 1, 0.8],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                boxShadow: "0 0 10px rgba(253, 224, 71, 0.6)",
              }}
            />
            
            {/* Sparkle icon as face */}
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles 
                className="text-white drop-shadow-lg" 
                size={iconSize[size]} 
                strokeWidth={2.5}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Floating sparkles around */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-white rounded-full"
          style={{
            top: `${20 + Math.sin(i * 1.5) * 30}%`,
            left: `${20 + Math.cos(i * 1.5) * 30}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeInOut",
          }}
        />
      ))}
    </motion.div>
  );
};
