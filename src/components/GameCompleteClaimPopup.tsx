import { motion, AnimatePresence } from "framer-motion";
import { Diamond, Sparkles, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { fireDiamondConfetti } from "./DiamondConfetti";
import { playRewardSound } from "./SoundEffects528Hz";

interface GameCompleteClaimPopupProps {
  isOpen: boolean;
  onClose: () => void;
  score?: number;
  gameName?: string;
  bonusAmount?: number;
}

export const GameCompleteClaimPopup = ({
  isOpen,
  onClose,
  score = 0,
  gameName = "the game",
  bonusAmount = 10000,
}: GameCompleteClaimPopupProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isVN = i18n.language === 'vi';
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      fireDiamondConfetti('celebration');
      playRewardSound();
    }
  }, [isOpen]);

  const handleClaim = () => {
    if (!user) {
      navigate('/auth');
    } else {
      navigate('/claim');
    }
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="relative w-full max-w-md bg-gradient-to-br from-background via-background to-purple-900/20 rounded-3xl border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 p-6 overflow-hidden"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Floating diamonds background */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  rotate: [0, 360],
                  scale: [0.5, 1, 0.5],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                }}
              >
                <Diamond className="w-4 h-4 text-purple-400" />
              </motion.div>
            ))}

            {/* Trophy icon */}
            <motion.div
              className="flex justify-center mb-4"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl shadow-yellow-500/30">
                <Trophy className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              className="text-2xl md:text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 text-transparent bg-clip-text"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {isVN ? '🎉 Chơi xuất sắc!' : '🎉 You played so well!'}
            </motion.h2>

            {/* Score display */}
            {score > 0 && (
              <motion.p
                className="text-center text-muted-foreground mb-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isVN ? `Điểm số: ${score.toLocaleString()}` : `Score: ${score.toLocaleString()}`}
              </motion.p>
            )}

            {/* Bonus display */}
            <motion.div
              className="text-center mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-lg text-muted-foreground mb-2">
                {isVN ? 'Nhận thưởng của bạn!' : 'Claim your bonus!'}
              </p>
              <div className="flex items-center justify-center gap-2">
                <Diamond className="w-6 h-6 text-yellow-400" />
                <span className="text-3xl font-bold text-yellow-400">
                  {bonusAmount.toLocaleString()} CAMLY
                </span>
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </motion.div>

            {/* Claim button */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                onClick={handleClaim}
                className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 shadow-xl shadow-purple-500/30 rounded-2xl"
              >
                <Diamond className="w-5 h-5 mr-2" />
                {isVN 
                  ? `Nhận ${bonusAmount.toLocaleString()} CAMLY ngay! 💎` 
                  : `Claim ${bonusAmount.toLocaleString()} CAMLY Now! 💎`}
              </Button>
            </motion.div>

            {/* Total rewards hint */}
            <motion.p
              className="text-center text-sm text-muted-foreground mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {isVN 
                ? '+ Xem tổng phần thưởng của bạn trên Dashboard!' 
                : '+ View your total rewards on the Dashboard!'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GameCompleteClaimPopup;
