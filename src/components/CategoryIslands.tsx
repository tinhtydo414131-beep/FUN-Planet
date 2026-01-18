import { motion } from "framer-motion";
import { Brain, Gamepad2, Palette, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameAudio } from "@/hooks/useGameAudio";
import { Badge } from "@/components/ui/badge";

interface Island {
  id: string;
  icon: typeof Brain;
  labelKey: string;
  gradient: string;
  shadowColor: string;
  glowColor: string;
  route: string;
  soundFreq: number;
  soundType: OscillatorType;
  hasNewGames?: boolean;
}

const islands: Island[] = [
  {
    id: "puzzle",
    icon: Brain,
    labelKey: "categoryIslands.puzzle",
    gradient: "from-pink-400 to-purple-500",
    shadowColor: "rgba(236, 72, 153, 0.4)",
    glowColor: "rgba(236, 72, 153, 0.6)",
    route: "/games?category=puzzle",
    soundFreq: 523.25,
    soundType: "sine",
    hasNewGames: true,
  },
  {
    id: "adventure",
    icon: Gamepad2,
    labelKey: "categoryIslands.adventure",
    gradient: "from-purple-400 to-pink-500",
    shadowColor: "rgba(168, 85, 247, 0.4)",
    glowColor: "rgba(168, 85, 247, 0.6)",
    route: "/games?category=adventure",
    soundFreq: 587.33,
    soundType: "triangle",
    hasNewGames: false,
  },
  {
    id: "create",
    icon: Palette,
    labelKey: "categoryIslands.create",
    gradient: "from-purple-400 to-blue-400",
    shadowColor: "rgba(162, 210, 255, 0.4)",
    glowColor: "rgba(162, 210, 255, 0.6)",
    route: "/games?category=creative",
    soundFreq: 659.25,
    soundType: "sine",
    hasNewGames: true,
  },
  {
    id: "rewards",
    icon: Gift,
    labelKey: "categoryIslands.rewards",
    gradient: "from-blue-300 to-pink-400",
    shadowColor: "rgba(243, 196, 251, 0.4)",
    glowColor: "rgba(243, 196, 251, 0.6)",
    route: "/reward-galaxy",
    soundFreq: 783.99,
    soundType: "sine",
    hasNewGames: false,
  },
];

// CSS hexagon clip path
const hexagonClipPath = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

export const CategoryIslands = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { playSound } = useGameAudio();

  const handleIslandClick = (island: Island) => {
    playSound(island.soundFreq, 0.15, island.soundType);
    navigate(island.route);
  };

  return (
    <section 
      className="py-6 md:py-12 px-2 md:px-4"
      role="navigation"
      aria-label={t('categoryIslands.navigationLabel', 'Game Categories Navigation')}
    >
      {/* Glassmorphism Container */}
      <div className="container mx-auto max-w-5xl bg-white/20 backdrop-blur-lg rounded-2xl md:rounded-3xl border border-white/30 p-4 md:p-8 shadow-xl">
        {/* Section Header */}
        <motion.h2 
          className="text-lg md:text-3xl font-bold text-center mb-4 md:mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('categoryIslands.title')}
        </motion.h2>

        {/* Hexagon Grid */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
          style={{ perspective: '1000px' }}
          role="list"
          aria-label={t('categoryIslands.gridLabel', 'Game categories')}
        >
          {islands.map((island, index) => {
            const IconComponent = island.icon;
            
            return (
              <motion.button
                key={island.id}
                onClick={() => handleIslandClick(island)}
                className="relative group focus:outline-none touch-manipulation active:scale-95 transition-transform"
                initial={{ opacity: 0, y: 30, rotateX: -15 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0, 
                  rotateX: 0,
                  transition: { 
                    delay: index * 0.1, 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100 
                  }
                }}
                whileHover={{ 
                  scale: 1.08,
                  rotateX: 10,
                  rotateY: -5,
                  z: 50,
                  transition: { duration: 0.3 }
                }}
                whileTap={{ scale: 0.95 }}
                viewport={{ once: true }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Hexagon Shape */}
                <div
                  className={`relative w-full aspect-[1/1.15] bg-gradient-to-br ${island.gradient} transition-all duration-300`}
                  style={{
                    clipPath: hexagonClipPath,
                    boxShadow: `0 10px 25px ${island.shadowColor}, inset 0 -8px 20px rgba(0,0,0,0.2), inset 0 8px 20px rgba(255,255,255,0.3)`,
                  }}
                >
                  {/* Inner glow effect on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      clipPath: hexagonClipPath,
                      background: `radial-gradient(circle at center, ${island.glowColor} 0%, transparent 70%)`,
                    }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 md:gap-3">
                    {/* Icon - smaller on mobile */}
                    <motion.div
                      className="relative"
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.4 }}
                    >
                      <IconComponent 
                        className="w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" 
                        strokeWidth={1.5}
                      />
                    </motion.div>

                    {/* Label - smaller on mobile */}
                    <span className="text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] text-center px-1 leading-tight">
                      {t(island.labelKey)}
                    </span>
                  </div>

                  {/* "Mới" Badge - positioned for mobile */}
                  {island.hasNewGames && (
                    <Badge 
                      className="absolute top-[8%] right-[5%] sm:top-[12%] sm:right-[8%] bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 border-0 shadow-lg animate-pulse"
                    >
                      Mới
                    </Badge>
                  )}
                </div>

                {/* 3D Shadow/Base effect */}
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[70%] h-4 bg-black/20 blur-md rounded-full transition-all duration-300 group-hover:w-[85%] group-hover:blur-lg"
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryIslands;
