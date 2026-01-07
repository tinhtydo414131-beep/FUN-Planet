import { motion } from "framer-motion";
import angelFairy from "@/assets/angel-fairy.png";

interface FloatingFairyProps {
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  showSparkles?: boolean;
}

/**
 * Beautiful Floating Fairy component with magical effects
 * Inspired by Fun Farm's fairy design
 */
export function FloatingFairy({ onClick, size = "md", showSparkles = true }: FloatingFairyProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const sparkleColors = [
    "#FFD700", // Gold
    "#FF69B4", // Hot Pink  
    "#87CEEB", // Sky Blue
    "#E6E6FA", // Lavender
    "#FFC0CB", // Pink
    "#98FB98", // Pale Green
    "#DDA0DD", // Plum
  ];

  // Create sparkles with varied properties
  const sparkles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 120 - 60,
    y: Math.random() * 120 - 60,
    scale: Math.random() * 0.6 + 0.3,
    duration: Math.random() * 2 + 1.5,
    delay: Math.random() * 3,
    color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
  }));

  // Fairy dust particles
  const fairyDust = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 60 - 30,
    startY: 20 + Math.random() * 20,
    duration: Math.random() * 2 + 2,
    delay: Math.random() * 2,
    size: Math.random() * 4 + 2,
    color: sparkleColors[Math.floor(Math.random() * sparkleColors.length)],
  }));

  // Rainbow light rays
  const lightRays = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    rotation: i * 30,
    delay: i * 0.08,
    color: sparkleColors[i % sparkleColors.length],
  }));

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} cursor-pointer select-none`}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Outer magical glow */}
      <motion.div
        className="absolute inset-[-30%] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255,182,193,0.5) 0%, rgba(255,215,0,0.3) 30%, rgba(135,206,235,0.2) 60%, transparent 80%)",
          filter: "blur(15px)",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rainbow light rays emanating from fairy */}
      {showSparkles && lightRays.map((ray) => (
        <motion.div
          key={`ray-${ray.id}`}
          className="absolute left-1/2 top-1/2 w-1 origin-bottom pointer-events-none"
          style={{
            height: size === "lg" ? "80px" : size === "md" ? "60px" : "45px",
            background: `linear-gradient(to top, ${ray.color}99, ${ray.color}33, transparent)`,
            transform: `translateX(-50%) rotate(${ray.rotation}deg)`,
            filter: "blur(3px)",
          }}
          animate={{
            opacity: [0.2, 0.6, 0.2],
            scaleY: [0.7, 1, 0.7],
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
          y: [-5, 5, -5],
          rotate: [-3, 3, -3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Wing glow effects - left wing */}
        <motion.div
          className="absolute -left-[25%] top-[20%] w-[40%] h-[60%] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at right, rgba(255,255,255,0.7) 0%, rgba(255,182,193,0.5) 30%, rgba(135,206,235,0.3) 60%, transparent 80%)",
            filter: "blur(8px)",
            borderRadius: "50%",
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scaleX: [0.8, 1.1, 0.8],
            x: [-3, 3, -3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Wing glow effects - right wing */}
        <motion.div
          className="absolute -right-[25%] top-[20%] w-[40%] h-[60%] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at left, rgba(255,255,255,0.7) 0%, rgba(255,182,193,0.5) 30%, rgba(135,206,235,0.3) 60%, transparent 80%)",
            filter: "blur(8px)",
            borderRadius: "50%",
          }}
          animate={{
            opacity: [0.4, 0.8, 0.4],
            scaleX: [0.8, 1.1, 0.8],
            x: [3, -3, 3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Halo glow above fairy */}
        <motion.div
          className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[50%] h-[20%] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(255,215,0,1) 0%, rgba(255,215,0,0.6) 40%, transparent 70%)",
            filter: "blur(4px)",
            borderRadius: "50%",
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scaleX: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main fairy image */}
        <motion.div
          className="relative w-full h-full overflow-hidden rounded-2xl"
          style={{
            boxShadow: `
              0 0 30px rgba(255,182,193,0.6),
              0 0 60px rgba(255,215,0,0.4),
              0 0 90px rgba(135,206,235,0.3)
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
      </motion.div>

      {/* Sparkles around fairy */}
      {showSparkles && sparkles.map((sparkle) => (
        <motion.div
          key={`sparkle-${sparkle.id}`}
          className="absolute left-1/2 top-1/2 pointer-events-none"
          style={{
            width: 8,
            height: 8,
            x: sparkle.x,
            y: sparkle.y,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, sparkle.scale, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: sparkle.duration,
            delay: sparkle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z"
              fill={sparkle.color}
              style={{
                filter: `drop-shadow(0 0 4px ${sparkle.color})`,
              }}
            />
          </svg>
        </motion.div>
      ))}

      {/* Fairy dust falling */}
      {showSparkles && fairyDust.map((dust) => (
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
            y: [dust.startY, dust.startY + 60, dust.startY + 100],
            opacity: [0, 1, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: dust.duration,
            delay: dust.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Floating magical elements */}
      {showSparkles && ["✨", "⭐", "💫", "🌟"].map((emoji, i) => (
        <motion.div
          key={`emoji-${i}`}
          className="absolute pointer-events-none text-base"
          style={{
            left: `${10 + i * 25}%`,
            top: i % 2 === 0 ? "-15%" : "90%",
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
    </motion.div>
  );
}

export default FloatingFairy;
