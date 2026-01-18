import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { FunPlanetUnifiedBoard } from "./FunPlanetUnifiedBoard";

export const HonorBoardSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-12 px-4 relative overflow-hidden">
      {/* Holographic pastel background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: 'linear-gradient(135deg, #F3C4FB 0%, #A2D2FF 25%, #CDB4DB 50%, #98F5E1 75%, #F3C4FB 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 15s ease infinite',
        }}
      />
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500">
              🏆 {t('honorBoard.title') || 'Honor Board'} 🏆
            </span>
          </h2>
          <p className="text-gray-600 text-lg">
            {t('honorBoard.subtitle') || 'Celebrating our amazing community'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <FunPlanetUnifiedBoard />
        </motion.div>
      </div>
    </section>
  );
};
