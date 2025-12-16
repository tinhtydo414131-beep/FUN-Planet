import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Coins, X, Loader2, ExternalLink, PartyPopper, Star, Rocket } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useClaimReward } from '@/hooks/useClaimReward';
import { formatCamly, shortenAddress } from '@/lib/web3';
import confetti from 'canvas-confetti';

interface WelcomeRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const WelcomeRewardModal = ({ isOpen, onClose, onSuccess }: WelcomeRewardModalProps) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { claimReward, isClaiming, lastTxHash } = useClaimReward();
  
  const [claimSuccess, setClaimSuccess] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const BSC_CHAIN_ID = 56;
  const isCorrectChain = chainId === BSC_CHAIN_ID;

  // Preload audio
  useEffect(() => {
    audioRef.current = new Audio('/audio/rich-reward.mp3');
    audioRef.current.volume = 0.6;
  }, []);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const triggerBigConfetti = () => {
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const colors = ['#FFD700', '#FFA500', '#FF6B00', '#00D4FF', '#FF69B4', '#8B5CF6'];

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    (function frame() {
      confetti({
        particleCount: 7,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 7,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    })();

    // Extra burst from center
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 180,
        origin: { y: 0.5 },
        colors: colors,
      });
    }, 500);
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: BSC_CHAIN_ID });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const handleClaim = async () => {
    if (!isConnected || !address) return;

    if (!isCorrectChain) {
      await handleSwitchNetwork();
      return;
    }

    const result = await claimReward('welcome');
    
    if (result.success) {
      setClaimSuccess(true);
      playSound();
      triggerBigConfetti();
      onSuccess?.();
    }
  };

  const handleClose = () => {
    if (claimSuccess) {
      onClose();
      setClaimSuccess(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent">
        <AnimatePresence mode="wait">
          {!claimSuccess ? (
            <motion.div
              key="claim-form"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 rounded-3xl p-1"
            >
              <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 rounded-3xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 p-6 relative overflow-hidden">
                  {/* Animated background pattern */}
                  <motion.div
                    className="absolute inset-0 opacity-20"
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 100%'],
                    }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  />
                  
                  <div className="relative z-10 text-center text-white">
                    <motion.div
                      className="flex justify-center mb-3"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Gift className="w-10 h-10" />
                      </div>
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold mb-1">🎉 Chào Mừng! 🎉</h2>
                    <p className="text-sm text-white/90">Bạn đã kết nối ví thành công!</p>
                  </div>
                  
                  {/* Floating stars */}
                  <motion.div
                    className="absolute top-4 left-4"
                    animate={{ y: [0, -10, 0], rotate: [0, 180, 360] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Star className="w-5 h-5 text-yellow-200" fill="currentColor" />
                  </motion.div>
                  <motion.div
                    className="absolute bottom-4 right-4"
                    animate={{ y: [0, 10, 0], rotate: [0, -180, -360] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6 text-yellow-200" />
                  </motion.div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Reward Amount */}
                  <div className="text-center">
                    <motion.div
                      className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-4"
                      animate={{ 
                        boxShadow: [
                          '0 0 30px rgba(251, 191, 36, 0.4)',
                          '0 0 60px rgba(251, 191, 36, 0.7)',
                          '0 0 30px rgba(251, 191, 36, 0.4)',
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Coins className="w-12 h-12 text-white" />
                      </motion.div>
                    </motion.div>
                    
                    <p className="text-sm text-muted-foreground font-medium mb-2">
                      Phần Thưởng Chào Mừng của Bạn
                    </p>
                    <motion.div
                      className="text-5xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      50,000 CAMLY
                    </motion.div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ≈ $5.00 USD • Gửi trực tiếp vào ví của bạn!
                    </p>
                  </div>

                  {/* Wallet Info */}
                  {address && (
                    <div className="bg-white/50 dark:bg-black/20 rounded-xl p-3 text-center">
                      <p className="text-xs text-muted-foreground">Ví nhận thưởng</p>
                      <p className="font-mono text-sm font-medium">{shortenAddress(address)}</p>
                    </div>
                  )}

                  {/* Claim Button */}
                  {!isCorrectChain ? (
                    <Button
                      onClick={handleSwitchNetwork}
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl shadow-lg"
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      Chuyển sang BSC Network
                    </Button>
                  ) : (
                    <Button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full h-16 text-xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isClaiming ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                          Đang Nhận...
                        </>
                      ) : (
                        <>
                          <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                          >
                            <Gift className="w-6 h-6 mr-2" />
                          </motion.div>
                          🎁 Nhận 50K CAMLY Chào Mừng! 🚀
                        </>
                      )}
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    💜 Cảm ơn bạn đã tham gia FUN Planet!
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-3xl p-1"
            >
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 rounded-3xl p-8 text-center relative overflow-hidden">
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Success animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1, rotate: [0, 360] }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
                >
                  <PartyPopper className="w-12 h-12 text-white" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-green-700 dark:text-green-300 mb-3"
                >
                  🎊 Thành Công! 🎊
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-2 mb-6"
                >
                  <p className="text-lg text-muted-foreground">
                    Bạn đã nhận được
                  </p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                    +50,000 CAMLY
                  </p>
                  <p className="text-sm text-muted-foreground">
                    vào ví của bạn!
                  </p>
                </motion.div>

                {lastTxHash && (
                  <motion.a
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    href={`https://bscscan.com/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 underline"
                  >
                    Xem giao dịch trên BscScan
                    <ExternalLink className="w-4 h-4" />
                  </motion.a>
                )}

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mt-6"
                >
                  <Button
                    onClick={handleClose}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-8"
                  >
                    Bắt Đầu Chơi Game! 🎮
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeRewardModal;
