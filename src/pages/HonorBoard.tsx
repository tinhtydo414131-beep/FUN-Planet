import { Navigation } from "@/components/Navigation";
import { FunPlanetUnifiedBoard } from "@/components/FunPlanetUnifiedBoard";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Trophy, Star, Crown } from "lucide-react";

const HonorBoard = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-pink-50/30 to-white dark:from-slate-900 dark:via-purple-900/20 dark:to-slate-950">
      <Navigation />
      
      {/* Floating decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 10, 0]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-32 left-10 text-4xl opacity-30"
        >
          🌟
        </motion.div>
        <motion.div
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, -15, 0]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-16 text-3xl opacity-25"
        >
          👑
        </motion.div>
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-40 left-20 text-2xl opacity-20"
        >
          🏆
        </motion.div>
      </div>
      
      <main className="pt-24 sm:pt-28 pb-20 px-2 sm:px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="inline-flex items-center gap-2 sm:gap-3 mb-4">
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              {t('honorBoard.title', 'Bảng Vinh Danh')}
            </h1>
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-500" />
          </div>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            {t('honorBoard.subtitle', 'Những người chơi xuất sắc nhất của Fun Planet')}
          </p>
        </motion.div>
        
        {/* Main Board */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-6xl mx-auto"
        >
          <FunPlanetUnifiedBoard />
        </motion.div>
      </main>
      
      {/* Footer spacer for mobile nav */}
      <div className="h-20 md:h-0" />
    </div>
  );
};

export default HonorBoard;
