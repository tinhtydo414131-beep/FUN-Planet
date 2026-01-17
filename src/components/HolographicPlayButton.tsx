import React from "react";
import { motion } from "framer-motion";
import { Play, Sparkles } from "lucide-react";
import { useGameAudio } from "@/hooks/useGameAudio";
import { useTranslation } from "react-i18next";

interface HolographicPlayButtonProps {
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export const HolographicPlayButton = ({ onClick, size = "lg" }: HolographicPlayButtonProps) => {
  const { t } = useTranslation();
  const { playClick, playPop } = useGameAudio();

  const sizeClasses = {
    sm: "w-32 h-16",
    md: "w-48 h-20",
    lg: "w-56 h-24 sm:w-64 sm:h-28",
  };

  const handleClick = () => {
    playClick();
    onClick();
  };

  const handleHover = () => {
    playPop();
  };

  return (
    <motion.button
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      onMouseEnter={handleHover}
      className={`relative ${sizeClasses[size]} group`}
    >
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'linear-gradient(135deg, #F3C4FB 0%, #A2D2FF 50%, #CDB4DB 100%)',
          padding: '4px',
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(243, 196, 251, 0.5), 0 0 40px rgba(162, 210, 255, 0.3)',
            '0 0 40px rgba(243, 196, 251, 0.8), 0 0 60px rgba(162, 210, 255, 0.5)',
            '0 0 20px rgba(243, 196, 251, 0.5), 0 0 40px rgba(162, 210, 255, 0.3)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Inner button */}
        <div 
          className="w-full h-full rounded-full flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #E879F9 0%, #A855F7 50%, #8B5CF6 100%)',
          }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['-200% 0', '200% 0'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Sparkles */}
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white/80 absolute left-3 sm:left-4 animate-pulse" />
          
          {/* Play icon */}
          <motion.div
            animate={{ x: [0, 3, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white fill-white ml-1" />
          </motion.div>
          
          {/* Text */}
          <span className="text-white font-black text-base sm:text-xl tracking-wide drop-shadow-lg relative z-10">
            {t('hero.playNow', 'CHƠI NGAY')}
          </span>
          
          {/* Sparkles right */}
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white/80 absolute right-3 sm:right-4 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
      </motion.div>
      
      {/* Floating particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-yellow-300"
          style={{
            left: `${20 + i * 30}%`,
            top: '-10px',
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.5, 1, 0.5],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity,
          }}
        />
      ))}
    </motion.button>
  );
};
