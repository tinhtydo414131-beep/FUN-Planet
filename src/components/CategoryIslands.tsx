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
      {/* Glassmorphism Container with Holographic Border */}
      <div 
        className="container mx-auto max-w-5xl bg-white/25 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl relative overflow-hidden"
        style={{
          border: '2px solid transparent',
          borderImage: 'linear-gradient(135deg, #F3C4FB, #A2D2FF, #CDB4DB, #F3C4FB) 1',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15), 0 0 40px rgba(243, 196, 251, 0.1)',
        }}
      >
        {/* Section Header */}
        <motion.h2 
          className="text-xl md:text-3xl font-extrabold text-center mb-5 md:mb-8 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent drop-shadow-sm"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t('categoryIslands.title')}
        </motion.h2>

        {/* 3D Cube Grid - Enhanced perspective */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8"
          style={{ perspective: '1200px' }}
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
                    transform: 'rotateX(8deg) rotateY(-5deg)',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Front Face - Main Card with Holographic Border */}
                  <div
                    className={`relative w-full aspect-square rounded-2xl md:rounded-3xl bg-gradient-to-br ${island.gradient} transition-all duration-300 overflow-hidden group-hover:scale-[1.02]`}
                    style={{
                      boxShadow: `0 12px 28px ${island.shadowColor}, 0 0 20px ${island.glowColor}, inset 0 -4px 12px rgba(0,0,0,0.15), inset 0 4px 12px rgba(255,255,255,0.35)`,
                      transform: 'translateZ(8px)',
                      borderImage: 'linear-gradient(135deg, #F3C4FB, #A2D2FF, #CDB4DB, #F3C4FB) 1',
                      border: '2px solid transparent',
                    }}
                  >
                    {/* Glass overlay with subtle shimmer */}
                    <div className="absolute inset-0 bg-white/15 backdrop-blur-[2px]" />
                    
                    {/* Holographic shimmer effect */}
                    <div 
                      className="absolute inset-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500"
                      style={{
                        background: 'linear-gradient(135deg, rgba(243,196,251,0.3) 0%, rgba(162,210,255,0.3) 50%, rgba(243,196,251,0.3) 100%)',
                        backgroundSize: '200% 200%',
                        animation: 'gradient-shift 4s ease infinite',
                      }}
                    />
                    
                    {/* Inner glow effect on hover */}
                    <div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(circle at center, ${island.glowColor} 0%, transparent 70%)`,
                      }}
                    />

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-3 p-3">
                      {/* Icon with enhanced shadow */}
                      <motion.div
                        className="relative"
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                      >
                        <IconComponent 
                          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white drop-shadow-[0_4px_15px_rgba(0,0,0,0.5)]" 
                          strokeWidth={1.5}
                        />
                      </motion.div>

                      {/* Label with enhanced styling */}
                      <span className="text-white font-extrabold text-sm sm:text-base md:text-lg drop-shadow-[0_3px_8px_rgba(0,0,0,0.5)] text-center leading-tight tracking-wide">
                        {t(island.labelKey)}
                      </span>

                      {/* "Mới" Badge - below label with glow */}
                      {island.hasNewGames && (
                        <Badge 
                          className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-[10px] md:text-xs px-2.5 py-0.5 border-0 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse"
                        >
                          ✨ Mới
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right Side Face - 3D Depth with holographic tint */}
                  <div 
                    className="absolute top-0 -right-2 md:-right-3 w-2 md:w-3 h-full origin-left rounded-r-xl"
                    style={{ 
                      background: `linear-gradient(to bottom, rgba(243,196,251,0.25), rgba(162,210,255,0.15), rgba(0,0,0,0.2))`,
                    }}
                  />

                  {/* Bottom Face - 3D Depth with holographic tint */}
                  <div 
                    className="absolute -bottom-2 md:-bottom-3 left-0 w-full h-2 md:h-3 origin-top rounded-b-xl"
                    style={{ 
                      background: `linear-gradient(to right, rgba(162,210,255,0.2), rgba(243,196,251,0.15), rgba(0,0,0,0.2))`,
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
