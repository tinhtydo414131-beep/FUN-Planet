import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useWeb3Rewards } from '@/hooks/useWeb3Rewards';
import { useReferral } from '@/hooks/useReferral';
import { useCamlyClaim } from '@/hooks/useCamlyClaim';
import { useUserRewards } from '@/hooks/useUserRewards';
import { useDailyLoginReward } from '@/hooks/useDailyLoginReward';
import { useTrustScore } from '@/hooks/useTrustScore';
import { useAppKitSafe } from '@/hooks/useAppKitSafe';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { shouldShowChildFriendlyDisplay, calculateAge } from '@/lib/childFriendlyDisplay';
import { getAgeGroup, AgeGroup } from '@/config/playtimeRewards';
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
import { DailyLoginRewardCard } from '@/components/reward-galaxy/DailyLoginRewardCard';
import { DailyLoginRewardPopup } from '@/components/reward-galaxy/DailyLoginRewardPopup';
import { TrustScoreCard } from '@/components/reward-galaxy/TrustScoreCard';
import { DailyPlayProgressBar } from '@/components/reward-galaxy/DailyPlayProgressBar';

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
  const { open } = useAppKitSafe();
  const { address: appKitWalletAddress, isConnected: appKitIsConnected } = useAccount();
  const { camlyBalance, walletAddress: dbWalletAddress, isConnected: dbIsConnected, loadRewards: loadWeb3Rewards } = useWeb3Rewards();
  
  // Use AppKit wallet if connected, otherwise fall back to database wallet
  const actualWalletAddress = appKitWalletAddress || dbWalletAddress;
  const actualIsConnected = appKitIsConnected || dbIsConnected;
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

  const { trustInfo, loadTrustInfo } = useTrustScore();
  
  const [canClaimWallet, setCanClaimWallet] = useState<boolean | null>(null);
  const [canClaimGame, setCanClaimGame] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [birthYear, setBirthYear] = useState<number | null>(null);
  const [dailyPlayMinutes, setDailyPlayMinutes] = useState(0);

  const isChildFriendly = shouldShowChildFriendlyDisplay(birthYear);
  const userAge = calculateAge(birthYear);
  const ageGroup: AgeGroup = getAgeGroup(userAge);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch user profile for child-friendly display
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('birth_year')
        .eq('id', user.id)
        .single();
      
      if (profile?.birth_year) {
        setBirthYear(profile.birth_year);
      }

      // Fetch daily play time
      const today = new Date().toISOString().split('T')[0];
      const { data: playData } = await supabase
        .from('daily_play_rewards')
        .select('total_play_minutes')
        .eq('user_id', user.id)
        .eq('reward_date', today)
        .single();
      
      if (playData) {
        setDailyPlayMinutes(playData.total_play_minutes);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  // Sync AppKit wallet to database when connected - with eligibility check
  useEffect(() => {
    const syncWalletToDb = async () => {
      if (!user || !appKitWalletAddress) return;
      
      const normalizedAddress = appKitWalletAddress.toLowerCase();
      
      try {
        // First check if wallet is eligible (not already used by another account)
        const { data: eligibility, error: eligError } = await supabase
          .rpc('check_wallet_eligibility', {
            p_user_id: user.id,
            p_wallet_address: normalizedAddress
          });
        
        if (eligError) {
          console.error('Error checking wallet eligibility:', eligError);
          return;
        }

        // If wallet is not eligible (used by another user), skip update
        if (eligibility && eligibility.length > 0 && !eligibility[0].can_connect) {
          console.warn('Wallet not eligible:', eligibility[0].reason);
          return;
        }

        // Update profiles table with error handling for constraint violations
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ wallet_address: normalizedAddress })
          .eq('id', user.id);

        if (profileError) {
          // If it's a unique constraint violation, just log and skip
          if (profileError.code === '23505') {
            console.warn('Wallet already linked to another account');
            return;
          }
          throw profileError;
        }

        // Update web3_rewards table
        await supabase
          .from('web3_rewards')
          .upsert({
            user_id: user.id,
            wallet_address: normalizedAddress,
          }, { onConflict: 'user_id' });

        // Update user_rewards table
        await supabase
          .from('user_rewards')
          .update({ wallet_address: normalizedAddress })
          .eq('user_id', user.id);

        // Reload rewards data
        loadWeb3Rewards();
        loadRewards();
      } catch (error) {
        console.error('Error syncing wallet to database:', error);
      }
    };

    syncWalletToDb();
  }, [user, appKitWalletAddress, loadWeb3Rewards, loadRewards]);

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
    if (!actualWalletAddress) {
      return { success: false, error: 'Please connect your wallet first' };
    }
    const result = await claimArbitrary(amount, actualWalletAddress);
    if (result.success) {
      // Reload trust info after successful claim
      loadTrustInfo();
    }
    return result;
  };

  const handleClaimFirstWallet = async () => {
    if (!actualIsConnected) {
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
    if (!actualIsConnected) {
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
    const result = await claimDailyReward(actualWalletAddress || undefined);
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

          {/* Wallet Status */}
          <WalletStatusCard 
            isConnected={actualIsConnected}
            walletAddress={actualWalletAddress}
            camlyBalance={camlyBalance}
            onConnect={() => open()}
          />

          {/* Trust Score Card */}
          {trustInfo && (
            <TrustScoreCard
              trustScore={trustInfo.trust_score}
              tier={trustInfo.auto_approve_tier}
              cooldownRemaining={trustInfo.cooldown_remaining}
              hourlyRequestsRemaining={trustInfo.hourly_requests_remaining}
              accountAgeDays={trustInfo.account_age_days}
              successfulClaims={trustInfo.successful_claims}
              hasWallet={!!actualWalletAddress}
              pendingAmount={rewards?.pending_amount || 0}
              onConnectWallet={() => open()}
              birthYear={birthYear}
            />
          )}

          {/* Daily Play Progress - Child-Friendly */}
          {isChildFriendly && (
            <DailyPlayProgressBar
              totalMinutesPlayed={dailyPlayMinutes}
              ageGroup={ageGroup}
              isChildFriendlyDisplay={isChildFriendly}
            />
          )}

          {/* Pending Balance & Claim Section */}
          <PendingBalanceCard
            pendingAmount={rewards?.pending_amount || 0}
            dailyRemaining={dailyRemaining}
            dailyLimit={dailyLimit}
            walletAddress={actualWalletAddress}
            isConnected={actualIsConnected}
            isClaiming={isClaimingArbitrary}
            onClaim={handleClaimArbitrary}
            onConnect={() => open()}
          />

          {/* Reward Categories - Planet Cards */}
          <div className="mb-14">
            <motion.h2 
              className="text-3xl md:text-4xl font-fredoka font-bold text-center mb-10"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FF69B4, #A855F7, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                }}
              >
                🌟 Các Hành Tinh Phần Thưởng 🌟
              </span>
            </motion.h2>
            
            {/* Responsive grid: 1 col mobile, 2 col tablet, 5 col desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 md:gap-6">
              {/* Daily Login Reward - Mint green to warm yellow */}
              <DailyLoginRewardCard
                canClaim={canClaimDailyLogin}
                isClaiming={isClaimingDailyLogin}
                isChecking={isCheckingDailyLogin}
                onClaim={handleClaimDailyLogin}
                delay={0}
              />

              {/* Welcome Bonus - Sunny orange to pink (ONE-TIME ONLY) */}
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
                isConnected={actualIsConnected}
                onClaim={handleClaimFirstWallet}
                isOneTime={true}
                delay={0.1}
              />

              {/* Game Play Bonus - Cheerful blue to light purple */}
              <RewardPlanetCard
                title="Chơi Game"
                subtitle="First Play Bonus"
                amount={10000}
                icon={<Gamepad2 className="w-8 h-8" />}
                gradientFrom="from-[#87CEEB]"
                gradientTo="to-[#DDA0DD]"
                cardGradient="from-[#E0FFFF]/90 via-[#F0F8FF]/95 to-[#E6E6FA]/90"
                description="Lần đầu chơi mỗi game + 500/phút"
                canClaim={canClaimGame ?? false}
                isClaiming={isClaiming}
                isConnected={actualIsConnected}
                onClaim={handleClaimGameCompletion}
                delay={0.2}
              />

              {/* Game Upload Bonus - Creative pink to yellow (ONE-TIME ONLY) */}
              <RewardPlanetCard
                title="Upload Game"
                subtitle="Creator Reward"
                amount={500000}
                icon={<Upload className="w-8 h-8" />}
                gradientFrom="from-[#FF69B4]"
                gradientTo="to-[#FFD700]"
                cardGradient="from-[#FFB6C1]/90 via-[#FFF0F5]/95 to-[#FFFACD]/90"
                description="Game được duyệt & không trùng lặp"
                canClaim={false}
                isClaiming={false}
                isConnected={actualIsConnected}
                onClaim={() => navigate('/upload')}
                buttonText="Upload Game"
                isSpecial
                isOneTime={true}
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
