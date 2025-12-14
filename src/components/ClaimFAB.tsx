import { motion, AnimatePresence } from "framer-motion";
import { Diamond, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useState } from "react";

export const ClaimFAB = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canClaimDailyCheckin } = useWeb3Rewards();
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
      className="fixed bottom-24 md:bottom-8 left-4 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
    >
      {/* Sparkle particles */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                initial={{ 
                  x: 28, 
                  y: 28, 
                  scale: 0, 
                  opacity: 1 
                }}
                animate={{ 
                  x: 28 + Math.cos(i * 60 * Math.PI / 180) * 50,
                  y: 28 + Math.sin(i * 60 * Math.PI / 180) * 50,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: 0.8,
                  delay: i * 0.05
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleClick}
          className="relative h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 shadow-2xl hover:shadow-[0_0_40px_rgba(168,85,247,0.6)] transition-all duration-300"
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-cyan-500/50"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Diamond icon */}
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              y: [0, -2, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Diamond className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </motion.div>

          {/* Badge - Claim indicator */}
          {canClaimDailyCheckin && (
            <motion.div
              className="absolute -top-1 -right-1 w-6 h-6 md:w-7 md:h-7 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg"
              animate={{
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-900" />
            </motion.div>
          )}
        </Button>

        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
            >
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold shadow-xl">
                <div className="flex items-center gap-2">
                  <Diamond className="w-4 h-4" />
                  <span>Claim 50K CAMLY!</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
