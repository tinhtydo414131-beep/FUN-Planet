import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-ai-avatar.png";

interface Angel2DFallbackProps {
  onClick?: () => void;
}

/**
 * 2D Fallback for AngelAI character
 * Uses beautiful chibi angel image with sparkle effects
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
      className="relative w-20 h-20 cursor-pointer select-none"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-[-20px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,215,0,0.4) 0%, rgba(255,182,193,0.2) 40%, transparent 70%)",
          filter: "blur(8px)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Light rays */}
      {rays.map((ray) => (
        <motion.div
          key={ray.id}
          className="absolute left-1/2 top-1/2 w-1 h-16 origin-bottom"
          style={{
            background: "linear-gradient(to top, rgba(255,215,0,0.6), transparent)",
            transform: `translateX(-50%) rotate(${ray.rotation}deg)`,
            filter: "blur(2px)",
          }}
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scaleY: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 2,
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
        {/* Halo glow behind */}
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-10 h-4 rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(255,215,0,0.9) 0%, rgba(255,215,0,0.4) 50%, transparent 70%)",
            filter: "blur(3px)",
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scaleX: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main angel image */}
        <motion.div
          className="relative w-full h-full rounded-full overflow-hidden"
          style={{
            boxShadow: `
              0 0 20px rgba(255,215,0,0.5),
              0 0 40px rgba(255,182,193,0.3),
              0 0 60px rgba(135,206,235,0.2),
              inset 0 0 20px rgba(255,255,255,0.3)
            `,
          }}
        >
          <img
            src={angelAvatar}
            alt="Angel AI"
            className="w-full h-full object-cover"
            style={{
              filter: "brightness(1.1) contrast(1.05) saturate(1.1)",
            }}
          />
          
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
              backgroundSize: "200% 200%",
            }}
            animate={{
              backgroundPosition: ["0% 0%", "200% 200%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>

        {/* Wing shimmer effects - left */}
        <motion.div
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-6 h-12"
          style={{
            background: "radial-gradient(ellipse at right, rgba(255,255,255,0.6) 0%, rgba(255,215,0,0.3) 40%, transparent 70%)",
            filter: "blur(4px)",
          }}
          animate={{
            opacity: [0.5, 0.9, 0.5],
            scaleX: [0.8, 1.2, 0.8],
            x: [-2, 2, -2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Wing shimmer effects - right */}
        <motion.div
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-12"
          style={{
            background: "radial-gradient(ellipse at left, rgba(255,255,255,0.6) 0%, rgba(255,215,0,0.3) 40%, transparent 70%)",
            filter: "blur(4px)",
          }}
          animate={{
            opacity: [0.5, 0.9, 0.5],
            scaleX: [0.8, 1.2, 0.8],
            x: [2, -2, 2],
          }}
          transition={{
            duration: 2,
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

      {/* Floating hearts/stars around */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`heart-${i}`}
          className="absolute pointer-events-none text-lg"
          style={{
            left: `${20 + i * 30}%`,
            top: "-10px",
          }}
          animate={{
            y: [-5, -15, -5],
            opacity: [0.6, 1, 0.6],
            scale: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            delay: i * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {i === 1 ? "⭐" : "✨"}
        </motion.div>
      ))}
    </motion.div>
  );
}

export default Angel2DFallback;
