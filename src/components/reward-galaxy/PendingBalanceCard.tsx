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
  Zap
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
  onClaim: (amount: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
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
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-12"
    >
      {/* Outer glow effect */}
      <div className="relative">
        <div className="absolute -inset-2 rounded-[38px] bg-gradient-to-r from-[#FFD700]/40 via-[#FFEC8B]/20 to-[#FFD700]/40 blur-2xl" />
        
        {/* Metallic gold border - 3px thick */}
        <div className="absolute -inset-[3px] rounded-[36px] bg-gradient-to-br from-[#FFD700] via-[#FFF8DC] via-[#FFD700] via-[#DAA520] to-[#FFD700]" />
        <div className="absolute -inset-[2px] rounded-[35px] bg-gradient-to-tr from-[#DAA520] via-[#FFEC8B] via-[#FFD700] to-[#B8860B]" />
        
        {/* Glass card */}
        <div 
          className="relative rounded-[32px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 15px 50px rgba(255, 215, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        >
          {/* Animated gold stars background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${2 + Math.random() * 4}px`,
                  height: `${2 + Math.random() * 4}px`,
                  background: '#FFD700',
                  boxShadow: '0 0 10px #FFD700',
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.5, 1],
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </div>
          
          {/* Metallic shine overlay */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 30%, rgba(255,248,220,0.6) 45%, rgba(255,248,220,0.8) 50%, rgba(255,248,220,0.6) 55%, transparent 70%)',
            }}
          />
          
          {/* Bottom reflection */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/4 opacity-25 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,215,0,0.4), transparent)',
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
                {/* 3D Gold gift icon */}
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #DAA520, #B8860B)',
                    boxShadow: '0 10px 40px rgba(255, 215, 0, 0.6), inset 0 3px 6px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Shine on icon */}
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                    }}
                  />
                  <Gift className="w-12 h-12 text-white drop-shadow-lg relative z-10" />
                </div>
              </motion.div>
              
              <h2 
                className="text-4xl md:text-5xl font-fredoka font-bold mb-3"
                style={{
                  color: '#FFD700',
                  textShadow: '0 0 30px #FFD700, 0 3px 6px rgba(0,0,0,0.5)',
                }}
              >
                💰 Số Dư Chờ Rút 💰
              </h2>
              <p 
                className="text-xl md:text-2xl font-bold"
                style={{
                  color: '#FFFFFF',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                Hoàn thành nhiệm vụ để tích lũy → Rút về ví bất kỳ lúc nào!
              </p>
            </div>

            {/* Pending Balance Display */}
            <div 
              className="rounded-2xl p-6 mb-6 relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '2px solid rgba(255, 215, 0, 0.5)',
                boxShadow: '0 0 30px rgba(255, 215, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.6), transparent)',
                  width: '50%',
                }}
              />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span 
                  className="text-xl md:text-2xl font-bold"
                  style={{
                    color: '#FFFFFF',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
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
                  <Coins className="w-12 h-12 text-[#FFD700] drop-shadow-[0_0_20px_#FFD700]" />
                  <span 
                    className="text-5xl md:text-6xl font-bold font-fredoka"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 25px #FFD700, 0 3px 6px rgba(0,0,0,0.6)',
                    }}
                  >
                    {pendingAmount.toLocaleString()}
                  </span>
                  <span 
                    className="text-xl md:text-2xl font-bold"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 15px #FFD700, 0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    CAMLY
                  </span>
                </motion.div>
              </div>

              <div className="flex items-center justify-between relative z-10">
                <span 
                  className="text-lg md:text-xl font-bold"
                  style={{
                    color: '#FFFFFF',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  }}
                >
                  Giới hạn hôm nay còn:
                </span>
                <Badge
                  className="text-base px-4 py-1 font-bold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(129, 199, 132, 0.3))',
                    border: '1px solid rgba(76, 175, 80, 0.5)',
                    color: '#81C784',
                    boxShadow: '0 0 15px rgba(76, 175, 80, 0.2)',
                  }}
                >
                  {dailyRemaining.toLocaleString()} / {dailyLimit.toLocaleString()} CAMLY
                </Badge>
              </div>
            </div>

            {/* Claim Slider */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-lg">Số lượng muốn nhận:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={claimAmount.toLocaleString()}
                    onChange={handleInputChange}
                    className="w-36 text-right font-bold text-xl border-2 border-[#FFD700]/50 bg-white/10 text-[#FFD700] placeholder:text-[#FFD700]/50"
                    style={{
                      boxShadow: '0 0 15px rgba(255, 215, 0, 0.2)',
                    }}
                    disabled={isClaiming || maxClaimable === 0}
                    placeholder="0"
                  />
                  <span className="text-[#FFD700] font-bold text-sm">CAMLY</span>
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
                  className="cursor-pointer [&>span]:bg-gradient-to-r [&>span]:from-[#FFD700] [&>span]:to-[#FFAA00]"
                />
                {/* Slider decoration */}
                <motion.div
                  className="absolute -top-2 pointer-events-none"
                  style={{ left: `calc(${sliderPercentage}% - 12px)` }}
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Rocket className="w-7 h-7 text-[#FFD700] rotate-45 drop-shadow-[0_0_10px_#FFD700]" />
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
                      className="border-2 border-[#FFD700]/60 bg-[#FFD700]/10 hover:bg-[#FFD700]/30 text-[#FFD700] font-bold text-base"
                      style={{
                        boxShadow: '0 0 15px rgba(255, 215, 0, 0.15)',
                      }}
                    >
                      {percentage === 1 ? 'MAX' : `${percentage * 100}%`}
                    </Button>
                  </motion.div>
                ))}
              </div>

              {/* Claim Button - Glossy gold metal */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleClaim}
                  disabled={isClaiming || claimAmount <= 0 || !isConnected}
                  className="w-full h-16 text-2xl font-bold text-white border-0"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFF8DC 25%, #FFD700 50%, #DAA520 75%, #FFD700 100%)',
                    boxShadow: '0 8px 30px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.1)',
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
                    className="inline-flex items-center gap-2 text-base text-[#FFD700] hover:text-[#FFEC8B] font-medium"
                    style={{ textShadow: '0 0 10px rgba(255,215,0,0.3)' }}
                  >
                    <ExternalLink className="w-5 h-5" />
                    Xem giao dịch trên BscScan
                  </a>
                </motion.div>
              )}
            </div>

            {/* Success Animation Overlay - Gold fireworks */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center z-20 rounded-[32px]"
                  style={{
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-center relative"
                  >
                    {/* Gold fireworks */}
                    {[...Array(16)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        initial={{ 
                          x: 0, 
                          y: 0,
                          opacity: 1,
                          scale: 1,
                        }}
                        animate={{ 
                          x: Math.cos(i * 22.5 * Math.PI / 180) * 150,
                          y: Math.sin(i * 22.5 * Math.PI / 180) * 150,
                          opacity: 0,
                          scale: 0.5,
                        }}
                        transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                      >
                        <Star className="w-8 h-8 text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_15px_#FFD700]" />
                      </motion.div>
                    ))}
                    
                    {/* Central star */}
                    <motion.div
                      animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
                      transition={{ duration: 0.8, repeat: 2 }}
                    >
                      <Star 
                        className="w-32 h-32 mx-auto" 
                        style={{
                          fill: '#FFD700',
                          color: '#FFD700',
                          filter: 'drop-shadow(0 0 30px #FFD700)',
                        }}
                      />
                    </motion.div>
                    <p 
                      className="text-3xl font-bold mt-4 font-fredoka"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700, #FFF8DC, #FFD700)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.6))',
                      }}
                    >
                      Chúc mừng bé! 🎉
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
