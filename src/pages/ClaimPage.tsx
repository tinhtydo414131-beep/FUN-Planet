import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Diamond, Sparkles, Gift, Users, Gamepad2, Calendar, Shield, ArrowLeft, ExternalLink, Coins, TrendingUp, Lock, CheckCircle2, Zap, Star, Heart, Wallet, Mic, Radio, Brain, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { SmoothClaimModal } from "@/components/SmoothClaimModal";
import { RewardsDashboard } from "@/components/RewardsDashboard";
import { ClaimSuccessNotification } from "@/components/ClaimSuccessNotification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DiamondConfetti, fireDiamondConfetti } from "@/components/DiamondConfetti";
import { Navigation } from "@/components/Navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { useClaimToWallet } from "@/hooks/useClaimToWallet";
import { playBlingSound } from "@/components/SoundEffects528Hz";
import { CAMLY_AIRDROP_CONTRACT_ADDRESS } from "@/lib/web3";
import { Badge } from "@/components/ui/badge";

interface RewardTransaction {
  id: string;
  amount: number;
  reward_type: string;
  description: string | null;
  created_at: string;
}

interface WeeklyLimits {
  uploadRewards: number;
  playRewards: number;
  referralRewards: number;
  dailyRewards: number;
  totalWeekly: number;
}

const MAX_WEEKLY_TOTAL = 3000000;
const MAX_WEEKLY_UPLOAD = 2000000;
const MAX_DAILY_PLAY = 100000;
const MAX_WEEKLY_REFERRALS = 50;

const CHART_COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981'];

export default function ClaimPage() {
  const { t, i18n } = useTranslation();
  const isVN = i18n.language === 'vi';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { camlyBalance, claimDailyCheckin, claimToWallet, canClaimDailyCheckin, isLoading, CAMLY_CONTRACT_ADDRESS, loadRewards } = useWeb3Rewards();
  const { isClaiming, hasClaimed, claimAirdrop, celebrateClaim, triggerHaptic, checkHasClaimed, getRemainingPool, isConnected, walletAddress, openWalletModal } = useClaimToWallet();
  const [showDashboard, setShowDashboard] = useState(false);
  const [airdropClaimed, setAirdropClaimed] = useState(false);
  const [remainingPool, setRemainingPool] = useState("0");
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastTxHash, setLastTxHash] = useState("");
  const [rewardHistory, setRewardHistory] = useState<RewardTransaction[]>([]);
  const [weeklyLimits, setWeeklyLimits] = useState<WeeklyLimits>({
    uploadRewards: 0,
    playRewards: 0,
    referralRewards: 0,
    dailyRewards: 0,
    totalWeekly: 0
  });
  const [parentLimit, setParentLimit] = useState<number | null>(null);
  const [parentOverride, setParentOverride] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [aiPrediction, setAiPrediction] = useState({ trend: 'up', confidence: 100, target: '1M' });

  useEffect(() => {
    if (user) {
      fetchRewardHistory();
      fetchWeeklyLimits();
      fetchParentLimit();
      fetchDailyStreak();
    }
  }, [user]);

  // Check airdrop claim status on mount
  useEffect(() => {
    const checkAirdropStatus = async () => {
      if (walletAddress) {
        const claimed = await checkHasClaimed(walletAddress);
        setAirdropClaimed(claimed);
        const pool = await getRemainingPool();
        setRemainingPool(pool);
      }
    };
    checkAirdropStatus();
  }, [walletAddress, checkHasClaimed, getRemainingPool]);

  // Handle REAL airdrop claim from smart contract
  const handleRealAirdropClaim = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    // Open wallet modal if not connected
    if (!isConnected) {
      await openWalletModal();
      return;
    }

    const result = await claimAirdrop();
    
    if (result.success && result.txHash) {
      setAirdropClaimed(true);
      setLastTxHash(result.txHash);
      setShowSuccessModal(true);
      celebrateClaim();
      await fetchRewardHistory();
    } else {
      toast.error(result.error || (isVN ? 'Claim thất bại' : 'Claim failed'));
    }
  };

  const fetchRewardHistory = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('web3_reward_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setRewardHistory(data);
    }
  };

  const fetchWeeklyLimits = async () => {
    if (!user) return;
    
    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('web3_reward_transactions')
      .select('amount, reward_type')
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString());

    if (!error && data) {
      const limits: WeeklyLimits = {
        uploadRewards: 0,
        playRewards: 0,
        referralRewards: 0,
        dailyRewards: 0,
        totalWeekly: 0
      };

      data.forEach(tx => {
        const amount = Math.abs(tx.amount);
        limits.totalWeekly += amount;
        
        switch (tx.reward_type) {
          case 'game_upload':
          case 'upload_reward':
            limits.uploadRewards += amount;
            break;
          case 'game_play':
          case 'first_game_play':
            limits.playRewards += amount;
            break;
          case 'referral_bonus':
            limits.referralRewards += amount;
            break;
          case 'daily_checkin':
            limits.dailyRewards += amount;
            break;
        }
      });

      setWeeklyLimits(limits);
    }
  };

  const fetchParentLimit = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('child_time_limits')
      .select('daily_limit_minutes, is_active')
      .eq('child_id', user.id)
      .single();

    if (data) {
      // Convert to CAMLY limit (example: 1M per week)
      setParentLimit(data.is_active ? 1000000 : null);
      setParentOverride(!data.is_active);
    }
  };

  const handleParentOverride = async () => {
    if (!user) return;
    
    // Toggle parent override - requires parent PIN in real implementation
    const newOverride = !parentOverride;
    setParentOverride(newOverride);
    
    if (newOverride) {
      setParentLimit(null);
      toast.success(isVN ? 'Giới hạn đã được gỡ bỏ!' : 'Limit override activated!');
    } else {
      setParentLimit(1000000);
      toast.info(isVN ? 'Giới hạn đã được kích hoạt lại' : 'Limit restored');
    }
  };

  const fetchDailyStreak = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('web3_reward_transactions')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('reward_type', 'daily_checkin')
      .order('created_at', { ascending: false })
      .limit(30);

    if (data && data.length > 0) {
      // Calculate streak
      let streak = 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < data.length - 1; i++) {
        const current = new Date(data[i].created_at);
        const next = new Date(data[i + 1].created_at);
        current.setHours(0, 0, 0, 0);
        next.setHours(0, 0, 0, 0);
        
        const diffDays = (current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
      setDailyStreak(streak);
    }
  };

  const handleClaim = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (weeklyLimits.totalWeekly >= MAX_WEEKLY_TOTAL) {
      toast.info(isVN 
        ? "Bạn đã đạt giới hạn tuần! Reset vào thứ Hai 🌟" 
        : "Weekly limit reached! Resets on Monday 🌟");
      return;
    }

    if (parentLimit && weeklyLimits.totalWeekly >= parentLimit) {
      toast.info(isVN 
        ? "Con đã đạt giới hạn tuần do phụ huynh đặt! 🌟" 
        : "Child has reached parent-set weekly limit! 🌟");
      return;
    }

    setClaiming(true);
    triggerHaptic();
    
    try {
      if (canClaimDailyCheckin) {
        await claimDailyCheckin();
        setShowConfetti(true);
        celebrateClaim();
        playBlingSound();
        
        await fetchRewardHistory();
        await fetchWeeklyLimits();
        
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        toast.info(isVN 
          ? "Bạn đã nhận thưởng hôm nay! Quay lại ngày mai 🌈" 
          : "Already claimed today! Come back tomorrow 🌈");
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error(isVN ? "Có lỗi xảy ra" : "Something went wrong");
    } finally {
      setClaiming(false);
    }
  };

  // Chart data for reward sources
  const chartData = [
    { name: isVN ? 'Chơi game' : 'Games', value: weeklyLimits.playRewards, color: CHART_COLORS[0] },
    { name: isVN ? 'Upload' : 'Uploads', value: weeklyLimits.uploadRewards, color: CHART_COLORS[1] },
    { name: isVN ? 'Mời bạn' : 'Referrals', value: weeklyLimits.referralRewards, color: CHART_COLORS[2] },
    { name: isVN ? 'Điểm danh' : 'Daily', value: weeklyLimits.dailyRewards, color: CHART_COLORS[3] },
  ].filter(item => item.value > 0);

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'game_play':
      case 'first_game_play':
        return <Gamepad2 className="w-4 h-4" />;
      case 'referral_bonus':
        return <Users className="w-4 h-4" />;
      case 'daily_checkin':
        return <Calendar className="w-4 h-4" />;
      case 'game_upload':
      case 'upload_reward':
        return <Star className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const streakBonus = Math.min(dailyStreak, 7) * 1000;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <Navigation />
      <DiamondConfetti trigger={showConfetti} intensity="rainbow" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isVN ? 'Quay lại' : 'Back'}
        </Button>

        {/* Header - Total Rewards */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500/20 via-pink-500/20 to-cyan-500/20 rounded-full border border-primary/30 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
            <span className="font-bold text-lg">
              {isVN ? "Ví Ánh Sáng Bé Yêu! 🌟" : "Baby's Light Wallet! 🌟"}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
            {isVN ? 'Tổng Phần Thưởng' : 'Total Rewards'}
          </h1>
          
          <div className="flex items-center justify-center gap-3 text-5xl md:text-6xl font-black">
            <motion.span
              key={camlyBalance}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            >
              {camlyBalance.toLocaleString()}
            </motion.span>
            <Diamond className="w-12 h-12 text-cyan-400 animate-pulse" />
            <span className="text-2xl text-muted-foreground">CAMLY</span>
          </div>
        </motion.div>

        {/* Central Claim Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="overflow-hidden border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-pink-500/10 to-cyan-500/10">
            <CardContent className="p-8 text-center">
              {/* REAL BSC AIRDROP CLAIM BUTTON */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(255, 215, 0, 0.3)',
                    '0 0 60px rgba(255, 215, 0, 0.6)',
                    '0 0 20px rgba(255, 215, 0, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block rounded-full p-1 mb-6"
              >
                <Button
                  onClick={handleRealAirdropClaim}
                  disabled={isClaiming || airdropClaimed || hasClaimed}
                  size="lg"
                  className={`h-32 w-64 md:h-40 md:w-80 text-xl md:text-2xl font-black rounded-full shadow-2xl hover:scale-105 transition-all duration-300 ${
                    !isConnected 
                      ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500'
                      : airdropClaimed || hasClaimed
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-400 hover:via-orange-400 hover:to-red-400'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Wallet className="w-10 h-10 md:w-12 md:h-12 animate-bounce" />
                    <span>
                      {isClaiming ? (isVN ? 'Đang claim...' : 'Claiming...') : 
                       airdropClaimed || hasClaimed ? (isVN ? 'Đã nhận Airdrop ✓' : 'Airdrop Claimed ✓') :
                       !isConnected ? (isVN ? 'Kết nối Ví & Claim!' : 'Connect Wallet & Claim!') :
                       (isVN ? 'Claim 50K CAMLY về Ví!' : 'Claim 50K CAMLY to Wallet!')}
                    </span>
                  </div>
                </Button>
              </motion.div>

              {/* Pool Info */}
              <div className="text-sm text-muted-foreground mb-4">
                {isVN ? 'Pool còn lại: ' : 'Remaining Pool: '}
                <span className="font-bold text-yellow-500">
                  {Number(remainingPool).toLocaleString()} CAMLY
                </span>
              </div>

              {/* Contract Address */}
              <div className="text-xs text-muted-foreground mb-6">
                <a 
                  href={`https://bscscan.com/address/${CAMLY_AIRDROP_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary underline"
                >
                  {isVN ? 'Xem Contract trên BSCScan' : 'View Contract on BSCScan'} ↗
                </a>
              </div>

              {/* Divider */}
              <div className="border-t border-primary/20 my-6" />

              {/* Daily Check-in Button (Database rewards) */}
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(168, 85, 247, 0.3)',
                    '0 0 60px rgba(168, 85, 247, 0.6)',
                    '0 0 20px rgba(168, 85, 247, 0.3)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block rounded-full p-1 mb-6"
              >
                <Button
                  onClick={handleClaim}
                  disabled={claiming || isLoading || !canClaimDailyCheckin}
                  size="lg"
                  className="h-24 w-56 md:h-28 md:w-64 text-lg md:text-xl font-black rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Calendar className="w-8 h-8 md:w-10 md:h-10" />
                    <span>
                      {claiming ? (isVN ? 'Đang xử lý...' : 'Processing...') : 
                       canClaimDailyCheckin ? (isVN ? 'Điểm danh hàng ngày' : 'Daily Check-in') :
                       (isVN ? 'Đã điểm danh ✓' : 'Checked in ✓')}
                    </span>
                  </div>
                </Button>
              </motion.div>

              {/* Streak Bonus */}
              {dailyStreak > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-lg font-bold text-yellow-500"
                >
                  <Zap className="w-5 h-5" />
                  <span>
                    {isVN 
                      ? `Streak x${dailyStreak}! Hôm nay +${(10000 + streakBonus).toLocaleString()} CAMLY! 🌈`
                      : `Daily Streak x${dailyStreak}! Today +${(10000 + streakBonus).toLocaleString()} CAMLY! 🌈`}
                  </span>
                </motion.div>
              )}

              {/* Withdraw to Wallet Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <Button
                  onClick={() => setShowClaimModal(true)}
                  size="lg"
                  className="w-full max-w-xs bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold shadow-lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  {isVN ? 'Rút về ví' : 'Withdraw to Wallet'}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pie Chart - Reward Sources */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {isVN ? 'Nguồn Thưởng' : 'Reward Sources'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => `${value.toLocaleString()} CAMLY`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    {isVN ? 'Chưa có dữ liệu' : 'No data yet'}
                  </div>
                )}
                
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Limits */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  {isVN ? 'Giới Hạn An Toàn' : 'Safety Limits'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Weekly Total */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{isVN ? 'Tổng tuần' : 'Weekly Total'}</span>
                    <span className="font-bold">
                      {weeklyLimits.totalWeekly.toLocaleString()} / {MAX_WEEKLY_TOTAL.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(weeklyLimits.totalWeekly / MAX_WEEKLY_TOTAL) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Upload Rewards */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{isVN ? 'Upload game' : 'Game Uploads'}</span>
                    <span className="font-bold">
                      {weeklyLimits.uploadRewards.toLocaleString()} / {MAX_WEEKLY_UPLOAD.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(weeklyLimits.uploadRewards / MAX_WEEKLY_UPLOAD) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Parent Limit */}
                {parentLimit && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-blue-500" />
                      <span className="font-medium text-blue-600">
                        {isVN ? 'Giới hạn phụ huynh' : 'Parent Limit'}
                      </span>
                    </div>
                    <Progress 
                      value={(weeklyLimits.totalWeekly / parentLimit) * 100} 
                      className="h-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {weeklyLimits.totalWeekly.toLocaleString()} / {parentLimit.toLocaleString()} CAMLY
                    </p>
                  </div>
                )}

                {/* Parent Override Button */}
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/parent-dashboard')}
                    className="w-full"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    {isVN ? 'Phụ huynh đặt giới hạn' : 'Parent Set Limit'}
                  </Button>
                  
                  {parentLimit && (
                    <Button
                      variant="ghost"
                      onClick={handleParentOverride}
                      className="w-full text-xs text-muted-foreground hover:text-yellow-500"
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      {isVN ? 'Gỡ giới hạn (cần PIN phụ huynh)' : 'Override Limit (requires Parent PIN)'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Reward History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                {isVN ? 'Lịch Sử Phần Thưởng' : 'Reward History'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {rewardHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>{isVN ? 'Chưa có giao dịch nào' : 'No transactions yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rewardHistory.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          {getRewardIcon(tx.reward_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {tx.description || tx.reward_type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </p>
                        </div>
                        <p className={`font-bold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Price Scanner - HuggingFace Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mb-6"
        >
          <Card className="overflow-hidden border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-cyan-400 animate-pulse" />
                  <span>{isVN ? 'AI Dự Đoán Giá CAMLY' : 'AI CAMLY Price Prediction'}</span>
                </div>
                <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                  <Radio className="w-3 h-3 mr-1 animate-pulse" />
                  LIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-background/50">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-cyan-500 flex items-center justify-center"
                  >
                    <TrendingUp className="w-8 h-8 text-white" />
                  </motion.div>
                  <div>
                    <p className="text-2xl font-black text-green-400">
                      {aiPrediction.confidence}% {isVN ? 'Tăng' : 'Upward'} ↗
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isVN ? 'Mục tiêu: ' : 'Target: '}{aiPrediction.target} CAMLY
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">
                    {isVN ? 'Cập nhật theo thời gian thực' : 'Real-time HuggingFace AI'}
                  </p>
                  <Diamond className="w-6 h-6 text-cyan-400 inline animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Multiplayer & Voice Chat Teasers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        >
          {/* Real-time Multiplayer Teaser */}
          <Card className="overflow-hidden border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                >
                  <Users className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{isVN ? 'Multiplayer Thời Gian Thực' : 'Real-time Multiplayer'}</p>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                      {isVN ? 'SẮP RA MẮT' : 'COMING SOON'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isVN ? 'Chơi game cùng bạn bè - x3 thưởng!' : 'Play games with friends - 3x rewards!'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Chat Teaser */}
          <Card className="overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-blue-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center"
                >
                  <Mic className="w-6 h-6 text-white" />
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{isVN ? 'Voice Chat An Toàn' : 'Safe Voice Chat'}</p>
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50 text-xs">
                      {isVN ? 'SẮP RA MẮT' : 'COMING SOON'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isVN ? 'Nói chuyện với bạn bè - AI lọc an toàn' : 'Talk with friends - AI safety filter'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bonus Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-pink-500/10 to-cyan-500/10 border border-primary/30"
        >
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            {isVN ? 'Gợi Ý Bonus' : 'Bonus Suggestions'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
              <Gamepad2 className="w-8 h-8 text-purple-500" />
              <div>
                <p className="font-medium">{isVN ? 'Chơi game' : 'Play Games'}</p>
                <p className="text-sm text-muted-foreground">+10K CAMLY/{isVN ? 'game' : 'game'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
              <Users className="w-8 h-8 text-pink-500" />
              <div>
                <p className="font-medium">{isVN ? 'Mời bạn bè' : 'Invite Friends'}</p>
                <p className="text-sm text-muted-foreground">+25K CAMLY/{isVN ? 'bạn' : 'friend'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
              <Star className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="font-medium">{isVN ? 'Upload game hay' : 'Upload Quality Game'}</p>
                <p className="text-sm text-muted-foreground">+1M CAMLY</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50">
              <Calendar className="w-8 h-8 text-cyan-500" />
              <div>
                <p className="font-medium">{isVN ? 'Điểm danh 7 ngày' : '7-Day Streak'}</p>
                <p className="text-sm text-muted-foreground">x2 {isVN ? 'thưởng' : 'rewards'}!</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6"
        >
          <Button
            variant="outline"
            onClick={() => setShowDashboard(!showDashboard)}
            className="w-full"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {showDashboard 
              ? (isVN ? 'Ẩn thống kê' : 'Hide Stats')
              : (isVN ? 'Xem thống kê chi tiết' : 'View Detailed Stats')
            }
          </Button>
          
          <AnimatePresence>
            {showDashboard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4"
              >
                <RewardsDashboard />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </div>

      {/* Smooth Claim Modal */}
      <SmoothClaimModal
        isOpen={showClaimModal}
        onClose={() => setShowClaimModal(false)}
        camlyBalance={camlyBalance}
        onBalanceUpdate={loadRewards}
      />

      {/* Claim Success Notification with confetti, sound & BscScan link */}
      <ClaimSuccessNotification
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        txHash={lastTxHash}
        amount={50000}
        walletAddress={walletAddress}
      />
    </div>
  );
}
