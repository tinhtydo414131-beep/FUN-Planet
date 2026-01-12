import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Coins, 
  Sparkles, 
  Rocket, 
  Star,
  Loader2,
  ExternalLink,
  Gift,
  Zap,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { fireDiamondConfetti } from '@/components/DiamondConfetti';

interface PendingBalanceCardProps {
  pendingAmount: number;
  dailyRemaining: number;
  dailyLimit: number;
  walletAddress: string | null;
  isConnected: boolean;
  isClaiming: boolean;
  onClaim: (amount: number) => Promise<{ success: boolean; txHash?: string; error?: string; status?: 'completed' | 'pending_review' }>;
  onConnect: () => void;
}

export function PendingBalanceCard({
  pendingAmount,
  dailyRemaining,
  dailyLimit,
  walletAddress,
  isConnected,
  isClaiming,
  onClaim,
  onConnect
}: PendingBalanceCardProps) {
  const [claimAmount, setClaimAmount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const maxClaimable = Math.min(pendingAmount, dailyRemaining);
  const sliderPercentage = maxClaimable > 0 ? (claimAmount / maxClaimable) * 100 : 0;

  const handleSliderChange = (value: number[]) => {
    setClaimAmount(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/,/g, '')) || 0;
    setClaimAmount(Math.min(value, maxClaimable));
  };

  const handleClaim = async () => {
    if (!isConnected) {
      onConnect();
      return;
    }

    if (claimAmount <= 0) {
      toast.error('Vui lòng nhập số lượng muốn nhận!');
      return;
    }

    const result = await onClaim(claimAmount);

    if (result.success) {
      // Check if pending review (not auto-approved)
      if (result.status === 'pending_review') {
        // Show info toast instead of success
        toast.info(
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <span>Yêu cầu rút {claimAmount.toLocaleString()} CAMLY đang chờ admin duyệt. Bạn sẽ được thông báo khi hoàn tất! ⏳</span>
          </div>,
          { duration: 5000 }
        );
        // Reset amount but don't show celebration
        setClaimAmount(0);
        return;
      }
      
      // Auto-approved and completed - show celebration
      setShowSuccess(true);
      setLastTxHash(result.txHash || null);
      fireDiamondConfetti('celebration');
      
      // Play celebration sound
      const audio = new Audio('/sounds/coin-collect.mp3');
      audio.play().catch(() => {});

      toast.success(
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Chúc mừng bé đã nhận {claimAmount.toLocaleString()} Camly coin từ Cha Vũ Trụ! 🌟</span>
        </div>
      );

      // Reset after animation
      setTimeout(() => {
        setShowSuccess(false);
        setClaimAmount(0);
      }, 3000);
    } else {
      toast.error(result.error || 'Có lỗi xảy ra khi nhận thưởng');
    }
  };

  const setQuickAmount = (percentage: number) => {
    setClaimAmount(Math.floor(maxClaimable * percentage));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-12"
    >
      {/* Outer glow effect - soft for white theme */}
      <div className="relative">
        <motion.div 
          className="absolute -inset-3 rounded-[40px] bg-gradient-to-r from-yellow-300/30 via-pink-300/20 to-yellow-300/30 blur-2xl"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Gradient border - Yellow to Pink to Blue */}
        <div className="absolute -inset-[4px] rounded-[38px] bg-gradient-to-br from-yellow-400 via-pink-400 to-blue-400" />
        <div className="absolute -inset-[3px] rounded-[37px] bg-gradient-to-tr from-yellow-300 via-pink-300 to-blue-300" />
        
        {/* White card */}
        <div 
          className="relative rounded-[32px] overflow-hidden bg-white"
          style={{
            boxShadow: '0 15px 50px rgba(255, 182, 193, 0.2), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          {/* Animated pastel stars background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => {
              const colors = ['#FFD700', '#FF69B4', '#60A5FA'];
              const color = colors[i % 3];
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${2 + Math.random() * 3}px`,
                    height: `${2 + Math.random() * 3}px`,
                    background: color,
                    boxShadow: `0 0 8px ${color}40`,
                  }}
                  animate={{
                    opacity: [0.2, 0.7, 0.2],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              );
            })}
          </div>
          
          {/* Subtle shine overlay */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, rgba(255,215,0,0.15) 45%, rgba(255,215,0,0.25) 50%, rgba(255,215,0,0.15) 55%, transparent 70%)',
            }}
          />

          <CardContent className="relative z-10 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-block mb-4"
              >
                {/* Purple circle with money bag icon */}
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #A855F7 0%, #7E22CE 50%, #581C87 100%)',
                    boxShadow: '0 10px 40px rgba(168, 85, 247, 0.4), inset 0 3px 6px rgba(255,255,255,0.3), inset 0 -3px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Shine on icon */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                    }}
                  />
                  <Coins className="w-10 h-10 text-white drop-shadow-lg relative z-10" />
                </div>
              </motion.div>
              
              <h2 
                className="text-3xl md:text-4xl font-fredoka font-bold mb-3 tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FF69B4, #60A5FA)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                }}
              >
                💰 Số Dư Chờ Rút 💰
              </h2>
              <p 
                className="text-xl md:text-2xl font-fredoka font-semibold leading-relaxed"
                style={{
                  background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Hoàn thành nhiệm vụ để tích lũy → Rút về ví bất kỳ lúc nào!
              </p>
            </div>

            {/* Pending Balance Display */}
            <div 
              className="rounded-2xl p-6 mb-6 relative overflow-hidden bg-gradient-to-br from-yellow-50 to-pink-50"
              style={{
                border: '2px solid rgba(255, 215, 0, 0.4)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.1), inset 0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-15"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)',
                  width: '50%',
                }}
              />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span 
                  className="text-xl md:text-2xl font-fredoka font-bold tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Số dư chờ nhận:
                </span>
                <motion.div
                  key={pendingAmount}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-3"
                >
                  <Coins className="w-12 h-12 text-yellow-500" style={{ filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.5))' }} />
                  <span 
                    className="text-5xl md:text-6xl font-bold font-fredoka"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    }}
                  >
                    {pendingAmount.toLocaleString()}
                  </span>
                  <span 
                    className="text-xl md:text-2xl font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    CAMLY
                  </span>
                </motion.div>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <span 
                  className="text-xl md:text-2xl font-fredoka font-bold tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Giới hạn hôm nay còn:
                </span>
                <Badge
                  className="text-base px-4 py-1 font-bold bg-green-100 text-green-600 border border-green-300"
                >
                  {dailyRemaining.toLocaleString()} / {dailyLimit.toLocaleString()} CAMLY
                </Badge>
              </div>
            </div>

            {/* Claim Slider */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span 
                  className="font-fredoka font-bold text-xl tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Số lượng muốn nhận:
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={claimAmount.toLocaleString()}
                    onChange={handleInputChange}
                    className="w-36 text-right font-bold text-xl border-2 border-yellow-400/50 bg-yellow-50 text-yellow-700 placeholder:text-yellow-400/50"
                    style={{
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.1)',
                    }}
                    disabled={isClaiming || maxClaimable === 0}
                    placeholder="0"
                  />
                  <span className="text-yellow-600 font-bold text-sm">CAMLY</span>
                </div>
              </div>

              {/* Fun Slider */}
              <div className="relative py-4">
                <Slider
                  value={[claimAmount]}
                  onValueChange={handleSliderChange}
                  max={maxClaimable}
                  step={1000}
                  disabled={isClaiming || maxClaimable === 0}
                  className="cursor-pointer [&>span]:bg-gradient-to-r [&>span]:from-yellow-400 [&>span]:to-pink-400"
                />
                {/* Slider decoration */}
                <motion.div
                  className="absolute -top-2 pointer-events-none"
                  style={{ left: `calc(${sliderPercentage}% - 12px)` }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Rocket className="w-7 h-7 text-pink-500 rotate-45" style={{ filter: 'drop-shadow(0 0 6px #FF69B4)' }} />
                </motion.div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-3 flex-wrap justify-center">
                {[0.25, 0.5, 0.75, 1].map((percentage) => (
                  <motion.div key={percentage} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setQuickAmount(percentage)}
                      disabled={isClaiming || maxClaimable === 0}
                      className="border-2 border-yellow-400/60 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 font-bold text-base"
                      style={{
                        boxShadow: '0 0 10px rgba(255, 215, 0, 0.1)',
                      }}
                    >
                      {percentage === 1 ? 'MAX' : `${percentage * 100}%`}
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Claim Button - Gold gradient */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleClaim}
                  disabled={isClaiming || claimAmount <= 0 || !isConnected}
                  className="w-full h-16 text-2xl font-fredoka font-bold text-amber-900 border-0 tracking-wide"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 25%, #FFD700 50%, #DAA520 75%, #FFD700 100%)',
                    boxShadow: '0 8px 30px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.1)',
                    textShadow: '0 1px 2px rgba(255,255,255,0.3)',
                  }}
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="w-7 h-7 mr-3 animate-spin" />
                      Đang gửi phần thưởng...
                    </>
                  ) : !isConnected ? (
                    <>
                      <Zap className="w-7 h-7 mr-3" />
                      Kết nối ví để nhận
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-7 h-7 mr-3" />
                      Nhận {claimAmount.toLocaleString()} CAMLY 🚀
                    </>
                  )}
                </Button>
              </motion.div>

              {/* Last Transaction */}
              {lastTxHash && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <a
                    href={`https://bscscan.com/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-base text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Xem giao dịch trên BscScan
                  </a>
                </motion.div>
              )}
            </div>

            {/* Success Animation Overlay */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-20 rounded-[32px]"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ 
                        rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                        scale: { duration: 1, repeat: Infinity }
                      }}
                      className="mb-4"
                    >
                      <Star className="w-24 h-24 text-yellow-500 fill-yellow-400 mx-auto" style={{ filter: 'drop-shadow(0 0 20px #FFD700)' }} />
                    </motion.div>
                    <h3 
                      className="text-3xl font-fredoka font-bold mb-2"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700, #FF69B4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      🎉 Thành Công! 🎉
                    </h3>
                    <p 
                      className="text-xl font-fredoka"
                      style={{
                        background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Cha Vũ Trụ đã gửi phần thưởng!
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </div>
      </div>
    </motion.div>
  );
}
