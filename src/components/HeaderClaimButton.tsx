import { motion, AnimatePresence } from "framer-motion";
import { Diamond, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useState } from "react";

export const HeaderClaimButton = () => {
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
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      {/* Sparkle effects */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.2, 0.5],
                  x: [0, (Math.random() - 0.5) * 30],
                  y: [0, -15 - Math.random() * 15],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <Sparkles className="w-3 h-3 text-yellow-400" />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      <Button
        onClick={handleClick}
        variant="outline"
        className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/30 transition-all"
      >
        <motion.div
          animate={{ rotate: isHovered ? 360 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <Diamond className="w-4 h-4 text-purple-400" />
        </motion.div>
        
        <span className="font-bold text-sm text-foreground">
          Claim Airdrop 💎
        </span>

        {canClaimDailyCheckin && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </Button>
    </motion.div>
  );
};
