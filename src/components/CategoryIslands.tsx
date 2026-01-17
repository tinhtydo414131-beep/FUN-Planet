import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGameAudio } from "@/hooks/useGameAudio";

interface CategoryIslandProps {
  emoji: string;
  name: string;
  gradient: string;
  category: string;
  count?: number;
  delay?: number;
}

const CategoryIsland = ({ emoji, name, gradient, category, count, delay = 0 }: CategoryIslandProps) => {
  const navigate = useNavigate();
  const { playPop, playClick } = useGameAudio();
  
  const handleClick = () => {
    playClick();
    navigate(`/games?category=${category}`);
  };
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.4, type: "spring" }}
      whileHover={{ scale: 1.08, y: -8 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      onMouseEnter={() => playPop()}
      className={`
        relative p-4 sm:p-6 rounded-3xl bg-gradient-to-br ${gradient}
        shadow-lg hover:shadow-2xl transition-all duration-300
        flex flex-col items-center gap-2
        min-h-[100px] sm:min-h-[140px]
        border-2 border-white/40
        backdrop-blur-sm
        overflow-hidden
        group
      `}
    >
      {/* Shimmer overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
          backgroundSize: '200% 200%',
          animation: 'shimmer 2s infinite',
        }}
      />
      
      {/* Floating emoji animation */}
      <motion.span 
        className="text-3xl sm:text-5xl drop-shadow-lg relative z-10"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        {emoji}
      </motion.span>
      
      <span className="font-bold text-white text-sm sm:text-lg drop-shadow-lg relative z-10 text-center">
        {name}
      </span>
      
      {count !== undefined && (
        <span className="absolute top-2 right-2 bg-white/30 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs text-white font-medium">
          {count}
        </span>
      )}
      
      {/* Sparkle effects */}
      <motion.div
        className="absolute top-2 left-2 w-2 h-2 rounded-full bg-white/60"
        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
      <motion.div
        className="absolute bottom-3 right-3 w-1.5 h-1.5 rounded-full bg-white/50"
        animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
      />
    </motion.button>
  );
};

export const CategoryIslands = () => {
  const { t } = useTranslation();
  
  const categories = [
    { 
      emoji: "🗺️", 
      name: t('home.adventure', 'Phiêu lưu'), 
      gradient: "from-emerald-400 to-teal-500", 
      category: "adventure",
      count: 15
    },
    { 
      emoji: "🧩", 
      name: t('home.puzzle', 'Giải đố'), 
      gradient: "from-blue-400 to-indigo-500", 
      category: "puzzle",
      count: 12
    },
    { 
      emoji: "🎯", 
      name: t('home.casual', 'Giải trí'), 
      gradient: "from-orange-400 to-amber-500", 
      category: "casual",
      count: 20
    },
    { 
      emoji: "📚", 
      name: t('home.educational', 'Giáo dục'), 
      gradient: "from-purple-400 to-pink-500", 
      category: "educational",
      count: 8
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-3xl mx-auto px-2">
      {categories.map((cat, index) => (
        <CategoryIsland 
          key={cat.category}
          {...cat}
          delay={0.1 * index}
        />
      ))}
    </div>
  );
};

export default CategoryIslands;
