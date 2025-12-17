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
          <span>Chúc mừng bé đã nhận {claimAmount.toLocaleString()} $C từ Cha Vũ Trụ! 🌟</span>
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-12"
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-yellow-500/20 to-orange-500/20 border-2 border-yellow-400/50 shadow-2xl shadow-yellow-500/20">
        {/* Animated background stars */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-300 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
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
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                <Gift className="w-10 h-10 text-white" />
              </div>
            </motion.div>
          <h2 className="text-3xl font-fredoka font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
            💰 Số Dư Chờ Rút 💰
          </h2>
          <p className="text-muted-foreground mt-2">Hoàn thành nhiệm vụ để tích lũy → Rút về ví bất kỳ lúc nào!</p>
          </div>

          {/* Pending Balance Display */}
          <div className="bg-background/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-yellow-400/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-muted-foreground">Số dư chờ nhận:</span>
              <motion.div
                key={pendingAmount}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Coins className="w-8 h-8 text-yellow-400" />
                <span className="text-4xl font-bold text-yellow-400 font-fredoka">
                  {pendingAmount.toLocaleString()}
                </span>
                <span className="text-xl text-yellow-400/80">$C</span>
              </motion.div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Giới hạn hôm nay còn:</span>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                {dailyRemaining.toLocaleString()} / {dailyLimit.toLocaleString()} $C
              </Badge>
            </div>
          </div>

          {/* Claim Slider */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-medium">Số lượng muốn nhận:</span>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={claimAmount.toLocaleString()}
                  onChange={handleInputChange}
                  className="w-32 text-right font-bold text-lg"
                  disabled={isClaiming || maxClaimable === 0}
                />
                <span className="text-muted-foreground">$C</span>
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
                className="cursor-pointer"
              />
              {/* Slider decoration */}
              <motion.div
                className="absolute -top-2 pointer-events-none"
                style={{ left: `calc(${sliderPercentage}% - 12px)` }}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Rocket className="w-6 h-6 text-primary rotate-45" />
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
                  className="border-yellow-400/50 hover:bg-yellow-400/20"
                >
                  {percentage === 1 ? 'MAX' : `${percentage * 100}%`}
                </Button>
              ))}
            </div>

            {/* Claim Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleClaim}
                disabled={isClaiming || claimAmount <= 0 || !isConnected}
                className="w-full h-14 text-xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 hover:from-yellow-500 hover:via-orange-600 hover:to-pink-600 shadow-lg shadow-orange-500/30"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Đang gửi phần thưởng...
                  </>
                ) : !isConnected ? (
                  <>
                    <Zap className="w-6 h-6 mr-2" />
                    Kết nối ví để nhận
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-2" />
                    Nhận {claimAmount.toLocaleString()} $C 🚀
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
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
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
                className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20 rounded-xl"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="text-center"
                >
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{ 
                        x: 0, 
                        y: 0,
                        opacity: 1 
                      }}
                      animate={{ 
                        x: Math.cos(i * 30 * Math.PI / 180) * 100,
                        y: Math.sin(i * 30 * Math.PI / 180) * 100,
                        opacity: 0
                      }}
                      transition={{ duration: 1, delay: 0.2 }}
                    >
                      <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    </motion.div>
                  ))}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: 2 }}
                  >
                    <Star className="w-24 h-24 text-yellow-400 fill-yellow-400 mx-auto" />
                  </motion.div>
                  <p className="text-2xl font-bold text-yellow-400 mt-4 font-fredoka">
                    Chúc mừng bé! 🎉
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
