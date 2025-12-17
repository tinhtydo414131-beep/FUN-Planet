import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Star, Sparkles, Gift, Rocket } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface DailyLoginRewardPopupProps {
  isOpen: boolean;
  amount: number;
  onClose: () => void;
}

export function DailyLoginRewardPopup({ isOpen, amount, onClose }: DailyLoginRewardPopupProps) {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Play celebration sound
      audioRef.current = new Audio('/sounds/coin-collect.mp3');
      audioRef.current.play().catch(() => {});
    }
  }, [isOpen]);

  const handleClaimNow = () => {
    onClose();
    navigate('/reward-galaxy');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#0a1628] via-[#1a2847] to-[#0f1f3a] border-2 border-fun-cyan/30 overflow-hidden">
        <DialogTitle className="sr-only">Daily Login Reward</DialogTitle>
        
        {/* Falling Stars Animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ 
                top: -20, 
                left: `${Math.random() * 100}%`,
                opacity: 0 
              }}
              animate={{ 
                top: '120%',
                opacity: [0, 1, 1, 0],
                rotate: 360
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              <Star className="w-3 h-3 text-fun-yellow fill-fun-yellow" />
            </motion.div>
          ))}
        </div>

        <div className="relative z-10 text-center py-6">
          {/* Rotating Planet Icon */}
          <motion.div
            className="mx-auto mb-6 relative"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-fun-cyan via-fun-blue to-fun-purple flex items-center justify-center shadow-lg shadow-fun-cyan/50">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Calendar className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            
            {/* Orbiting sparkles */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-6 h-6 text-fun-yellow" />
            </motion.div>
          </motion.div>

          {/* Celebration Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-fredoka font-bold text-white mb-2">
              🎉 Chúc Mừng Check-in! 🎉
            </h2>
            <p className="text-fun-cyan text-lg mb-4">
              Congratulations on checking in today!
            </p>
          </motion.div>

          {/* Reward Amount */}
          <motion.div
            className="bg-gradient-to-r from-fun-yellow/20 via-fun-orange/20 to-fun-yellow/20 rounded-2xl p-6 mb-6 border border-fun-yellow/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Gift className="w-8 h-8 text-fun-yellow" />
              <span className="text-4xl font-fredoka font-bold bg-gradient-to-r from-fun-yellow to-fun-orange bg-clip-text text-transparent">
                +{amount.toLocaleString()}
              </span>
              <span className="text-2xl text-fun-yellow">$C</span>
            </div>
            <p className="text-fun-yellow/80 text-sm">
              Quà tặng từ Cha Vũ Trụ! 🌟
            </p>
            <p className="text-fun-cyan/60 text-xs mt-1">
              Gift from Father Universe!
            </p>
          </motion.div>

          {/* Message */}
          <motion.p
            className="text-gray-300 mb-6 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Phần thưởng đã được thêm vào <span className="text-fun-cyan font-semibold">Số Dư Chờ Nhận</span> của bạn!
          </motion.p>

          {/* Action Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Button
              onClick={handleClaimNow}
              className="bg-gradient-to-r from-fun-cyan via-fun-blue to-fun-purple hover:from-fun-cyan/80 hover:via-fun-blue/80 hover:to-fun-purple/80 text-white font-fredoka font-bold px-8 py-6 text-lg rounded-full shadow-lg shadow-fun-cyan/30 transform hover:scale-105 transition-all"
            >
              <Rocket className="w-5 h-5 mr-2" />
              Nhận Ngay tại Reward Galaxy
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
