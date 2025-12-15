import { motion, AnimatePresence } from "framer-motion";
import { Diamond, Sparkles, Gift, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useClaimToWallet } from "@/hooks/useClaimToWallet";
import { useState } from "react";

export const ClaimFAB = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canClaimDailyCheckin, camlyBalance } = useWeb3Rewards();
  const { isConnected, openWalletModal, hasClaimed } = useClaimToWallet();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // If wallet not connected, open modal first
    if (!isConnected) {
      await openWalletModal();
      return;
    }
    
    navigate('/claim');
  };

  return (
    <motion.div
      className="fixed bottom-24 md:bottom-8 left-4 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
    >
      {/* Floating diamonds around FAB */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`float-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: `${-10 + i * 25}px`,
            top: `${-15 + (i % 2) * 80}px`,
          }}
          animate={{
            y: [0, -8, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          <Diamond className="w-3 h-3 text-yellow-400" />
        </motion.div>
      ))}

      {/* Sparkle particles on hover */}
      <AnimatePresence>
        {isHovered && (
          <>
            {[...Array(8)].map((_, i) => (
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
                  x: 28 + Math.cos(i * 45 * Math.PI / 180) * 60,
                  y: 28 + Math.sin(i * 45 * Math.PI / 180) * 60,
                  scale: [0, 1.2, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{ 
                  duration: 0.8,
                  delay: i * 0.04
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
          className="relative h-16 w-16 md:h-18 md:w-18 rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 shadow-2xl hover:shadow-[0_0_50px_rgba(168,85,247,0.7)] transition-all duration-300 border-2 border-white/30"
        >
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/60 via-pink-500/60 to-cyan-500/60"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Second ring */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500/40 via-orange-500/40 to-pink-500/40"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0, 0.4]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3
            }}
          />
          
          {/* Diamond icon */}
          <motion.div
            animate={{
              rotate: [0, 15, -15, 0],
              y: [0, -3, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Diamond className="w-7 h-7 md:w-8 md:h-8 text-white drop-shadow-lg" />
          </motion.div>

          {/* Badge - Claim indicator */}
          {canClaimDailyCheckin && (
            <motion.div
              className="absolute -top-2 -right-2 w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-white"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </motion.div>
          )}
        </Button>

        {/* Tooltip with balance */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: 10, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.9 }}
              className="absolute left-full ml-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
            >
              <div className="px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 text-white font-bold shadow-2xl border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <Diamond className="w-5 h-5 text-yellow-300" />
                  <span className="text-lg">Claim 50K CAMLY!</span>
                </div>
                {user && (
                  <div className="flex items-center gap-1 text-xs text-white/80">
                    <Gift className="w-3 h-3" />
                    <span>Balance: {camlyBalance.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};
