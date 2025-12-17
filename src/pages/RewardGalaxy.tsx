import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3Rewards } from '@/hooks/useWeb3Rewards';
import { useReferral } from '@/hooks/useReferral';
import { useCamlyClaim } from '@/hooks/useCamlyClaim';
import { useUserRewards } from '@/hooks/useUserRewards';
import { useDailyLoginReward } from '@/hooks/useDailyLoginReward';
import { useAppKit } from '@reown/appkit/react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  Wallet, 
  Gamepad2, 
  Upload, 
  Users, 
  Gift, 
  Copy, 
  Check, 
  Share2, 
  Star,
  Sparkles,
  Coins,
  History,
  Loader2,
  Globe,
  Heart,
  Rocket,
  Crown,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { fireDiamondConfetti } from '@/components/DiamondConfetti';
import { RewardPlanetCard } from '@/components/reward-galaxy/RewardPlanetCard';
import { CosmicBackground } from '@/components/reward-galaxy/CosmicBackground';
import { FatherUniverseHeader } from '@/components/reward-galaxy/FatherUniverseHeader';
import { ReferralShareCard } from '@/components/reward-galaxy/ReferralShareCard';
import { ClaimHistoryCard } from '@/components/reward-galaxy/ClaimHistoryCard';
import { WalletStatusCard } from '@/components/reward-galaxy/WalletStatusCard';
import { PendingBalanceCard } from '@/components/reward-galaxy/PendingBalanceCard';
import { CamlyBalanceCard } from '@/components/reward-galaxy/CamlyBalanceCard';
import { DailyLoginRewardCard } from '@/components/reward-galaxy/DailyLoginRewardCard';
import { DailyLoginRewardPopup } from '@/components/reward-galaxy/DailyLoginRewardPopup';

interface ClaimHistory {
  id: string;
  claim_type: string;
  amount: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
  claimed_at: string | null;
}

export default function RewardGalaxy() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { open } = useAppKit();
  const { camlyBalance, walletAddress, isConnected } = useWeb3Rewards();
  const { 
    referralCode, 
    totalReferrals, 
    referralEarnings, 
    getReferralLink, 
    copyReferralLink,
    REFERRAL_REWARD_FOR_REFERRER 
  } = useReferral();
  const { 
    claimReward, 
    checkCanClaim, 
    isClaiming, 
    loadClaimHistory,
    claimHistory,
    isLoadingHistory
  } = useCamlyClaim();
  const {
    rewards,
    dailyRemaining,
    dailyLimit,
    isClaiming: isClaimingArbitrary,
    claimArbitrary,
    loadRewards
  } = useUserRewards();

  const {
    canClaim: canClaimDailyLogin,
    isChecking: isCheckingDailyLogin,
    isClaiming: isClaimingDailyLogin,
    showRewardPopup,
    claimedAmount,
    claimDailyReward,
    closeRewardPopup,
  } = useDailyLoginReward();
  
  const [canClaimWallet, setCanClaimWallet] = useState<boolean | null>(null);
  const [canClaimGame, setCanClaimGame] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const checkClaims = async () => {
      if (!user) return;
      setIsChecking(true);
      
      const [walletResult, gameResult] = await Promise.all([
        checkCanClaim('first_wallet'),
        checkCanClaim('game_completion'),
      ]);
      
      setCanClaimWallet(walletResult.canClaim);
      setCanClaimGame(gameResult.canClaim);
      setIsChecking(false);
    };
    
    checkClaims();
    loadClaimHistory();
  }, [user, checkCanClaim, loadClaimHistory]);

  const handleClaimArbitrary = async (amount: number) => {
    if (!walletAddress) {
      return { success: false, error: 'Please connect your wallet first' };
    }
    return claimArbitrary(amount, walletAddress);
  };

  const handleClaimFirstWallet = async () => {
    if (!isConnected) {
      open();
      return;
    }
    
    const result = await claimReward('first_wallet');
    if (result.success) {
      setCanClaimWallet(false);
      fireDiamondConfetti('rainbow');
      // Reload pending balance
      await loadRewards();
      // Play success sound
      const audio = new Audio('/sounds/coin-collect.mp3');
      audio.play().catch(() => {});
    }
  };

  const handleClaimGameCompletion = async () => {
    if (!isConnected) {
      open();
      return;
    }
    
    const result = await claimReward('game_completion');
    if (result.success) {
      setCanClaimGame(false);
      fireDiamondConfetti('celebration');
      // Reload pending balance
      await loadRewards();
    }
  };

  const handleClaimDailyLogin = async () => {
    const result = await claimDailyReward(walletAddress || undefined);
    if (result.success) {
      fireDiamondConfetti('rainbow');
      await loadRewards();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Globe className="w-16 h-16 text-primary mx-auto" />
          </motion.div>
          <p className="text-xl font-fredoka text-primary">Đang tải Ngân Hà Phần Thưởng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Cosmic Background */}
      <CosmicBackground />
      
      <Navigation />

      <section className="relative pt-20 pb-32 px-4 z-10">
        <div className="container mx-auto max-w-6xl">
          {/* Father Universe Header */}
          <FatherUniverseHeader />

          {/* Camly Balance Card - Show total (claimed + pending) */}
          <CamlyBalanceCard balance={camlyBalance + (rewards?.pending_amount || 0)} />

          {/* Wallet Status */}
          <WalletStatusCard 
            isConnected={isConnected}
            walletAddress={walletAddress}
            camlyBalance={camlyBalance}
            onConnect={() => open()}
          />

          {/* Pending Balance & Claim Section - NEW */}
          <PendingBalanceCard
            pendingAmount={rewards?.pending_amount || 0}
            dailyRemaining={dailyRemaining}
            dailyLimit={dailyLimit}
            walletAddress={walletAddress}
            isConnected={isConnected}
            isClaiming={isClaimingArbitrary}
            onClaim={handleClaimArbitrary}
            onConnect={() => open()}
          />

          {/* Reward Categories - Planet Cards */}
          <div className="mb-12">
            <motion.h2 
              className="text-2xl md:text-3xl font-fredoka font-bold text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FF69B4, #87CEEB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 20px rgba(255, 215, 0, 0.3)',
              }}
            >
              🌟 Các Hành Tinh Phần Thưởng 🌟
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Daily Login Reward - Mint green to warm yellow */}
              <DailyLoginRewardCard
                canClaim={canClaimDailyLogin}
                isClaiming={isClaimingDailyLogin}
                isChecking={isCheckingDailyLogin}
                onClaim={handleClaimDailyLogin}
                delay={0}
              />

              {/* Welcome Bonus - Sunny orange to pink */}
              <RewardPlanetCard
                title="Chào Mừng"
                subtitle="Welcome Bonus"
                amount={50000}
                icon={<Wallet className="w-8 h-8" />}
                gradientFrom="from-[#FFA500]"
                gradientTo="to-[#FF69B4]"
                cardGradient="from-[#FFE4B5]/90 via-[#FFF8DC]/95 to-[#FFB6C1]/90"
                description="Kết nối ví lần đầu"
                canClaim={canClaimWallet ?? false}
                isClaiming={isClaiming}
                isConnected={isConnected}
                onClaim={handleClaimFirstWallet}
                delay={0.1}
              />

              {/* Game Play Bonus - Cheerful blue to light purple */}
              <RewardPlanetCard
                title="Chơi Game"
                subtitle="Game Play Bonus"
                amount={10000}
                icon={<Gamepad2 className="w-8 h-8" />}
                gradientFrom="from-[#87CEEB]"
                gradientTo="to-[#DDA0DD]"
                cardGradient="from-[#E0FFFF]/90 via-[#F0F8FF]/95 to-[#E6E6FA]/90"
                description="Hoàn thành 1 game"
                canClaim={canClaimGame ?? false}
                isClaiming={isClaiming}
                isConnected={isConnected}
                onClaim={handleClaimGameCompletion}
                delay={0.2}
              />

              {/* Game Upload Bonus - Creative pink to yellow */}
              <RewardPlanetCard
                title="Upload Game"
                subtitle="Creator Reward"
                amount={1000000}
                icon={<Upload className="w-8 h-8" />}
                gradientFrom="from-[#FF69B4]"
                gradientTo="to-[#FFD700]"
                cardGradient="from-[#FFB6C1]/90 via-[#FFF0F5]/95 to-[#FFFACD]/90"
                description="Game được duyệt"
                canClaim={false}
                isClaiming={false}
                isConnected={isConnected}
                onClaim={() => navigate('/upload')}
                buttonText="Upload Game"
                isSpecial
                delay={0.3}
              />

              {/* Referral Bonus - Heart pink to warm orange */}
              <RewardPlanetCard
                title="Mời Bạn Bè"
                subtitle="Referral Bonus"
                amount={REFERRAL_REWARD_FOR_REFERRER}
                icon={<Users className="w-8 h-8" />}
                gradientFrom="from-[#FF69B4]"
                gradientTo="to-[#FFA500]"
                cardGradient="from-[#FFB6C1]/90 via-[#FFF0F5]/95 to-[#FFE4B5]/90"
                description="Mỗi bạn mời thành công"
                canClaim={true}
                isClaiming={false}
                isConnected={true}
                onClaim={() => copyReferralLink()}
                buttonText="Copy Link"
                showHeart
                delay={0.4}
              />
            </div>
          </div>

          {/* Referral Share Section */}
          <ReferralShareCard
            referralCode={referralCode || ''}
            referralLink={getReferralLink()}
            totalReferrals={totalReferrals}
            referralEarnings={referralEarnings}
            onCopyLink={copyReferralLink}
          />

          {/* Claim History */}
          <ClaimHistoryCard 
            claims={claimHistory}
            isLoading={isLoadingHistory}
          />
        </div>
      </section>

      {/* Daily Login Reward Popup */}
      <DailyLoginRewardPopup
        isOpen={showRewardPopup}
        amount={claimedAmount}
        onClose={closeRewardPopup}
      />
    </div>
  );
}
