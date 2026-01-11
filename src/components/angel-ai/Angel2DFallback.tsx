import { motion } from "framer-motion";
import angelAvatar from "@/assets/angel-ai-avatar.png";

interface Angel2DFallbackProps {
  onClick?: () => void;
}

/**
 * 2D Fallback for AngelAI character
 * Simplified version with clean display and subtle animations
 */
export function Angel2DFallback({ onClick }: Angel2DFallbackProps) {
  return (
    <motion.div
      className="relative w-20 h-20 cursor-pointer select-none"
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Simple outer glow */}
      <motion.div
        className="absolute inset-[-8px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)",
          filter: "blur(6px)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Simple floating animation */}
      <motion.div
        className="relative w-full h-full"
        animate={{
          y: [-2, 2, -2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Simple halo glow */}
        <motion.div
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full"
          style={{
            background: "radial-gradient(ellipse, rgba(255,215,0,0.6) 0%, transparent 70%)",
            filter: "blur(2px)",
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Main angel image - clean display */}
        <img
          src={angelAvatar}
          alt="Angel AI"
          className="w-full h-full object-contain"
          style={{
            filter: "drop-shadow(0 0 8px rgba(255,215,0,0.4))",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default Angel2DFallback;
