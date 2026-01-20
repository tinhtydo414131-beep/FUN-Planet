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
      border: "from-[hsl(var(--holo-purple))] via-[hsl(var(--holo-pink))] to-[hsl(var(--holo-purple))]",
      shadow: "shadow-[0_0_30px_hsla(280,65%,80%,0.3)]",
      hoverShadow: "hover:shadow-[0_0_50px_hsla(280,65%,80%,0.5)]",
    },
    pink: {
      border: "from-[hsl(var(--holo-pink))] via-[hsl(340,70%,80%)] to-[hsl(var(--holo-pink))]",
      shadow: "shadow-[0_0_30px_hsla(340,70%,85%,0.3)]",
      hoverShadow: "hover:shadow-[0_0_50px_hsla(340,70%,85%,0.5)]",
    },
    blue: {
      border: "from-[hsl(var(--holo-blue))] via-[hsl(var(--holo-mint))] to-[hsl(var(--holo-blue))]",
      shadow: "shadow-[0_0_30px_hsla(200,70%,80%,0.3)]",
      hoverShadow: "hover:shadow-[0_0_50px_hsla(200,70%,80%,0.5)]",
    },
    rainbow: {
      border: "from-[hsl(var(--holo-pink))] via-[hsl(var(--holo-purple))] via-[hsl(var(--holo-blue))] via-[hsl(var(--holo-mint))] to-[hsl(var(--holo-pink))]",
      shadow: "shadow-[0_0_30px_hsla(280,65%,80%,0.3)]",
      hoverShadow: "hover:shadow-[0_0_50px_hsla(280,65%,80%,0.5)]",
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
