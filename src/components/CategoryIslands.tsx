import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameAudio } from "@/hooks/useGameAudio";
import { Badge } from "@/components/ui/badge";

interface Island {
  id: string;
  customIcon: React.ReactNode;
  labelKey: string;
  gradient: string;
  shadowColor: string;
  glowColor: string;
  route: string;
  soundFreq: number;
  soundType: OscillatorType;
  hasNewGames?: boolean;
}

// Custom styled icons matching reference image
const TiIcon = () => (
  <div className="text-white font-black text-2xl sm:text-3xl md:text-4xl drop-shadow-[0_4px_15px_rgba(0,0,0,0.4)] tracking-tight">
    Ti
  </div>
);

const GamepadDotsIcon = () => (
  <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
    {[1, 2, 3, 4].map((i) => (
      <div 
        key={i} 
        className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 rounded-full bg-white/90 shadow-lg"
        style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
      />
    ))}
  </div>
);

const WaveIcon = () => (
  <div className="flex items-end gap-0.5 sm:gap-1 h-8 sm:h-10 md:h-12">
    {[3, 5, 4, 6, 3].map((h, i) => (
      <div 
        key={i}
        className="w-1.5 sm:w-2 md:w-2.5 rounded-full bg-white/90"
        style={{ 
          height: `${h * 4}px`,
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}
      />
    ))}
  </div>
);

const ListIcon = () => (
  <div className="flex flex-col gap-1 sm:gap-1.5">
    {[1, 2, 3].map((i) => (
      <div 
        key={i} 
        className="h-1.5 sm:h-2 rounded-full bg-white/90"
        style={{ 
          width: i === 1 ? '28px' : i === 2 ? '22px' : '16px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
        }}
      />
    ))}
  </div>
);

const islands: Island[] = [
  {
    id: "puzzle",
    customIcon: <TiIcon />,
    labelKey: "categoryIslands.puzzle",
    gradient: "from-pink-400 to-pink-500", // Trí Tuệ: Hồng đậm
    shadowColor: "rgba(236, 72, 153, 0.4)",
    glowColor: "rgba(236, 72, 153, 0.5)",
    route: "/games?category=puzzle",
    soundFreq: 523.25,
    soundType: "sine",
    hasNewGames: true,
  },
  {
    id: "adventure",
    customIcon: <GamepadDotsIcon />,
    labelKey: "categoryIslands.adventure",
    gradient: "from-pink-400 via-purple-400 to-purple-500", // Khâu Lưu: Hồng tím
    shadowColor: "rgba(168, 85, 247, 0.4)",
    glowColor: "rgba(168, 85, 247, 0.5)",
    route: "/games?category=adventure",
    soundFreq: 587.33,
    soundType: "triangle",
    hasNewGames: false,
  },
  {
    id: "create",
    customIcon: <WaveIcon />,
    labelKey: "categoryIslands.create",
    gradient: "from-purple-400 via-blue-400 to-blue-500", // Sáng Tạo: Tím-xanh
    shadowColor: "rgba(162, 210, 255, 0.4)",
    glowColor: "rgba(162, 210, 255, 0.5)",
    route: "/games?category=creative",
    soundFreq: 659.25,
    soundType: "sine",
    hasNewGames: true,
  },
  {
    id: "rewards",
    customIcon: <ListIcon />,
    labelKey: "categoryIslands.rewards",
    gradient: "from-cyan-300 via-teal-400 to-blue-400", // Phần Thưởng: Xanh bạc hà
    shadowColor: "rgba(34, 211, 238, 0.4)",
    glowColor: "rgba(34, 211, 238, 0.5)",
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
      className="py-4 md:py-8 px-2 md:px-4"
      role="navigation"
      aria-label={t('categoryIslands.navigationLabel', 'Game Categories Navigation')}
    >
      {/* Seamless container - content floats on holographic background */}
      <div className="container mx-auto max-w-4xl py-4 md:py-8">
        {/* Section Header */}
        <motion.h2 
          className="text-lg md:text-2xl font-extrabold text-center mb-4 md:mb-6 text-gray-700"
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
          {islands.map((island, index) => (
            <motion.button
              key={island.id}
              onClick={() => handleIslandClick(island)}
              className="relative group focus:outline-none touch-manipulation"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ 
                opacity: 1, 
                y: 0, 
                transition: { 
                  delay: index * 0.1, 
                  duration: 0.4,
                  type: "spring",
                  stiffness: 120 
                }
              }}
              whileHover={{ 
                scale: 1.03,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.97 }}
              viewport={{ once: true }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* 3D Cube Container - smaller rotation on mobile */}
              <div 
                className="relative island-3d-cube"
                style={{ 
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Front Face - Main Card */}
                <div
                  className={`relative w-full aspect-square rounded-2xl md:rounded-3xl bg-gradient-to-br ${island.gradient} transition-all duration-300 overflow-hidden group-hover:scale-[1.02]`}
                  style={{
                    boxShadow: `0 10px 25px ${island.shadowColor}, inset 0 -3px 10px rgba(0,0,0,0.1), inset 0 3px 10px rgba(255,255,255,0.3)`,
                    transform: 'translateZ(6px)',
                  }}
                >
                  {/* Subtle glass overlay */}
                  <div className="absolute inset-0 bg-white/10" />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 md:gap-3 p-3">
                    {/* Custom Icon */}
                    <motion.div
                      className="relative"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {island.customIcon}
                    </motion.div>

                    {/* Label */}
                    <span className="text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] text-center leading-tight">
                      {t(island.labelKey)}
                    </span>

                    {/* "Mới" Badge - inline */}
                    {island.hasNewGames && (
                      <Badge 
                        className="bg-white/90 text-pink-600 text-[9px] md:text-[10px] px-2 py-0.5 border-0 shadow-sm font-bold"
                      >
                        Mới
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Right Side Face - 3D Depth - smaller on mobile */}
                <div 
                  className="absolute top-0 -right-[3px] md:-right-2 w-[3px] md:w-2 h-full origin-left rounded-r-xl"
                  style={{ 
                    background: 'linear-gradient(to bottom, rgba(255,255,255,0.2), rgba(0,0,0,0.15))',
                  }}
                />

                {/* Bottom Face - 3D Depth - smaller on mobile */}
                <div 
                  className="absolute -bottom-[3px] md:-bottom-2 left-0 w-full h-[3px] md:h-2 origin-top rounded-b-xl"
                  style={{ 
                    background: 'linear-gradient(to right, rgba(255,255,255,0.15), rgba(0,0,0,0.15))',
                  }}
                />
              </div>

              {/* Floating Shadow */}
              <div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[75%] h-3 bg-black/10 blur-md rounded-full transition-all duration-300 group-hover:w-[85%] group-hover:blur-lg"
              />
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryIslands;
