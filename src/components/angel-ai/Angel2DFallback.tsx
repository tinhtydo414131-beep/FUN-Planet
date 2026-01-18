import { motion } from "framer-motion";

const projectLogo = "/logo-header-circular.png";

interface Angel2DFallbackProps {
  onClick?: () => void;
}

/**
 * Chat button using project's circular logo
 * Replaces the Angel AI avatar with consistent branding
 */
export function Angel2DFallback({ onClick }: Angel2DFallbackProps) {
  return (
    <motion.div
      className="relative w-[60px] h-[60px] md:w-20 md:h-20 cursor-pointer select-none"
      onClick={onClick}
      whileHover={{ scale: 1.08, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Holographic pink-purple outer glow */}
      <motion.div
        className="absolute inset-[-4px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(236,72,153,0.4) 0%, rgba(168,85,247,0.3) 50%, transparent 70%)",
          filter: "blur(5px)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating animation */}
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
        {/* Project circular logo with holographic glow */}
        <img
          src={projectLogo}
          alt="Chat AI"
          className="w-full h-full object-cover rounded-full"
          style={{
            filter: "drop-shadow(0 0 8px rgba(236,72,153,0.5))",
            boxShadow: "0 0 16px rgba(168,85,247,0.4), 0 0 32px rgba(236,72,153,0.2)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default Angel2DFallback;
