import React from "react";
import { motion } from "framer-motion";
import { Puzzle, Map, Palette, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameAudio } from "@/hooks/useGameAudio";
import { useTranslation } from "react-i18next";

interface CategoryIsland {
  id: string;
  name: string;
  nameKey: string;
  icon: React.ReactNode;
  gradient: string;
  glowColor: string;
  link: string;
  badge?: string;
}

const categories: CategoryIsland[] = [
  {
    id: "puzzle",
    name: "Trí Tuệ",
    nameKey: "puzzle",
    icon: <Puzzle className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white drop-shadow-lg" />,
    gradient: "from-[#A2D2FF] via-[#87CEEB] to-[#A2D2FF]",
    glowColor: "rgba(162, 210, 255, 0.6)",
    link: "/games?category=puzzle",
  },
  {
    id: "adventure",
    name: "Phiêu Lưu",
    nameKey: "adventure",
    icon: <Map className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white drop-shadow-lg" />,
    gradient: "from-[#F3C4FB] via-[#FFB6C1] to-[#F3C4FB]",
    glowColor: "rgba(243, 196, 251, 0.6)",
    link: "/games?category=adventure",
    badge: "HOT",
  },
  {
    id: "creative",
    name: "Sáng Tạo",
    nameKey: "creative",
    icon: <Palette className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white drop-shadow-lg" />,
    gradient: "from-[#CDB4DB] via-[#DDA0DD] to-[#CDB4DB]",
    glowColor: "rgba(205, 180, 219, 0.6)",
    link: "/games?category=creative",
    badge: "NEW",
  },
  {
    id: "rewards",
    name: "Phần Thưởng",
    nameKey: "rewards",
    icon: <Gift className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white drop-shadow-lg" />,
    gradient: "from-[#98F5E1] via-[#B4F8C8] to-[#98F5E1]",
    glowColor: "rgba(152, 245, 225, 0.6)",
    link: "/reward-galaxy",
    badge: "🎁",
  },
];

const CategoryIsland = ({ category, index }: { category: CategoryIsland; index: number }) => {
  const navigate = useNavigate();
  const { playPop } = useGameAudio();

  const handleClick = () => {
    playPop();
    navigate(category.link);
  };

  const handleHover = () => {
    playPop();
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1 + 0.2, type: "spring", stiffness: 200 }}
      whileHover={{ 
        y: -8, 
        scale: 1.05,
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      onMouseEnter={handleHover}
      className="relative group"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: category.glowColor }}
      />
      
      {/* Island Container */}
      <div
        className="relative rounded-2xl p-3 sm:p-4 md:p-6 overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          border: '3px solid transparent',
          backgroundImage: `linear-gradient(rgba(255,255,255,0.2), rgba(255,255,255,0.2)), linear-gradient(135deg, ${category.glowColor}, rgba(255,255,255,0.5), ${category.glowColor})`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        {/* 3D Effect layers */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-60 rounded-2xl`}
        />
        
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{
            background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
            backgroundSize: '200% 200%',
          }}
          animate={{
            backgroundPosition: ['200% 200%', '-200% -200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Badge */}
        {category.badge && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 + 0.5, type: "spring" }}
            className="absolute -top-1 -right-1 px-2 py-0.5 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full text-[10px] font-bold text-white shadow-lg"
          >
            {category.badge}
          </motion.div>
        )}
        
        {/* Icon */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <motion.div
            animate={{ 
              y: [0, -3, 0],
              rotate: [0, 3, -3, 0],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            {category.icon}
          </motion.div>
          
          {/* Category Name */}
          <span className="text-white font-bold text-xs sm:text-sm md:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            {category.name}
          </span>
        </div>
        
        {/* Bottom highlight */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3 rounded-b-2xl"
          style={{
            background: 'linear-gradient(to top, rgba(255,255,255,0.3), transparent)',
          }}
        />
      </div>
    </motion.button>
  );
};

export const CategoryIslands = () => {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {categories.map((category, index) => (
          <CategoryIsland key={category.id} category={category} index={index} />
        ))}
      </div>
    </div>
  );
};
