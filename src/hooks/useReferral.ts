import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { getCurrentTier, REFERRAL_TIERS, ReferralTier } from '@/utils/referralTiers';

const REFERRAL_REWARD_FOR_REFERRER = 25000;
const REFERRAL_STORAGE_KEY = 'fun_planet_referral_code';
const CLAIMED_TIERS_KEY = 'fun_planet_claimed_tiers';

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  referralEarnings: number;
  referrerUsername: string | null;
  isLoading: boolean;
  claimedTiers: string[];
  newTierAchieved: ReferralTier | null;
}

interface PendingReferrer {
  userId: string;
  username: string;
  referralCode: string;
}

export const useReferral = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    referralCode: null,
    totalReferrals: 0,
    referralEarnings: 0,
    referrerUsername: null,
    isLoading: true,
    claimedTiers: [],
    newTierAchieved: null,
  });
  const [pendingReferrer, setPendingReferrer] = useState<PendingReferrer | null>(null);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const previousReferralsRef = useRef<number | null>(null);

  // Check URL for referral code on mount
  useEffect(() => {
    const checkReferralCode = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');
      const storedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
      const codeToCheck = refCode || storedCode;
      
      // Clean URL first if refCode in URL
      if (refCode) {
        localStorage.setItem(REFERRAL_STORAGE_KEY, refCode);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      // If user is logged in, check if they already claimed first_wallet reward
      if (user && codeToCheck) {
        const { data: rewards } = await supabase
          .from('web3_rewards')
          .select('first_wallet_claimed')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // If already claimed first wallet reward, don't show banner
        if (rewards?.first_wallet_claimed) {
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
          setShowWelcomeBanner(false);
          setPendingReferrer(null);
          return; // Stop here, don't show banner
        }
      }
      
      // No referral code to check
      if (!codeToCheck) return;
      
      // Look up referrer info
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, username, referral_code')
        .eq('referral_code', codeToCheck.toUpperCase())
        .maybeSingle();
      
      if (referrer) {
        // Don't show banner if it's the user's own referral code
        if (user && referrer.id === user.id) {
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
          return;
        }
        
        setPendingReferrer({
          userId: referrer.id,
          username: referrer.username,
          referralCode: referrer.referral_code || '',
        });
        setShowWelcomeBanner(true);
      }
    };
    
    checkReferralCode();
  }, [user]);

  // Check and claim tier rewards using secure RPC
  const checkAndClaimTierRewards = useCallback(async (totalReferrals: number, claimedTiers: string[]) => {
    if (!user) return;

    const currentTier = getCurrentTier(totalReferrals);
    if (currentTier.id === 'none') return;

    // Find unclaimed tiers that user has achieved
    const unclaimedTiers = REFERRAL_TIERS.filter(
      tier => 
        tier.id !== 'none' && 
        totalReferrals >= tier.requiredReferrals && 
        !claimedTiers.includes(tier.id)
    );

    if (unclaimedTiers.length === 0) return;

    // Claim all unclaimed tiers using secure RPC
    for (const tier of unclaimedTiers) {
      try {
        const { data, error } = await supabase.rpc('claim_referral_tier_safe', {
          p_tier_id: tier.id,
          p_tier_reward: tier.reward
        });

        if (error) {
          console.error('Error claiming tier reward:', error);
          continue;
        }

        const result = data as { success: boolean; error?: string } | null;

        if (result?.success) {
          // Update local claimed tiers
          const newClaimedTiers = [...claimedTiers, tier.id];
          claimedTiers.push(tier.id);

          // Show achievement for the highest tier achieved
          if (tier === unclaimedTiers[unclaimedTiers.length - 1]) {
            setStats(prev => ({
              ...prev,
              claimedTiers: newClaimedTiers,
              referralEarnings: prev.referralEarnings + tier.reward,
              newTierAchieved: tier,
            }));
          }
        }
      } catch (error) {
        console.error('Error claiming tier reward:', error);
      }
    }
  }, [user]);

  // Load user's referral stats
  const loadStats = useCallback(async () => {
    if (!user) {
      setStats(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Get user's referral code from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      // Get referral stats from web3_rewards
      const { data: rewards } = await supabase
        .from('web3_rewards')
        .select('total_referrals, referral_earnings')
        .eq('user_id', user.id)
        .maybeSingle();

      // Get claimed tiers from database (instead of localStorage)
      const { data: claimedTiersData } = await supabase
        .from('claimed_referral_tiers')
        .select('tier_id')
        .eq('user_id', user.id);

      const claimedTiers = claimedTiersData?.map(t => t.tier_id) || [];

      const totalReferrals = rewards?.total_referrals || 0;

      setStats({
        referralCode: profile?.referral_code || null,
        totalReferrals,
        referralEarnings: Number(rewards?.referral_earnings) || 0,
        referrerUsername: null,
        isLoading: false,
        claimedTiers,
        newTierAchieved: null,
      });

      // Check and claim tier rewards
      await checkAndClaimTierRewards(totalReferrals, claimedTiers);
    } catch (error) {
      console.error('Error loading referral stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, [user, checkAndClaimTierRewards]);

  const clearNewTierAchieved = useCallback(() => {
    setStats(prev => ({ ...prev, newTierAchieved: null }));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Process referral when user connects wallet for the first time
  const processReferral = useCallback(async () => {
    if (!user) return false;
    
    const storedCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (!storedCode) return false;

    try {
      // Check if user already has a referral record (was already referred)
      const { data: existingReferral } = await supabase
        .from('referrals')
        .select('id')
        .eq('referred_id', user.id)
        .maybeSingle();

      if (existingReferral) {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        return false;
      }

      // Find the referrer
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('referral_code', storedCode.toUpperCase())
        .maybeSingle();

      if (!referrer || referrer.id === user.id) {
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        return false;
      }

      // Create referral record
      const { error: referralError } = await supabase
        .from('referrals')
        .insert({
          referrer_id: referrer.id,
          referred_id: user.id,
          referral_code: storedCode.toUpperCase(),
          reward_paid: true,
          reward_amount: REFERRAL_REWARD_FOR_REFERRER,
          completed_at: new Date().toISOString(),
        });

      if (referralError) {
        console.error('Error creating referral:', referralError);
        localStorage.removeItem(REFERRAL_STORAGE_KEY);
        return false;
      }

      // Add reward to referrer's balance
      const { data: referrerRewards } = await supabase
        .from('web3_rewards')
        .select('camly_balance, total_referrals, referral_earnings')
        .eq('user_id', referrer.id)
        .maybeSingle();

      const newBalance = referrerRewards 
        ? Number(referrerRewards.camly_balance) + REFERRAL_REWARD_FOR_REFERRER 
        : REFERRAL_REWARD_FOR_REFERRER;

      if (referrerRewards) {
        await supabase
          .from('web3_rewards')
          .update({
            camly_balance: newBalance,
            total_referrals: (referrerRewards.total_referrals || 0) + 1,
            referral_earnings: Number(referrerRewards.referral_earnings || 0) + REFERRAL_REWARD_FOR_REFERRER,
          })
          .eq('user_id', referrer.id);
      } else {
        await supabase
          .from('web3_rewards')
          .insert({
            user_id: referrer.id,
            camly_balance: REFERRAL_REWARD_FOR_REFERRER,
            total_referrals: 1,
            referral_earnings: REFERRAL_REWARD_FOR_REFERRER,
          });
      }

      // Đảm bảo user_rewards.pending_amount được cập nhật trực tiếp
      await supabase
        .from('user_rewards')
        .upsert({
          user_id: referrer.id,
          pending_amount: newBalance,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      // Record the transaction for referrer
      await supabase.from('web3_reward_transactions').insert({
        user_id: referrer.id,
        amount: REFERRAL_REWARD_FOR_REFERRER,
        reward_type: 'referral_bonus',
        description: `Mời bạn ${user.email?.split('@')[0] || 'mới'} thành công`,
      });

      localStorage.removeItem(REFERRAL_STORAGE_KEY);
      toast.success(`Bạn đã được ${referrer.username} mời thành công!`);
      return true;
    } catch (error) {
      console.error('Error processing referral:', error);
      return false;
    }
  }, [user]);

  // Generate referral link - using planet.fun.rich domain
  const getReferralLink = useCallback(() => {
    if (!stats.referralCode) return '';
    return `https://planet.fun.rich/?ref=${stats.referralCode}`;
  }, [stats.referralCode]);

  // Copy referral link
  const copyReferralLink = useCallback(async () => {
    const link = getReferralLink();
    if (!link) {
      toast.error('Không có mã mời');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Đã copy link mời! 🎉');
    } catch {
      toast.error('Không thể copy link');
    }
  }, [getReferralLink]);

  const dismissWelcomeBanner = useCallback(() => {
    setShowWelcomeBanner(false);
  }, []);

  // Permanently hide banner and clear localStorage (call after claiming reward)
  const hideWelcomeBannerPermanently = useCallback(() => {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    setShowWelcomeBanner(false);
    setPendingReferrer(null);
  }, []);

  return {
    ...stats,
    pendingReferrer,
    showWelcomeBanner,
    processReferral,
    getReferralLink,
    copyReferralLink,
    dismissWelcomeBanner,
    hideWelcomeBannerPermanently,
    loadStats,
    clearNewTierAchieved,
    REFERRAL_REWARD_FOR_REFERRER,
  };
};
