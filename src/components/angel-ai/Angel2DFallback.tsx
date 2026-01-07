import { motion } from "framer-motion";
import angelFairy from "@/assets/angel-fairy.png";

interface Angel2DFallbackProps {
  onClick?: () => void;
}

/**
 * 2D Fallback for AngelAI character - Fairy Style
 * Uses beautiful fairy image with rainbow sparkle effects
 */
export function Angel2DFallback({ onClick }: Angel2DFallbackProps) {
  // Generate sparkles with different colors
  const sparkleColors = [
    "#FFD700", // Gold
    "#FF69B4", // Hot Pink
    "#87CEEB", // Sky Blue
    "#98FB98", // Pale Green
    "#DDA0DD", // Plum
    "#FFA500", // Orange
    "#E6E6FA", // Lavender
  ];

  const sparkles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100 - 50,
    y: Math.random() * 100 - 50,
    scale: Math.random() * 0.5 + 0.3,
    duration: Math.random() * 2 + 1.5,
    delay: Math.random() * 2,
    color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
  }));

  // Light rays
  const rays = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    rotation: i * 45,
    delay: i * 0.1,
  }));

  return (
    <motion.div
      className="relative w-24 h-24 cursor-pointer select-none"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Outer magical glow ring */}
      <motion.div
        className="absolute inset-[-30%] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,182,193,0.5) 0%, rgba(255,215,0,0.3) 30%, rgba(135,206,235,0.2) 60%, transparent 80%)",
          filter: "blur(12px)",
        }}
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.5, 0.85, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rainbow light rays */}
      {rays.map((ray) => (
        <motion.div
          key={ray.id}
          className="absolute left-1/2 top-1/2 w-1 h-20 origin-bottom pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${sparkleColors[ray.id % sparkleColors.length]}99, ${sparkleColors[(ray.id + 1) % sparkleColors.length]}33, transparent)`,
            transform: `translateX(-50%) rotate(${ray.rotation}deg)`,
            filter: "blur(3px)",
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scaleY: [0.7, 1.1, 0.7],
          }}
          transition={{
            duration: 2.5,
            delay: ray.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main floating animation container */}
      <motion.div
        className="relative w-full h-full"
        animate={{
          y: [-3, 3, -3],
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Halo glow above fairy */}
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-5 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(255,215,0,1) 0%, rgba(255,215,0,0.5) 50%, transparent 70%)",
            filter: "blur(4px)",
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scaleX: [0.9, 1.15, 0.9],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main fairy image */}
        <motion.div
          className="relative w-full h-full rounded-2xl overflow-hidden"
          style={{
            boxShadow: `
              0 0 25px rgba(255,182,193,0.6),
              0 0 50px rgba(255,215,0,0.4),
              0 0 75px rgba(135,206,235,0.3)
            `,
          }}
        >
          <img
            src={angelFairy}
            alt="Angel Fairy"
            className="w-full h-full object-cover"
            style={{
              filter: "brightness(1.05) contrast(1.02) saturate(1.1)",
            }}
          />
          
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.5) 50%, transparent 80%)",
              backgroundSize: "300% 300%",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>

        {/* Wing glow effects - left */}
        <motion.div
          className="absolute -left-6 top-1/4 w-8 h-14 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at right, rgba(255,255,255,0.7) 0%, rgba(255,182,193,0.5) 30%, rgba(135,206,235,0.3) 60%, transparent 80%)",
            filter: "blur(6px)",
            borderRadius: "50%",
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scaleX: [0.8, 1.2, 0.8],
            x: [-3, 3, -3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Wing glow effects - right */}
        <motion.div
          className="absolute -right-6 top-1/4 w-8 h-14 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at left, rgba(255,255,255,0.7) 0%, rgba(255,182,193,0.5) 30%, rgba(135,206,235,0.3) 60%, transparent 80%)",
            filter: "blur(6px)",
            borderRadius: "50%",
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scaleX: [0.8, 1.2, 0.8],
            x: [3, -3, 3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Multi-colored sparkles */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: 6,
            height: 6,
            x: sparkle.x,
            y: sparkle.y,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, sparkle.scale, 0],
            y: [sparkle.y, sparkle.y - 20, sparkle.y - 40],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          {/* Star shape */}
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z"
              fill={sparkle.color}
              style={{
                filter: `drop-shadow(0 0 3px ${sparkle.color})`,
              }}
            />
          </svg>
        </motion.div>
      ))}

      {/* Floating magical elements */}
      {["✨", "⭐", "💫", "🌟"].map((emoji, i) => (
        <motion.div
          key={`emoji-${i}`}
          className="absolute pointer-events-none text-base"
          style={{
            left: `${5 + i * 25}%`,
            top: i % 2 === 0 ? "-15%" : "85%",
          }}
          animate={{
            y: i % 2 === 0 ? [-5, -15, -5] : [5, 15, 5],
            opacity: [0.5, 1, 0.5],
            scale: [0.7, 1, 0.7],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2.5,
            delay: i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Fairy dust particles falling */}
      {Array.from({ length: 10 }, (_, i) => ({
        id: i,
        x: Math.random() * 60 - 30,
        delay: Math.random() * 2,
        size: Math.random() * 4 + 2,
        color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
      })).map((dust) => (
        <motion.div
          key={`dust-${dust.id}`}
          className="absolute left-1/2 pointer-events-none rounded-full"
          style={{
            width: dust.size,
            height: dust.size,
            x: dust.x,
            background: `radial-gradient(circle, ${dust.color} 0%, transparent 70%)`,
            boxShadow: `0 0 ${dust.size * 2}px ${dust.color}`,
          }}
          animate={{
            y: [30, 80, 120],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: 2.5,
            delay: dust.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
    </motion.div>
  );
}

export default Angel2DFallback;
