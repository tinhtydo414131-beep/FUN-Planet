import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Diamond, ExternalLink, Copy, CheckCircle2, Sparkles, PartyPopper, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useTranslation } from 'react-i18next';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useFullscreen } from '@/hooks/useFullscreen';

interface ClaimSuccessNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  txHash: string;
  amount: number;
  walletAddress?: string;
}

// Haptic feedback utility
const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success' = 'medium') => {
  if (!('vibrate' in navigator)) return;
  
  const patterns = {
    light: [10],
    medium: [30],
    heavy: [50],
    success: [50, 30, 50, 30, 100]
  };
  
  try {
    navigator.vibrate(patterns[pattern]);
  } catch (e) {
    // Vibration not supported
  }
};

// Play celebration sound at 528Hz (Love frequency)
const playCelebrationSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    // Main tone - 528Hz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(528, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 1.5);

    // Harmony - 660Hz (fifth)
    setTimeout(() => {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(660, ctx.currentTime);
      gain2.gain.setValueAtTime(0.2, ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 1);
    }, 200);

    // Sparkle - 880Hz
    setTimeout(() => {
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(880, ctx.currentTime);
      gain3.gain.setValueAtTime(0.15, ctx.currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start();
      osc3.stop(ctx.currentTime + 0.8);
    }, 400);
  } catch (e) {
    console.log('Audio not available');
  }
};

// Fire epic rainbow diamond confetti - ENHANCED
const fireRainbowConfetti = () => {
  const colors = ['#FFD700', '#FF69B4', '#00FFFF', '#FF6B00', '#8B5CF6', '#10B981', '#FF4444', '#44FF44'];
  
  // Center mega burst
  confetti({
    particleCount: 250,
    spread: 180,
    origin: { y: 0.5 },
    colors,
    shapes: ['circle', 'square'],
    scalar: 2,
    gravity: 0.6,
    ticks: 400
  });

  // Left burst
  setTimeout(() => {
    confetti({
      particleCount: 120,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.6 },
      colors,
      scalar: 1.5
    });
  }, 100);

  // Right burst
  setTimeout(() => {
    confetti({
      particleCount: 120,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.6 },
      colors,
      scalar: 1.5
    });
  }, 100);

  // Rain effect - top
  setTimeout(() => {
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0 },
      colors,
      gravity: 1.5,
      scalar: 1
    });
  }, 300);

  // Extra bursts for epic effect
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 360,
      origin: { x: 0.5, y: 0.4 },
      colors,
      scalar: 1.8,
      gravity: 0.5
    });
  }, 500);

  // Cannon shots from corners
  setTimeout(() => {
    confetti({ particleCount: 80, angle: 45, spread: 50, origin: { x: 0, y: 1 }, colors, scalar: 1.2 });
    confetti({ particleCount: 80, angle: 135, spread: 50, origin: { x: 1, y: 1 }, colors, scalar: 1.2 });
  }, 700);

  // Final sparkle burst
  setTimeout(() => {
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.6 },
      colors,
      scalar: 1.5,
      gravity: 0.8
    });
  }, 1000);
};

export const ClaimSuccessNotification = ({
  isOpen,
  onClose,
  txHash,
  amount,
  walletAddress
}: ClaimSuccessNotificationProps) => {
  const { i18n } = useTranslation();
  const isVN = i18n.language === 'vi';
  const [copied, setCopied] = useState(false);
  const { preferences, playNotificationSound } = useNotificationPreferences();

  useEffect(() => {
    if (isOpen) {
      // Play selected notification sound from settings
      if (preferences.soundEnabled) {
        playNotificationSound();
      }
      
      // Trigger confetti if enabled
      if (preferences.confettiEnabled) {
        fireRainbowConfetti();
        // Second wave
        setTimeout(() => fireRainbowConfetti(), 1500);
      }
      
      // Strong haptic feedback for success
      triggerHaptic('success');
    }
  }, [isOpen, preferences.soundEnabled, preferences.confettiEnabled, playNotificationSound]);

  const handleCopyTxHash = useCallback(() => {
    triggerHaptic('light');
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    toast.success(isVN ? 'Đã sao chép!' : 'Copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [txHash, isVN]);

  const handleButtonPress = useCallback((callback: () => void) => {
    triggerHaptic('medium');
    callback();
  }, []);

  const bscscanUrl = `https://bscscan.com/tx/${txHash}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleButtonPress(onClose)}>
      <DialogContent className="sm:max-w-md max-w-full w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-xl rounded-none border-0 sm:border-2 border-primary/50 bg-gradient-to-b from-background via-background to-primary/5 overflow-auto p-0 sm:p-6">
        {/* Mobile close button */}
        <button 
          onClick={() => handleButtonPress(onClose)}
          className="absolute top-4 right-4 z-50 sm:hidden p-2 rounded-full bg-muted/80 backdrop-blur-sm active:scale-95 transition-transform"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Animated background sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              initial={{ 
                x: Math.random() * 400, 
                y: Math.random() * 400,
                opacity: 0,
                scale: 0
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
                y: [Math.random() * 400, Math.random() * 200]
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        <div className="text-center py-8 sm:py-6 px-6 relative z-10 flex flex-col justify-center min-h-[100dvh] sm:min-h-0">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="relative inline-block mb-6"
          >
            {/* Glow ring */}
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.5, 0, 0.5]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 blur-xl"
            />
            
            {/* Main icon */}
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 flex items-center justify-center shadow-2xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              >
                <Diamond className="w-12 h-12 text-white" />
              </motion.div>
              
              {/* Checkmark badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-background"
              >
                <CheckCircle2 className="w-5 h-5 text-white" />
              </motion.div>
            </div>

            {/* Floating sparkles */}
            <motion.div
              animate={{ y: [-5, 5, -5], x: [-3, 3, -3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -left-2"
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
            <motion.div
              animate={{ y: [5, -5, 5], x: [3, -3, 3] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <PartyPopper className="w-6 h-6 text-pink-400" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-black mb-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent"
          >
            {isVN ? '🎉 Claim Thành Công!' : '🎉 Claim Successful!'}
          </motion.h2>

          {/* Amount */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <span className="text-4xl font-black text-yellow-500">
              +{amount.toLocaleString()}
            </span>
            <span className="text-xl text-muted-foreground ml-2">CAMLY</span>
          </motion.div>

          {/* Wallet info */}
          {walletAddress && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4"
            >
              <Wallet className="w-4 h-4" />
              <span>{walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}</span>
            </motion.div>
          )}

          {/* Transaction Hash */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-muted/50 rounded-xl p-4 mb-6"
          >
            <p className="text-xs text-muted-foreground mb-2">
              {isVN ? 'Transaction Hash' : 'Transaction Hash'}
            </p>
            <div className="flex items-center gap-2 justify-center">
              <code className="text-xs bg-background px-2 py-1 rounded font-mono">
                {txHash.slice(0, 16)}...{txHash.slice(-8)}
              </code>
              <button
                onClick={handleCopyTxHash}
                className="p-2 hover:bg-muted rounded-lg transition-all active:scale-90"
              >
                {copied ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </motion.div>

          {/* BscScan Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={() => handleButtonPress(() => window.open(bscscanUrl, '_blank'))}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold h-14 sm:h-12 text-base active:scale-[0.98] transition-transform"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              {isVN ? 'Xem trên BscScan' : 'View on BscScan'}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleButtonPress(onClose)}
              className="w-full h-14 sm:h-10 text-base active:scale-[0.98] transition-transform"
            >
              {isVN ? 'Đóng' : 'Close'}
            </Button>
          </motion.div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClaimSuccessNotification;
