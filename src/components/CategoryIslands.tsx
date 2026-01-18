import { motion } from "framer-motion";
import { Brain, Compass, Palette, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameAudio } from "@/hooks/useGameAudio";

interface Island {
  id: string;
  icon: typeof Brain;
  labelKey: string;
  emoji: string;
  gradient: string;
  shadowColor: string;
  borderGlow: string;
  route: string;
  soundFreq: number;
  soundType: OscillatorType;
  soundDuration: number;
  gameCount: number;
}

const islands: Island[] = [
  {
    id: "puzzle",
    icon: Brain,
    labelKey: "categoryIslands.puzzle",
    emoji: "🧩",
    gradient: "from-blue-300 to-blue-400",
    shadowColor: "rgba(96, 165, 250, 0.5)",
    borderGlow: "rgba(96, 165, 250, 0.8)",
    route: "/games?category=puzzle",
    soundFreq: 1200,
    soundType: "sine",
    soundDuration: 0.15,
    gameCount: 12,
  },
  {
    id: "adventure",
    icon: Compass,
    labelKey: "categoryIslands.adventure",
    emoji: "🗺️",
    gradient: "from-pink-300 to-pink-400",
    shadowColor: "rgba(249, 168, 212, 0.5)",
    borderGlow: "rgba(249, 168, 212, 0.8)",
    route: "/games?category=adventure",
    soundFreq: 600,
    soundType: "triangle",
    soundDuration: 0.2,
    gameCount: 15,
  },
  {
    id: "create",
    icon: Palette,
    labelKey: "categoryIslands.create",
    emoji: "🎨",
    gradient: "from-purple-300 to-purple-400",
    shadowColor: "rgba(192, 132, 252, 0.5)",
    borderGlow: "rgba(192, 132, 252, 0.8)",
    route: "/games?category=creative",
    soundFreq: 1000,
    soundType: "sine",
    soundDuration: 0.1,
    gameCount: 8,
  },
  {
    id: "rewards",
    icon: Gift,
    labelKey: "categoryIslands.rewards",
    emoji: "🎁",
    gradient: "from-pink-200 to-rose-300",
    shadowColor: "rgba(251, 113, 133, 0.5)",
    borderGlow: "rgba(251, 113, 133, 0.8)",
    route: "/reward-galaxy",
    soundFreq: 880,
    soundType: "sine",
    soundDuration: 0.25,
    gameCount: 0, // Special - shows stars instead
  },
];

export const CategoryIslands = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { playSound } = useGameAudio();

  const handleIslandClick = (island: Island) => {
    // Play unique sound for each island
    playSound(island.soundFreq, island.soundDuration, island.soundType);
    navigate(island.route);
  };

  return (
    <section 
      className="py-8 md:py-16 px-4"
      role="navigation"
      aria-label={t('categoryIslands.navigationLabel', 'Game Categories Navigation')}
    >
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
            {t('categoryIslands.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('categoryIslands.subtitle')}
          </p>
        </motion.div>

        {/* Islands Grid - accessible list */}
        <div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
          role="list"
          aria-label={t('categoryIslands.gridLabel', 'Game categories')}
        >
          {islands.map((island, index) => {
            const IconComponent = island.icon;
            
            return (
              <motion.button
                key={island.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{
                  y: -12,
                  scale: 1.08,
                  rotateX: 10,
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleIslandClick(island)}
                className={`
                  relative overflow-hidden
                  rounded-3xl
                  bg-gradient-to-br ${island.gradient}
                  backdrop-blur-sm
                  border-2 border-white/40
                  hover:border-transparent
                  p-4 md:p-6
                  cursor-pointer
                  group
                  touch-manipulation
                  active:scale-95
                  transition-all duration-300
                `}
                style={{
                  perspective: "1000px",
                  transformStyle: "preserve-3d",
                  boxShadow: `
                    0 20px 40px ${island.shadowColor},
                    0 0 60px ${island.shadowColor},
                    inset 0 1px 0 rgba(255,255,255,0.5)
                  `,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderImage = 'linear-gradient(135deg, #F3C4FB, #A2D2FF, #CDB4DB, #F3C4FB) 1';
                  e.currentTarget.style.boxShadow = `
                    0 20px 40px ${island.shadowColor},
                    0 0 60px ${island.shadowColor},
                    0 0 25px rgba(243, 196, 251, 0.5),
                    0 0 15px rgba(162, 210, 255, 0.4),
                    inset 0 1px 0 rgba(255,255,255,0.5)
                  `;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderImage = 'none';
                  e.currentTarget.style.boxShadow = `
                    0 20px 40px ${island.shadowColor},
                    0 0 60px ${island.shadowColor},
                    inset 0 1px 0 rgba(255,255,255,0.5)
                  `;
                }}
              >
                {/* Holographic shimmer overlay */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(
                      135deg,
                      transparent 0%,
                      rgba(255,255,255,0.4) 50%,
                      transparent 100%
                    )`,
                    animation: "shimmer 2s infinite",
                  }}
                />

                {/* Glass border glow on hover */}
                <div 
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    boxShadow: `inset 0 0 20px ${island.borderGlow}`,
                  }}
                />

                {/* Game count badge */}
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/80 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 shadow-sm">
                  {island.id === "rewards" ? "★★★" : `${island.gameCount} ${t('categoryIslands.games')}`}
                </span>

                {/* Island content */}
                <div className="relative z-10 flex flex-col items-center justify-center h-full min-h-[120px] md:min-h-[140px]">
                  {/* Emoji */}
                  <span className="text-4xl md:text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">
                    {island.emoji}
                  </span>

                  {/* Icon with glow */}
                  <div className="relative mb-2">
                    <IconComponent 
                      className="w-9 h-9 md:w-10 md:h-10 text-white drop-shadow-lg group-hover:scale-110 transition-transform duration-300" 
                    />
                    {/* Icon glow */}
                    <div 
                      className="absolute inset-0 blur-md opacity-50"
                      style={{ 
                        background: `radial-gradient(circle, ${island.borderGlow} 0%, transparent 70%)` 
                      }}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-sm md:text-base font-bold text-white drop-shadow-md text-center">
                    {t(island.labelKey)}
                  </span>

                  {/* Hover indicator */}
                  <span className="mt-1 text-xs text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {t('common.play')} →
                  </span>
                </div>

                {/* Floating particles effect on hover */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-white/60 rounded-full"
                      initial={{ 
                        x: Math.random() * 100, 
                        y: 100 + Math.random() * 20,
                        opacity: 0 
                      }}
                      animate={{ 
                        y: -20,
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5 + Math.random(),
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Add shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) rotate(45deg); }
          100% { transform: translateX(200%) rotate(45deg); }
        }
      `}</style>
    </section>
  );
};

export default CategoryIslands;
