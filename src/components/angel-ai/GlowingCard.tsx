import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "purple" | "pink" | "blue" | "rainbow";
  animate?: boolean;
}

export const GlowingCard = ({
  children,
  className,
  glowColor = "purple",
  animate = true,
}: GlowingCardProps) => {
  const glowStyles = {
    purple: {
      border: "from-purple-500 via-pink-500 to-purple-500",
      shadow: "shadow-[0_0_30px_rgba(147,51,234,0.3)]",
      hoverShadow: "hover:shadow-[0_0_50px_rgba(147,51,234,0.5)]",
    },
    pink: {
      border: "from-pink-500 via-rose-400 to-pink-500",
      shadow: "shadow-[0_0_30px_rgba(236,72,153,0.3)]",
      hoverShadow: "hover:shadow-[0_0_50px_rgba(236,72,153,0.5)]",
    },
    blue: {
      border: "from-blue-500 via-cyan-400 to-blue-500",
      shadow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]",
      hoverShadow: "hover:shadow-[0_0_50px_rgba(59,130,246,0.5)]",
    },
    rainbow: {
      border: "from-purple-500 via-pink-500 via-amber-400 via-cyan-400 to-purple-500",
      shadow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]",
      hoverShadow: "hover:shadow-[0_0_50px_rgba(168,85,247,0.5)]",
    },
  };

  const style = glowStyles[glowColor];

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl p-[2px] overflow-hidden",
        style.shadow,
        style.hoverShadow,
        "transition-shadow duration-300",
        className
      )}
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5 }}
    >
      {/* Animated gradient border */}
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-r",
          style.border
        )}
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{
          backgroundSize: "200% 200%",
        }}
      />

      {/* Inner content with glassmorphism */}
      <div className="relative rounded-2xl bg-white/10 dark:bg-black/30 backdrop-blur-xl">
        {children}
      </div>
    </motion.div>
  );
};
