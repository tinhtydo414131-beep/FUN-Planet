import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Coins, 
  Sparkles, 
  Rocket, 
  Star,
  Loader2,
  ExternalLink,
  Gift,
  Zap,
  ChevronDown,
  ChevronUp,
  History,
  Gamepad2,
  Wallet,
  Users,
  Trophy,
  Calendar,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { fireDiamondConfetti } from '@/components/DiamondConfetti';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RewardHistoryItem } from '@/hooks/useUserRewards';

interface PendingBalanceCardProps {
  pendingAmount: number;
  dailyRemaining: number;
  dailyLimit: number;
  walletAddress: string | null;
  isConnected: boolean;
  isClaiming: boolean;
  onClaim: (amount: number) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  onConnect: () => void;
  rewardHistory?: RewardHistoryItem[];
  isLoadingHistory?: boolean;
  totalFromHistory?: number;
}

const getRewardIcon = (type: string) => {
  switch (type) {
    case 'first_wallet':
    case 'airdrop_claim':
      return <Wallet className="w-4 h-4" />;
    case 'game_completion':
    case 'first_game_play':
      return <Gamepad2 className="w-4 h-4" />;
    case 'referral_bonus':
      return <Users className="w-4 h-4" />;
    case 'ranking_reward':
      return <Trophy className="w-4 h-4" />;
    case 'daily_checkin':
      return <Calendar className="w-4 h-4" />;
    case 'game_upload':
      return <Upload className="w-4 h-4" />;
    case 'wallet_withdrawal':
      return <ExternalLink className="w-4 h-4" />;
    default:
      return <Gift className="w-4 h-4" />;
  }
};

const getRewardLabel = (type: string) => {
  switch (type) {
    case 'first_wallet':
      return 'Kết nối ví';
    case 'airdrop_claim':
      return 'Airdrop';
    case 'game_completion':
      return 'Hoàn thành game';
    case 'first_game_play':
      return 'Chơi game lần đầu';
    case 'referral_bonus':
      return 'Mời bạn bè';
    case 'ranking_reward':
      return 'Thưởng xếp hạng';
    case 'daily_checkin':
      return 'Điểm danh';
    case 'game_upload':
      return 'Upload game';
    case 'wallet_withdrawal':
      return 'Rút về ví';
    default:
      return type;
  }
};

const getRewardColor = (type: string) => {
  switch (type) {
    case 'first_wallet':
    case 'airdrop_claim':
      return 'from-purple-500 to-pink-500';
    case 'game_completion':
    case 'first_game_play':
      return 'from-cyan-500 to-blue-500';
    case 'referral_bonus':
      return 'from-pink-500 to-red-500';
    case 'ranking_reward':
      return 'from-yellow-500 to-orange-500';
    case 'daily_checkin':
      return 'from-green-500 to-emerald-500';
    case 'game_upload':
      return 'from-indigo-500 to-purple-500';
    case 'wallet_withdrawal':
      return 'from-gray-500 to-gray-600';
    default:
      return 'from-amber-500 to-yellow-500';
  }
};

export function PendingBalanceCard({
  pendingAmount,
  dailyRemaining,
  dailyLimit,
  walletAddress,
  isConnected,
  isClaiming,
  onClaim,
  onConnect,
  rewardHistory = [],
  isLoadingHistory = false,
  totalFromHistory = 0
}: PendingBalanceCardProps) {
  const [claimAmount, setClaimAmount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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

  // Filter to show only positive (earned) rewards for history
  const earnedRewards = rewardHistory.filter(item => item.amount > 0);

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

          {/* Reward History Toggle */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => setShowHistory(!showHistory)}
              className="w-full border-yellow-400/30 hover:bg-yellow-400/10"
            >
              <History className="w-4 h-4 mr-2" />
              Lịch sử tích lũy ({earnedRewards.length} giao dịch)
              {showHistory ? (
                <ChevronUp className="w-4 h-4 ml-2" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-2" />
              )}
            </Button>

            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 bg-background/30 rounded-xl border border-yellow-400/20 p-4">
                    {/* Total Summary */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-yellow-400/20">
                      <span className="text-sm font-medium text-muted-foreground">Tổng đã tích lũy:</span>
                      <span className="text-lg font-bold text-green-400">
                        +{totalFromHistory.toLocaleString()} $C
                      </span>
                    </div>

                    {isLoadingHistory ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
                      </div>
                    ) : earnedRewards.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Gift className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Chưa có phần thưởng nào</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {earnedRewards.map((item, index) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors"
                            >
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRewardColor(item.reward_type)} flex items-center justify-center text-white`}>
                                {getRewardIcon(item.reward_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {getRewardLabel(item.reward_type)}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.description || format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-green-400">
                                  +{item.amount.toLocaleString()}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">$C</span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
