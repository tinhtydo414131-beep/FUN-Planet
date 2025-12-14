import { motion } from "framer-motion";
import { Diamond, Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export const HeroClaimButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isVN = i18n.language === 'vi';
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate('/claim');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="relative mt-6"
    >
      {/* Floating diamonds around button */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${15 + i * 14}%`,
            top: i % 2 === 0 ? '-20px' : 'auto',
            bottom: i % 2 !== 0 ? '-20px' : 'auto',
          }}
          animate={{
            y: [0, -10, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          <Diamond className="w-4 h-4 text-yellow-400 opacity-60" />
        </motion.div>
      ))}

      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleClick}
          size="lg"
          className="relative px-8 py-6 text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 shadow-2xl shadow-purple-500/40 hover:shadow-purple-500/60 transition-all rounded-2xl border-2 border-white/20"
        >
          {/* Pulsing glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-orange-500/50"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative flex items-center gap-3">
            <motion.div
              animate={{ rotate: isHovered ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Diamond className="w-6 h-6" />
            </motion.div>
            
            <span>
              {isVN 
                ? 'Kết nối & Nhận 50K CAMLY Miễn phí! 🚀' 
                : 'Connect & Claim 50K CAMLY Free! 🚀'}
            </span>
            
            <motion.div
              animate={{
                x: [0, 5, 0],
                y: [0, -3, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            >
              <Rocket className="w-5 h-5" />
            </motion.div>
          </div>

          {/* Sparkle effects on hover */}
          {isHovered && (
            <>
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1, 0.5],
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 60,
                  }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>
              ))}
            </>
          )}
        </Button>
      </motion.div>
    </motion.div>
  );
};
