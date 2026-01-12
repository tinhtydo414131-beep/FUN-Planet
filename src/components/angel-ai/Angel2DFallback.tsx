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
      className="relative w-14 h-14 md:w-16 md:h-16 cursor-pointer select-none"
      onClick={onClick}
      whileHover={{ scale: 1.08, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Purple outer glow */}
      <motion.div
        className="absolute inset-[-4px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(147,51,234,0.4) 0%, transparent 70%)",
          filter: "blur(4px)",
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
        {/* Project circular logo */}
        <img
          src={projectLogo}
          alt="Chat AI"
          className="w-full h-full object-cover rounded-full"
          style={{
            filter: "drop-shadow(0 0 8px rgba(147,51,234,0.5))",
            boxShadow: "0 0 16px rgba(147,51,234,0.4), 0 0 32px rgba(147,51,234,0.2)",
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default Angel2DFallback;
