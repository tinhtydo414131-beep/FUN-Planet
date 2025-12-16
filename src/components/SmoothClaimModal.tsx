import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Diamond, Wallet, ArrowRight, CheckCircle2, ExternalLink, 
  Shield, AlertCircle, Sparkles, Copy, Gift, PartyPopper, Star
} from 'lucide-react';
import { toast } from 'sonner';
import { useClaimToWallet } from '@/hooks/useClaimToWallet';
import { useWeb3Rewards } from '@/hooks/useWeb3Rewards';
import { CAMLY_CONTRACT_ADDRESS } from '@/lib/web3';
import { fireDiamondConfetti } from './DiamondConfetti';

interface SmoothClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  camlyBalance: number;
  onBalanceUpdate?: () => void;
}

export const SmoothClaimModal = ({
  isOpen,
  onClose,
  camlyBalance,
  onBalanceUpdate,
}: SmoothClaimModalProps) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success'>('input');
  const [txHash, setTxHash] = useState('');
  const [displayBalance, setDisplayBalance] = useState(camlyBalance);
  const [isMobile, setIsMobile] = useState(false);
  
  const { isClaiming, claimBalanceToWallet, celebrateClaim, triggerHaptic } = useClaimToWallet();
  const { walletAddress } = useWeb3Rewards();

  const claimAmount = parseFloat(amount) || 0;

  // Check if mobile
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Sync balance
  useEffect(() => {
    setDisplayBalance(camlyBalance);
  }, [camlyBalance]);

  // Heavy vibration for mobile celebration
  const heavyVibration = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 200, 50, 300, 50, 400]);
    }
  };

  // Play 528Hz celebration sound
  const playBlingSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(528, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2);
      }
    } catch (e) {
      console.log('Audio not available');
    }
  };

  // Big celebration effect
  const bigCelebration = () => {
    // Play sound
    playBlingSound();
    
    // Strong vibration on mobile
    if (isMobile) {
      heavyVibration();
    } else {
      triggerHaptic();
    }
    
    // Fire rainbow confetti multiple times
    fireDiamondConfetti('rainbow');
    setTimeout(() => fireDiamondConfetti('rainbow'), 300);
    setTimeout(() => fireDiamondConfetti('celebration'), 600);
    setTimeout(() => fireDiamondConfetti('reward'), 900);
    
    // Call hook celebration too
    celebrateClaim();
  };

  const handleClaim = async () => {
    if (isNaN(claimAmount) || claimAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (claimAmount > displayBalance) {
      toast.error('Số dư không đủ');
      return;
    }

    triggerHaptic();
    setStep('confirm');
  };

  const confirmClaim = async () => {
    triggerHaptic();
    setStep('processing');

    const result = await claimBalanceToWallet(claimAmount);
    
    if (result.success && result.txHash) {
      setTxHash(result.txHash);
      
      // Update balance immediately without reload
      setDisplayBalance(prev => prev - claimAmount);
      
      // Call parent to refresh balance
      onBalanceUpdate?.();
      
      // Big celebration!
      bigCelebration();
      
      setStep('success');
      
      // Show festive toast
      toast.success(
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-lg font-bold">
            <PartyPopper className="w-6 h-6 text-yellow-500" />
            <span>Chúc mừng bé! 🌟</span>
          </div>
          <p className="text-sm">{claimAmount.toLocaleString()} CAMLY đã về ví thật rồi nè!</p>
          <a 
            href={`https://bscscan.com/tx/${result.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" />
            Xem giao dịch thật trên BscScan nè!
          </a>
        </div>,
        { duration: 15000 }
      );
    } else {
      toast.error(result.error || 'Có lỗi xảy ra');
      setStep('input');
    }
  };

  const handleClose = () => {
    if (step === 'success') {
      // Don't reload, just close
      onBalanceUpdate?.();
    }
    setStep('input');
    setAmount('');
    setTxHash('');
    onClose();
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã copy!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 overflow-y-auto ${
        isMobile && step === 'success' 
          ? 'w-full h-full max-w-full max-h-full rounded-none' 
          : 'sm:max-w-lg max-h-[90vh]'
      }`}>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Diamond className="w-8 h-8 text-cyan-400 animate-pulse" />
            Rút CAMLY về Ví
          </DialogTitle>
          <DialogDescription className="text-center">
            Nhận tiền mượt mà, siêu nhanh! 🚀
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              {/* Balance display - realtime update */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Wallet className="w-4 h-4" />
                    Ví của bé
                  </span>
                  <motion.span 
                    key={displayBalance}
                    initial={{ scale: 1.2, color: '#22c55e' }}
                    animate={{ scale: 1, color: '#eab308' }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl font-bold"
                  >
                    {displayBalance.toLocaleString()} CAMLY
                  </motion.span>
                </div>
              </div>

              {/* Wallet address */}
              {walletAddress && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-muted">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Rút về:</span>
                  <span className="font-mono text-sm font-medium">{shortenAddress(walletAddress)}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 ml-auto"
                    onClick={() => copyToClipboard(walletAddress)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base">Số tiền muốn rút</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Nhập số CAMLY"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-20 text-xl h-14 font-bold"
                    max={camlyBalance}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 font-bold"
                    onClick={() => setAmount(camlyBalance.toString())}
                  >
                    MAX
                  </Button>
                </div>
                
                {claimAmount > camlyBalance && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Số dư không đủ
                  </p>
                )}
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[10000, 50000, 100000, 500000].filter(a => a <= camlyBalance).map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-bold"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    {quickAmount >= 1000 ? `${quickAmount / 1000}K` : quickAmount}
                  </Button>
                ))}
              </div>

              {/* Amount preview */}
              {claimAmount > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center"
                >
                  <p className="text-sm text-muted-foreground mb-1">Bạn sẽ nhận</p>
                  <p className="text-2xl font-bold text-primary">{claimAmount.toLocaleString()} CAMLY</p>
                </motion.div>
              )}

              {/* Security notice */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-blue-600 dark:text-blue-400">Giao dịch an toàn</p>
                  <p className="text-muted-foreground mt-1">
                    Ký xác nhận trong ví, không mất phí gas.
                  </p>
                </div>
              </div>

              {/* Claim button */}
              <Button
                onClick={handleClaim}
                disabled={!amount || claimAmount <= 0 || claimAmount > camlyBalance}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 shadow-xl active:scale-95 transition-all"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Tiếp tục
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Contract info */}
              <div className="text-xs text-center text-muted-foreground space-y-1">
                <p>CAMLY Token (BSC):</p>
                <a
                  href={`https://bscscan.com/token/${CAMLY_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                >
                  {shortenAddress(CAMLY_CONTRACT_ADDRESS)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 py-4 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                <Gift className="w-10 h-10 text-yellow-500" />
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Xác nhận rút tiền</h3>
                <p className="text-muted-foreground text-sm">
                  Bạn sẽ nhận <strong className="text-primary">{claimAmount.toLocaleString()} CAMLY</strong> vào ví
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('input')} 
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button 
                  onClick={confirmClaim}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Xác nhận
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center mb-6"
              >
                <Diamond className="w-10 h-10 text-cyan-400" />
              </motion.div>
              
              <h3 className="text-xl font-bold mb-2">Đang xử lý...</h3>
              <p className="text-muted-foreground text-sm">
                Vui lòng ký xác nhận trong ví của bạn
              </p>
              
              <div className="flex justify-center gap-1 mt-4">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-center space-y-6 ${isMobile ? 'py-12 px-4' : 'py-6'}`}
            >
              {/* Big animated success icon */}
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 8, stiffness: 100 }}
                className={`mx-auto rounded-full bg-gradient-to-br from-green-500/30 via-emerald-500/20 to-cyan-500/30 flex items-center justify-center shadow-2xl ${
                  isMobile ? 'w-36 h-36' : 'w-28 h-28'
                }`}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <PartyPopper className={`text-green-500 ${isMobile ? 'w-20 h-20' : 'w-16 h-16'}`} />
                </motion.div>
              </motion.div>

              {/* Floating stars animation */}
              <div className="relative h-8">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20, x: (i - 2) * 30 }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      y: [-10, -40, -60],
                      x: (i - 2) * 40
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity, 
                      delay: i * 0.2 
                    }}
                    className="absolute left-1/2"
                  >
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </motion.div>
                ))}
              </div>

              <div>
                <motion.h3 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3 ${
                    isMobile ? 'text-4xl' : 'text-3xl'
                  }`}
                >
                  🎉 Chúc mừng bé! 🎉
                </motion.h3>
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`text-muted-foreground ${isMobile ? 'text-xl' : 'text-lg'}`}
                >
                  <strong className="text-green-400 text-2xl">{claimAmount.toLocaleString()} CAMLY</strong>
                  <br />
                  đã về ví thật rồi nè! 🌟
                </motion.p>
              </div>

              {/* Updated balance display */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="p-4 rounded-2xl bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30"
              >
                <p className="text-sm text-muted-foreground mb-1">Ví của bé giờ còn</p>
                <motion.p
                  initial={{ scale: 1.5 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-green-400"
                >
                  {displayBalance.toLocaleString()} CAMLY
                </motion.p>
              </motion.div>

              {/* Transaction link - prominent */}
              {txHash && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  <a 
                    href={`https://bscscan.com/tx/${txHash}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button 
                      variant="outline" 
                      className="w-full h-14 text-lg border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
                    >
                      <ExternalLink className="w-5 h-5 mr-2" />
                      Xem giao dịch thật trên BscScan nè! 🔗
                    </Button>
                  </a>
                  
                  <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
                    <code className="font-mono bg-muted/30 px-2 py-1 rounded">{txHash.slice(0, 16)}...{txHash.slice(-8)}</code>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(txHash)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button 
                  onClick={handleClose} 
                  className={`w-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 shadow-xl ${
                    isMobile ? 'h-16 text-xl' : 'h-14 text-lg'
                  }`}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Tuyệt vời! Đóng thôi 🎊
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
