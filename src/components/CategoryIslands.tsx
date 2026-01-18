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

        {/* 3D Cube Grid */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
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
                className="relative group focus:outline-none touch-manipulation"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ 
                  opacity: 1, 
                  y: 0, 
                  transition: { 
                    delay: index * 0.1, 
                    duration: 0.5,
                    type: "spring",
                    stiffness: 100 
                  }
                }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
                viewport={{ once: true }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 3D Cube Container */}
                <div 
                  className="relative"
                  style={{ 
                    transform: 'rotateX(5deg) rotateY(-3deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Front Face - Main Card */}
                  <div
                    className={`relative w-full aspect-square rounded-2xl md:rounded-3xl bg-gradient-to-br ${island.gradient} transition-all duration-300 overflow-hidden`}
                    style={{
                      boxShadow: `0 8px 20px ${island.shadowColor}, inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 4px 12px rgba(255,255,255,0.25)`,
                      transform: 'translateZ(0)',
                    }}
                  >
                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
                    
                    {/* Inner glow effect on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at center, ${island.glowColor} 0%, transparent 70%)`,
                      }}
                    />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-3 p-3">
                      {/* Icon */}
                      <motion.div
                        className="relative"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.4 }}
                      >
                        <IconComponent 
                          className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.4)]" 
                          strokeWidth={1.5}
                        />
                      </motion.div>

                      {/* Label */}
                      <span className="text-white font-bold text-sm sm:text-base md:text-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] text-center leading-tight">
                        {t(island.labelKey)}
                      </span>

                      {/* "Mới" Badge - below label */}
                      {island.hasNewGames && (
                        <Badge 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] md:text-xs px-2 py-0.5 border-0 shadow-lg animate-pulse"
                        >
                          Mới
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right Side Face - 3D Depth */}
                  <div 
                    className="absolute top-0 right-0 w-2 md:w-3 h-full origin-left rounded-r-lg"
                    style={{ 
                      transform: 'rotateY(90deg) translateZ(0)',
                      background: `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.25))`,
                    }}
                  />

                  {/* Bottom Face - 3D Depth */}
                  <div 
                    className="absolute bottom-0 left-0 w-full h-2 md:h-3 origin-top rounded-b-lg"
                    style={{ 
                      transform: 'rotateX(-90deg) translateZ(0)',
                      background: `linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.25))`,
                    }}
                  />
                </div>

                {/* Floating Shadow */}
                <div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/15 blur-lg rounded-full transition-all duration-300 group-hover:w-[90%] group-hover:blur-xl group-hover:bg-black/20"
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
