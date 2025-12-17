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
      
      const audio = new Audio('/sounds/coin-collect.mp3');
      audio.play().catch(() => {});

      toast.success(
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          <span>Chúc mừng bé đã nhận {claimAmount.toLocaleString()} $C từ Cha Vũ Trụ! 🌟</span>
        </div>
      );

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      {/* Golden glow border */}
      <div className="relative">
        <div 
          className="absolute -inset-[2px] rounded-[26px] opacity-80"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFEC8B, #FFD700, #FFAA00)',
            boxShadow: '0 0 40px rgba(255, 215, 0, 0.5)',
          }}
        />
        
        {/* Glassmorphism card */}
        <div 
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          {/* Inner glossy reflection */}
          <div 
            className="absolute inset-x-0 top-0 h-1/3 opacity-15 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)',
              borderRadius: '24px 24px 50% 50%',
            }}
          />

          {/* Animated golden particles background */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: '#FFD700',
                  boxShadow: '0 0 6px #FFD700',
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

          <CardContent className="relative z-10 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="inline-block mb-4"
              >
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FF8C00 100%)',
                    boxShadow: '0 0 40px rgba(255, 215, 0, 0.6), inset 0 2px 4px rgba(255,255,255,0.3)',
                  }}
                >
                  <Gift className="w-12 h-12 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                </div>
              </motion.div>
              <h2 
                className="text-3xl font-fredoka font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 30%, #FFD700 60%, #FFEC8B 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(255, 170, 0, 0.5))',
                }}
              >
                💰 Số Dư Chờ Rút 💰
              </h2>
              <p className="mt-2 text-lg" style={{ color: '#FFF8DC', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                Hoàn thành nhiệm vụ để tích lũy → Rút về ví bất kỳ lúc nào!
              </p>
            </div>

            {/* Pending Balance Display */}
            <div 
              className="rounded-2xl p-6 mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '2px solid rgba(255, 215, 0, 0.4)',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.15), inset 0 1px 1px rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium" style={{ color: '#FFF8DC' }}>Số dư chờ nhận:</span>
                <motion.div
                  key={pendingAmount}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Coins className="w-10 h-10 text-[#FFD700]" style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }} />
                  <span 
                    className="text-5xl font-bold font-fredoka"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FFEC8B 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(255, 170, 0, 0.5))',
                    }}
                  >
                    {pendingAmount.toLocaleString()}
                  </span>
                  <span className="text-2xl font-bold text-[#FFEC8B]">$C</span>
                </motion.div>
              </div>

              <div className="flex items-center justify-between text-base">
                <span style={{ color: '#FFF8DC' }}>Giới hạn hôm nay còn:</span>
                <Badge 
                  className="px-3 py-1 text-sm font-bold"
                  style={{
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(102, 187, 106, 0.3))',
                    border: '1px solid rgba(76, 175, 80, 0.5)',
                    color: '#90EE90',
                  }}
                >
                  {dailyRemaining.toLocaleString()} / {dailyLimit.toLocaleString()} $C
                </Badge>
              </div>
            </div>

            {/* Claim Slider */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-medium text-lg" style={{ color: '#FFF8DC' }}>Số lượng muốn nhận:</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={claimAmount.toLocaleString()}
                    onChange={handleInputChange}
                    className="w-36 text-right font-bold text-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '2px solid rgba(255, 215, 0, 0.4)',
                      color: '#FFEC8B',
                    }}
                    disabled={isClaiming || maxClaimable === 0}
                  />
                  <span style={{ color: '#FFEC8B' }} className="text-lg">$C</span>
                </div>
              </div>

              {/* Slider */}
              <div className="relative py-4">
                <Slider
                  value={[claimAmount]}
                  onValueChange={handleSliderChange}
                  max={maxClaimable}
                  step={1000}
                  disabled={isClaiming || maxClaimable === 0}
                  className="cursor-pointer"
                />
                <motion.div
                  className="absolute -top-2 pointer-events-none"
                  style={{ left: `calc(${sliderPercentage}% - 12px)` }}
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Rocket className="w-6 h-6 text-[#FFD700] rotate-45" style={{ filter: 'drop-shadow(0 0 4px #FFD700)' }} />
                </motion.div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2 flex-wrap justify-center">
                {[0.25, 0.5, 0.75, 1].map((percentage) => (
                  <Button
                    key={percentage}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickAmount(percentage)}
                    disabled={isClaiming || maxClaimable === 0}
                    className="font-bold"
                    style={{
                      background: 'rgba(255, 215, 0, 0.1)',
                      border: '2px solid rgba(255, 215, 0, 0.4)',
                      color: '#FFEC8B',
                    }}
                  >
                    {percentage === 1 ? 'MAX' : `${percentage * 100}%`}
                  </Button>
                ))}
              </div>

              {/* Claim Button - Diamond glow on hover */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={handleClaim}
                  disabled={isClaiming || claimAmount <= 0 || !isConnected}
                  className="w-full h-16 text-xl font-bold rounded-2xl relative overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 30%, #FF8C00 70%, #FFD700 100%)',
                    boxShadow: '0 0 30px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                  <span className="relative flex items-center justify-center gap-2">
                    {isClaiming ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        Đang gửi phần thưởng...
                      </>
                    ) : !isConnected ? (
                      <>
                        <Zap className="w-6 h-6" />
                        Kết nối ví để nhận
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-6 h-6" />
                        Nhận {claimAmount.toLocaleString()} $C 🚀
                      </>
                    )}
                  </span>
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
                    className="inline-flex items-center gap-1 text-sm hover:underline"
                    style={{ color: '#FFEC8B' }}
                  >
                    <ExternalLink className="w-4 h-4" />
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
                  className="absolute inset-0 flex items-center justify-center z-20 rounded-3xl"
                  style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="text-center relative"
                  >
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: '50%', top: '50%' }}
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{ 
                          x: Math.cos(i * 30 * Math.PI / 180) * 100,
                          y: Math.sin(i * 30 * Math.PI / 180) * 100,
                          opacity: 0
                        }}
                        transition={{ duration: 1, delay: 0.2 }}
                      >
                        <Star className="w-6 h-6 text-[#FFD700] fill-[#FFD700]" style={{ filter: 'drop-shadow(0 0 6px #FFD700)' }} />
                      </motion.div>
                    ))}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, repeat: 2 }}
                    >
                      <Star className="w-28 h-28 text-[#FFD700] fill-[#FFD700] mx-auto" style={{ filter: 'drop-shadow(0 0 20px #FFD700)' }} />
                    </motion.div>
                    <p 
                      className="text-3xl font-bold mt-4 font-fredoka"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700, #FFEC8B)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
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
