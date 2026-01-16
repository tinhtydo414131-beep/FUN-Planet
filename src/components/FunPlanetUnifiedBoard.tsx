import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Gamepad2, Upload, Gem, Crown, Heart, User, ChevronRight, RefreshCw, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { CAMLY_CONTRACT_ADDRESS, CAMLY_ABI } from "@/lib/web3";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { DonateCAMLYModal } from "./DonateCAMLYModal";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "./ui/hover-card";
import confetti from "canvas-confetti";
import { usePerformanceMode } from "@/hooks/usePerformanceMode";

// Treasury wallet address and BSC RPC (with backup URLs)
const FUN_PLANET_TREASURY = "0xDb792AF6a426E1c2AbF4A2A1F8716775b7145C69";
const BSC_RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org"
];

// Debounce utility
const debounce = <T extends (...args: any[]) => any>(fn: T, ms: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
};

// =============== TYPES ===============
interface Stats {
  totalUsers: number;
  totalGames: number;
  treasuryBalance: number;
  totalUploads: number;
  totalCamly: number;
}

interface Creator {
  id: string;
  username: string;
  avatar_url: string | null;
  games_count: number;
  total_plays: number;
}

interface Donor {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_address: string | null;
  total_donated: number;
  is_anonymous: boolean;
  total_plays: number;
  games_uploaded: number;
}

interface RankedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_balance: number | null;
  pending_amount: number;
  claimed_amount: number;
  total_camly: number;
  created_at?: string | null;
}

type TabType = "creators" | "donors";

// =============== HELPER COMPONENTS ===============
const AnimatedCounter = React.forwardRef<HTMLSpanElement, { value: number; duration?: number }>(
  ({ value, duration = 2000 }, ref) => {
    const [count, setCount] = useState(0);
    const prevValueRef = useRef(value);
    
    useEffect(() => {
      let startTime: number;
      let animationFrame: number;
      const startValue = prevValueRef.current;
      
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setCount(Math.floor(startValue + (value - startValue) * progress));
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          prevValueRef.current = value;
        }
      };
      
      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }, [value, duration]);
    
    return <span ref={ref} className="text-white">{count.toLocaleString()}</span>;
  }
);
AnimatedCounter.displayName = "AnimatedCounter";

const ProgressBar = React.forwardRef<
  HTMLDivElement,
  { value: number; maxValue: number }
>(({ value, maxValue }, ref) => {
  const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

  return (
    <div ref={ref} className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden mt-1">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"
        style={{ boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)" }}
      />
    </div>
  );
});
ProgressBar.displayName = "ProgressBar";

// Badges
const creatorBadges = [
  { min: 10, label: "👑 Legend", color: "text-yellow-300" },
  { min: 5, label: "🔥 Hot Creator", color: "text-orange-400" },
  { min: 2, label: "⭐ Rising Star", color: "text-cyan-400" },
  { min: 0, label: "🌱 Newcomer", color: "text-green-400" },
];

const donorBadges = [
  { min: 10000000, label: "👑 Platinum", color: "text-purple-300" },
  { min: 1000000, label: "💎 Diamond", color: "text-cyan-300" },
  { min: 500000, label: "🥇 Gold", color: "text-yellow-300" },
  { min: 100000, label: "🥈 Silver", color: "text-gray-300" },
  { min: 0, label: "🥉 Bronze", color: "text-amber-600" },
];

const getCreatorBadge = (gamesCount: number) => creatorBadges.find(b => gamesCount >= b.min) || creatorBadges[creatorBadges.length - 1];
const getDonorBadge = (totalDonated: number) => donorBadges.find(b => totalDonated >= b.min) || donorBadges[donorBadges.length - 1];
const getRankIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
};

// Glowing Ring for Podium
const GlowingRing = ({ rank }: { rank: number }) => {
  const colors = {
    1: "conic-gradient(from 0deg, #FFD700, #FFA500, #FFEC8B, #FF6B35, #FFD700)",
    2: "conic-gradient(from 0deg, #C0C0C0, #E8E8E8, #A8A8A8, #D0D0D0, #C0C0C0)",
    3: "conic-gradient(from 0deg, #CD7F32, #B8860B, #DAA520, #CD853F, #CD7F32)",
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: rank === 1 ? 4 : 8, repeat: Infinity, ease: "linear" }}
      className="absolute inset-0 rounded-full"
      style={{ background: colors[rank as keyof typeof colors] || colors[1], padding: "3px" }}
    />
  );
};

// Podium Card - Mobile Optimized
const PodiumCard = ({ user, rank, isCurrentUser }: { user: RankedUser; rank: number; maxBalance: number; isCurrentUser: boolean }) => {
  const heights = { 1: "h-16 sm:h-20 md:h-24", 2: "h-12 sm:h-16 md:h-20", 3: "h-10 sm:h-14 md:h-16" };
  const avatarSizes = { 1: "h-16 w-16 sm:h-18 sm:w-18 md:h-20 md:w-20", 2: "h-14 w-14 sm:h-16 sm:w-16 md:h-18 md:w-18", 3: "h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16" };
  const ringColors = {
    1: "border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)] sm:shadow-[0_0_20px_rgba(255,215,0,0.8)]",
    2: "border-slate-300 shadow-[0_0_10px_rgba(192,192,192,0.6)] sm:shadow-[0_0_15px_rgba(192,192,192,0.6)]",
    3: "border-orange-400 shadow-[0_0_10px_rgba(205,127,50,0.6)] sm:shadow-[0_0_15px_rgba(205,127,50,0.6)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.2 : rank === 2 ? 0.1 : 0.3 }}
      className="flex flex-col items-center"
    >
      <div className="relative mb-2">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full blur-md ${
            rank === 1 ? "bg-yellow-500/50" : rank === 2 ? "bg-slate-400/40" : "bg-orange-500/40"
          }`}
          style={{ transform: "scale(1.2)" }}
        />
        <div className="relative">
          <GlowingRing rank={rank} />
          <Avatar className={`relative z-10 ${avatarSizes[rank as keyof typeof avatarSizes]} border-2 sm:border-3 ${ringColors[rank as keyof typeof ringColors]}`}>
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm sm:text-lg">
              {user.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        {rank === 1 && (
            <motion.div
              animate={{ y: [0, -3, 0], rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2"
            >
              <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,1)]" />
          </motion.div>
        )}
      </div>

      <p className={`text-[11px] sm:text-sm font-bold truncate max-w-[70px] xs:max-w-[85px] sm:max-w-[120px] md:max-w-[150px] text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${isCurrentUser ? "text-yellow-300" : "text-white"}`}>
        {user.username}
      </p>

      <div className="flex items-center gap-0.5 sm:gap-1 mt-1">
        <Gem className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]" />
        <span className="text-xs sm:text-sm font-extrabold text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]">
          <AnimatedCounter value={user.total_camly || 0} duration={2000} />
        </span>
      </div>

      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className={`${heights[rank as keyof typeof heights]} w-full mt-2 rounded-t-lg ${
          rank === 1
            ? "bg-gradient-to-t from-yellow-600/60 to-yellow-400/40 border-2 border-yellow-400/60"
            : rank === 2
            ? "bg-gradient-to-t from-slate-500/50 to-slate-300/30 border-2 border-slate-300/50"
            : "bg-gradient-to-t from-orange-600/50 to-orange-400/30 border-2 border-orange-400/50"
        }`}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-xl sm:text-2xl font-black bg-gradient-to-b from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,215,0,0.9)]">
            #{rank}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Reduced floating particles for performance (from 4 to 2 for cleaner look)
const floatingParticles = [
  { emoji: "🌍", delay: 0, x: "5%", y: "10%", duration: 6 },
  { emoji: "👑", delay: 2, x: "95%", y: "85%", duration: 7 },
];

export const FunPlanetUnifiedBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shouldReduceAnimations, isMobile } = usePerformanceMode();

  // Honor Board State
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalGames: 0, treasuryBalance: 0, totalUploads: 0, totalCamly: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Legends Board State
  const [activeTab, setActiveTab] = useState<TabType>("donors");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [legendsLoading, setLegendsLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);

  // Ranking State
  const [topUsers, setTopUsers] = useState<RankedUser[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);

  // Shared State
  const [isLive, setIsLive] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  // Fetch Treasury Balance from BSC with backup RPCs
  const fetchTreasuryBalance = useCallback(async (): Promise<number> => {
    console.log("🏦 Fetching treasury balance for:", FUN_PLANET_TREASURY);
    
    for (const rpcUrl of BSC_RPC_URLS) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, CAMLY_ABI, provider);
        
        // Fetch decimals from contract
        const decimals = await contract.decimals();
        console.log("📊 CAMLY decimals from contract:", decimals.toString());
        
        const balance = await contract.balanceOf(FUN_PLANET_TREASURY);
        console.log("💰 Raw balance:", balance.toString());
        
        const formattedBalance = ethers.formatUnits(balance, Number(decimals));
        console.log("✨ Formatted balance:", formattedBalance);
        
        // Use Math.round() for accurate rounding
        const roundedBalance = Math.round(parseFloat(formattedBalance));
        console.log("🎯 Rounded balance:", roundedBalance);
        
        return roundedBalance;
      } catch (error) {
        console.warn(`⚠️ RPC ${rpcUrl} failed:`, error);
        continue;
      }
    }
    
    console.error("❌ All RPC endpoints failed");
    return 0;
  }, []);

  // Fetch Honor Board Stats using RPC to bypass RLS
  const fetchStats = useCallback(async () => {
    try {
      const [treasuryBalance, statsResult] = await Promise.all([
        fetchTreasuryBalance(),
        supabase.rpc('get_public_stats')
      ]);

      if (statsResult.error) {
        console.error("Error fetching public stats:", statsResult.error);
        return;
      }

      const data = statsResult.data as {
        total_users: number;
        total_games: number;
        total_uploads: number;
        total_camly: number;
      };

      console.log("📊 Honor Board Stats via RPC:", data);

      setStats({
        totalUsers: data.total_users || 0,
        totalGames: data.total_games || 0,
        treasuryBalance,
        totalUploads: data.total_uploads || 0,
        totalCamly: data.total_camly || 0,
      });
      setHasUpdate(true);
      setTimeout(() => setHasUpdate(false), 1000);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [fetchTreasuryBalance]);

  // Fetch Legends Data
  const fetchLegends = useCallback(async () => {
    try {
      const { data: gamesData } = await supabase.from("uploaded_games").select("user_id, profiles!uploaded_games_user_id_fkey(id, username, avatar_url)").eq("status", "approved");

      if (gamesData) {
        const creatorMap = new Map<string, Creator>();
        for (const game of gamesData) {
          const profile = game.profiles as any;
          if (!profile) continue;
          const existing = creatorMap.get(profile.id);
          if (existing) existing.games_count++;
          else creatorMap.set(profile.id, { id: profile.id, username: profile.username, avatar_url: profile.avatar_url, games_count: 1, total_plays: 0 });
        }

        const { data: playsData } = await supabase.from("game_plays").select("game_id, uploaded_games!game_plays_game_id_fkey(user_id)");
        if (playsData) {
          for (const play of playsData) {
            const userId = (play.uploaded_games as any)?.user_id;
            if (userId && creatorMap.has(userId)) creatorMap.get(userId)!.total_plays++;
          }
        }

        setCreators(Array.from(creatorMap.values()).sort((a, b) => b.games_count - a.games_count || b.total_plays - a.total_plays).slice(0, 3));
      }

      // Use RPC to bypass RLS and get donors with full info
      console.log("[UnifiedBoard] Fetching donors via RPC get_public_donors...");
      const { data: donorsData, error: donorsError } = await supabase
        .rpc('get_public_donors' as any, { limit_count: 10 }) as {
          data: any[] | null;
          error: any;
        };

      if (donorsError) {
        console.error("[UnifiedBoard] Donors RPC error:", donorsError);
      } else if (donorsData) {
        console.log("[UnifiedBoard] Donors fetched:", donorsData.length);
        const donorsList: Donor[] = donorsData.map((d: any) => ({
          id: d.id,
          username: d.username || 'Unknown',
          avatar_url: d.avatar_url,
          wallet_address: d.wallet_address,
          total_donated: Number(d.total_donated) || 0,
          is_anonymous: d.is_anonymous || false,
          total_plays: d.total_plays || 0,
          games_uploaded: d.games_uploaded || 0,
        }));
        
        setDonors(donorsList.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching legends data:", error);
    } finally {
      setLegendsLoading(false);
    }
  }, []);

  // Fetch Top Users - Using RPC to bypass RLS and get all users
  const fetchTopUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      
      console.log("[UnifiedBoard] Fetching top users via RPC...");
      
      // Use RPC to bypass RLS and get all users for ranking
      const { data, error: rpcError } = await supabase
        .rpc('get_public_ranking' as any, { limit_count: 20 }) as { 
          data: any[] | null; 
          error: any 
        };

      if (rpcError) {
        console.error("[UnifiedBoard] RPC error:", rpcError);
        return;
      }

      const rankedUsers: RankedUser[] = (data || []).map((row: any) => ({
        id: row.id,
        username: (row.username || 'Unknown').trim(),
        avatar_url: row.avatar_url,
        wallet_balance: Number(row.wallet_balance) || 0,
        pending_amount: Number(row.pending_amount) || 0,
        claimed_amount: Number(row.claimed_amount) || 0,
        total_camly: Number(row.total_camly) || 0,
        created_at: row.created_at,
      }));
      
      console.log("[UnifiedBoard] Success! Fetched", rankedUsers.length, "users");
      console.log("[UnifiedBoard] Top 5:", rankedUsers.slice(0, 5).map(u => ({
        username: u.username,
        total_camly: u.total_camly
      })));

      setTopUsers(rankedUsers);
    } catch (error) {
      console.error("Error fetching top users:", error);
    } finally {
      setRankingLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Debounced fetch with longer delay on mobile (1000ms vs 500ms)
  const debouncedFetchAllData = useMemo(
    () => debounce(() => {
      fetchStats();
      fetchLegends();
      fetchTopUsers();
    }, isMobile ? 1000 : 500),
    [fetchStats, fetchLegends, fetchTopUsers, isMobile]
  );

  // Single unified realtime subscription (merged from 6 channels - includes user_rewards)
  useEffect(() => {
    // Only set loading if we have no data yet - don't clear existing data to prevent flash
    if (topUsers.length === 0) {
      setRankingLoading(true);
    }
    
    // Initial fetch
    fetchStats();
    fetchLegends();
    fetchTopUsers();

    // Single channel for all tables - CRITICAL: includes user_rewards for ranking updates
    const unifiedChannel = supabase
      .channel('unified_board_changes_v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => debouncedFetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uploaded_games' }, () => debouncedFetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_plays' }, () => debouncedFetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lovable_games' }, () => debouncedFetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_donations' }, () => debouncedFetchAllData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_rewards' }, () => {
        console.log('[UnifiedBoard] user_rewards changed - refreshing ranking');
        debouncedFetchAllData();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsLive(true);
      });

    return () => {
      setIsLive(false);
      supabase.removeChannel(unifiedChannel);
    };
  }, [fetchStats, fetchLegends, fetchTopUsers, debouncedFetchAllData]);

  // Listen for wallet-connected-refresh event to force update ranking after wallet connect
  useEffect(() => {
    const handleWalletRefresh = () => {
      console.log('[UnifiedBoard] Wallet connected - delaying refresh by 800ms for DB sync');
      // Delay refresh to allow database triggers to complete wallet bonus sync
      setTimeout(() => {
        console.log('[UnifiedBoard] Now refreshing ranking data');
        fetchTopUsers(true);
        fetchStats();
      }, 800);
    };
    
    window.addEventListener('wallet-connected-refresh', handleWalletRefresh);
    return () => window.removeEventListener('wallet-connected-refresh', handleWalletRefresh);
  }, [fetchTopUsers, fetchStats]);

  // Fire confetti once on initial load (disabled on mobile for performance)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (!rankingLoading && topUsers.length > 0 && !confettiFired && !isMobile) {
      setConfettiFired(true);
      confetti({ particleCount: 40, spread: 60, origin: { x: 0.5, y: 0.6 }, colors: ["#FFD700", "#FFA500", "#FFEC8B"], ticks: 80, gravity: 1.4, scalar: 0.8 });
    }
  }, [rankingLoading, topUsers, confettiFired]);

  const maxStatValue = Math.max(stats.totalUsers, stats.totalGames, stats.treasuryBalance, stats.totalUploads, stats.totalCamly, 1);
  const maxBalance = topUsers[0]?.total_camly || 1;
  const top3Users = topUsers.slice(0, 3);
  const remainingUsers = topUsers.slice(3);

  const statItems = [
    { icon: Users, label: "Users", value: stats.totalUsers, bgColor: "bg-purple-500", accentColor: "#a855f7", suffix: "players" },
    { icon: Gamepad2, label: "Games", value: stats.totalGames, bgColor: "bg-teal-500", accentColor: "#14b8a6", suffix: "titles" },
    { icon: Gem, label: "Quỹ FP", value: stats.treasuryBalance, bgColor: "bg-amber-500", accentColor: "#f59e0b", suffix: "💰" },
    { icon: Upload, label: "Uploads", value: stats.totalUploads, bgColor: "bg-green-500", accentColor: "#22c55e", suffix: "games" },
    { icon: Gem, label: "CAMLY", value: stats.totalCamly, bgColor: "bg-rose-500", accentColor: "#f43f5e", suffix: "💎" },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 50%; } 100% { background-position: -200% 50%; } }
        @keyframes metallic-shine { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        .animate-metallic-shine { animation: metallic-shine 4s ease infinite; }
        .ranking-scrollbar::-webkit-scrollbar { width: 6px; }
        .ranking-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .ranking-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%); border-radius: 10px; }
        .ranking-scrollbar::-webkit-scrollbar-thumb:hover { background: linear-gradient(180deg, #FFEC8B 0%, #FFD700 100%); }
      `}</style>

      <div className="relative">
        {/* Outer Gold Glow */}
        <div className="absolute rounded-3xl pointer-events-none" style={{ inset: "-12px", boxShadow: "0 0 30px rgba(255, 215, 0, 0.5), 0 0 50px rgba(255, 165, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.2)", zIndex: -15 }} />

        {/* Gold Metallic Border */}
        <div className="absolute rounded-3xl animate-metallic-shine" style={{ inset: "-8px", background: "linear-gradient(135deg, #FFD700 0%, #FFFACD 10%, #FFF8DC 20%, #FFD700 35%, #B8860B 50%, #FFD700 65%, #FFF8DC 80%, #FFFACD 90%, #FFD700 100%)", backgroundSize: "200% 200%", boxShadow: "0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.5), inset 0 -1px 3px rgba(0, 0, 0, 0.3)", zIndex: -10 }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl shadow-xl"
          style={{ background: "linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(49, 46, 129, 0.85) 50%, rgba(30, 58, 138, 0.9) 100%)" }}
        >
          {/* Inner Border */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ border: "2px solid rgba(255, 215, 0, 0.7)", boxShadow: "inset 0 0 25px rgba(255, 215, 0, 0.3)", zIndex: 5 }} />

          {/* Video Background - Cha Vũ Trụ's Vision */}
          <div className="absolute inset-0 rounded-3xl z-0 overflow-hidden">
            {/* Fallback gradient - Pure Blue */}
            <div 
              className="absolute inset-0" 
              style={{ 
                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)'
              }} 
            />
            
            {/* Video Background */}
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/videos/honor-board-bg.mp4" type="video/mp4" />
            </video>
            
            {/* Subtle dark overlay for better text readability */}
            <div 
              className="absolute inset-0" 
              style={{ 
                background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.35) 50%, rgba(0, 0, 0, 0.3) 100%)'
              }}
            />
          </div>

          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-0 rounded-3xl" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "8px 8px" }} />

          {/* Floating Particles - Disabled on mobile/reduced motion for performance */}
          {!shouldReduceAnimations && floatingParticles.map((particle, index) => (
            <motion.div
              key={index}
              className="absolute text-sm pointer-events-none z-20"
              style={{ left: particle.x, top: particle.y }}
              animate={{ opacity: [0, 0.8, 0.8, 0], scale: [0.5, 1, 1, 0.5], y: [0, -15, -30, -45] }}
              transition={{ duration: particle.duration, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              {particle.emoji}
            </motion.div>
          ))}

          {/* Glow effects */}
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-purple-500/40 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-blue-500/40 blur-3xl" />

          {/* Live Indicator */}
          {isLive && (
            <motion.div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/50" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
              <motion.div className="w-2 h-2 rounded-full bg-green-400" animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
              <span className="text-[10px] text-green-300 font-medium">LIVE</span>
            </motion.div>
          )}

          {/* Update Flash */}
          <AnimatePresence>
            {hasUpdate && (
              <motion.div className="absolute inset-0 z-30 pointer-events-none rounded-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: "radial-gradient(circle at center, rgba(74, 222, 128, 0.2) 0%, transparent 70%)" }} />
            )}
          </AnimatePresence>

          {/* =============== MAIN GRID LAYOUT =============== */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* =============== LEFT COLUMN: HONOR + LEGENDS =============== */}
            <div className="p-3 sm:p-4 flex flex-col">
              {/* Honor Board Header */}
              <div className="mb-2 flex items-center justify-center gap-1.5 sm:gap-2">
                <motion.span className="text-sm sm:text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>🌍</motion.span>
                <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-lg sm:text-xl md:text-2xl font-bold text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]" style={{ backgroundSize: "200% 100%", animation: "shimmer 5s linear infinite" }}>HONOR BOARD</h3>
                <motion.span className="text-sm sm:text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>🏆</motion.span>
              </div>

              {/* Stats Bars */}
              <div className="flex flex-col gap-1 sm:gap-1.5">
                {statItems.map((item, index) => {
                  const progressPercent = Math.min((item.value / maxStatValue) * 100, 100);
                  const isCamly = item.label === "CAMLY";
                  
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2, boxShadow: `0 0 25px ${item.accentColor}50` }}
                      className="relative flex items-center gap-1.5 sm:gap-2 rounded-xl p-1.5 sm:p-2 px-2.5 sm:px-3 overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-sm"
                      style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.35) 0%, rgba(255,215,0,0.2) 100%)", borderLeft: `4px solid ${item.accentColor}`, backdropFilter: "blur(8px)", ...(isCamly && { border: "2px solid rgba(244, 63, 94, 0.6)", borderLeft: `4px solid ${item.accentColor}`, boxShadow: "0 0 20px rgba(244, 63, 94, 0.3)" }) }}
                    >
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <motion.div className="h-full" style={{ background: `linear-gradient(90deg, ${item.accentColor}50 0%, ${item.accentColor}20 50%, transparent 100%)` }} initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1.5, delay: index * 0.15, ease: "easeOut" }} />
                      </div>
                      <motion.div className={`relative z-10 rounded-lg ${item.bgColor} p-1.5 sm:p-2 flex-shrink-0`} style={{ boxShadow: `0 0 20px ${item.accentColor}80` }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.2, ease: "easeInOut" }}>
                        <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                      </motion.div>
                      <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                        <span className="text-sm sm:text-base font-bold text-yellow-200">{item.label}</span>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          {isCamly && <Gem className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />}
                          <span className="relative z-20 text-base sm:text-lg font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" style={{ textShadow: '0 0 8px #fff, 1px 1px 2px #000' }}>
                            {statsLoading ? <span className="animate-pulse">...</span> : <AnimatedCounter value={item.value} />}
                          </span>
                          <span className="text-xs sm:text-sm text-white font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]">{item.suffix}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Golden Horizontal Divider */}
              <div className="my-3 sm:my-4">
                <div className="h-0.5 sm:h-1 rounded-full" style={{ background: "linear-gradient(90deg, transparent 0%, #FFD700 15%, #FFFACD 30%, #FFD700 50%, #FFFACD 70%, #FFD700 85%, transparent 100%)", boxShadow: "0 0 10px rgba(255, 215, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.3)" }} />
              </div>

              {/* Legends Board */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Legends Header */}
                <div className="mb-2 sm:mb-3 flex items-center justify-center gap-1.5 sm:gap-2">
                  <motion.span className="text-sm sm:text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>👑</motion.span>
                  <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-lg sm:text-xl md:text-2xl font-bold text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]" style={{ backgroundSize: "200% 100%", animation: "shimmer 5s linear infinite" }}>FUN PLANET LEGENDS</h3>
                  <motion.span className="text-sm sm:text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>👑</motion.span>
                </div>

                {/* Tabs */}
                <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <button onClick={() => setActiveTab("donors")} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === "donors" ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/50" : "bg-white/25 !text-white hover:bg-white/30"}`}>
                    <Gem className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === "donors" ? "!text-white" : "!text-yellow-400"}`} />
                    <span className={`text-xs sm:text-base font-bold ${activeTab === "donors" ? "!text-white" : "!text-yellow-400"}`}>Donate & Sponsor</span>
                  </button>
                  <button onClick={() => setActiveTab("creators")} className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 py-1.5 sm:py-2 px-2 sm:px-4 rounded-xl font-semibold transition-all duration-300 ${activeTab === "creators" ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/50" : "bg-white/25 !text-white hover:bg-white/30"}`}>
                    <Gamepad2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${activeTab === "creators" ? "!text-white" : "!text-yellow-400"}`} />
                    <span className={`text-xs sm:text-base font-bold ${activeTab === "creators" ? "!text-white" : "!text-yellow-400"}`}>Top Creators</span>
                  </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto overflow-x-hidden scrollbar-hide-hover space-y-1.5 sm:space-y-2 h-[180px] sm:h-[200px]">
                  <AnimatePresence mode="wait">
                    {legendsLoading ? (
                      <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center h-32">
                        <div className="animate-pulse text-white/70">Loading...</div>
                      </motion.div>
                    ) : activeTab === "creators" ? (
                      <motion.div key="creators" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-2">
                        {creators.length === 0 ? (
                          <div className="text-center text-white/60 py-4">Chưa có creator nào. Hãy là người đầu tiên!</div>
                        ) : (
                          creators.map((creator, index) => {
                            const badge = getCreatorBadge(creator.games_count);
                            const rank = index + 1;
                            return (
                              <motion.div key={creator.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02, y: -2 }} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white/30 hover:bg-white/35 transition-all cursor-pointer backdrop-blur-sm" style={{ boxShadow: rank <= 3 ? `0 0 15px ${rank === 1 ? 'rgba(255,215,0,0.4)' : rank === 2 ? 'rgba(192,192,192,0.4)' : 'rgba(205,127,50,0.4)'}` : undefined }}>
                                <span className="text-lg w-8 text-center font-bold !text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{getRankIcon(rank)}</span>
                                <Avatar className="h-10 w-10 border-2 border-white/30">
                                  <AvatarImage src={creator.avatar_url || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500"><User className="h-5 w-5 text-white" /></AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold truncate !text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{creator.username}</div>
                                  <div className={`text-xs ${badge.color}`}>{badge.label}</div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-sm !text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"><Gamepad2 className="h-3 w-3 text-teal-400" /><span className="!text-white">{creator.games_count}</span></div>
                                  <div className="flex items-center gap-1 text-xs !text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"><Play className="h-3 w-3 !text-white" /><span className="!text-white">{creator.total_plays}</span></div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </motion.div>
                    ) : (
                      <motion.div key="donors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
                        {donors.length === 0 ? (
                          <div className="text-center py-6" style={{ color: 'white' }}><Heart className="h-8 w-8 mx-auto mb-2 text-rose-400" /><p>Chưa có ai ủng hộ. Hãy là người đầu tiên!</p></div>
                        ) : (
                          donors.map((donor, index) => {
                            const badge = getDonorBadge(donor.total_donated);
                            const rank = index + 1;
                            return (
                              <motion.div key={donor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02, y: -2 }} className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white/30 hover:bg-white/35 transition-all cursor-pointer backdrop-blur-sm" style={{ boxShadow: rank <= 3 ? `0 0 15px ${rank === 1 ? 'rgba(255,215,0,0.4)' : rank === 2 ? 'rgba(192,192,192,0.4)' : 'rgba(205,127,50,0.4)'}` : undefined }}>
                                <span className="text-lg w-8 text-center font-bold !text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{getRankIcon(rank)}</span>
                                <Avatar className="h-10 w-10 border-2 border-white/30">
                                  {donor.is_anonymous ? <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-700"><span className="text-lg">🎭</span></AvatarFallback> : <><AvatarImage src={donor.avatar_url || undefined} /><AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-500"><User className="h-5 w-5 text-white" /></AvatarFallback></>}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold !text-white truncate drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">{donor.username}</div>
                                  <div className={`text-xs ${badge.color}`}>{badge.label}</div>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 text-sm font-bold text-rose-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"><Gem className="h-3 w-3" /><span className="!text-white">{donor.total_donated.toLocaleString()}</span></div>
                                  <div className="text-[10px] !text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">CAMLY</div>
                                  {/* Extended stats for non-anonymous donors */}
                                  {!donor.is_anonymous && (donor.games_uploaded > 0 || donor.total_plays > 0) && (
                                    <div className="flex items-center justify-end gap-2 text-[10px] text-white/70 mt-0.5">
                                      {donor.games_uploaded > 0 && (
                                        <span className="flex items-center gap-0.5">
                                          <Upload className="h-2.5 w-2.5" />{donor.games_uploaded}
                                        </span>
                                      )}
                                      {donor.total_plays > 0 && (
                                        <span className="flex items-center gap-0.5">
                                          <Play className="h-2.5 w-2.5" />{donor.total_plays}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {/* Wallet address (truncated) */}
                                  {!donor.is_anonymous && donor.wallet_address && (
                                    <div className="text-[9px] text-yellow-300/60 mt-0.5 truncate max-w-[80px]">
                                      {donor.wallet_address.slice(0, 6)}...{donor.wallet_address.slice(-4)}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Donate Button */}
                <div className="mt-auto pt-2">
                  <Button onClick={() => setShowDonateModal(true)} className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-2 rounded-xl shadow-lg shadow-rose-500/30 transition-all hover:shadow-rose-500/50">
                    Donate CAMLY
                  </Button>
                </div>
              </div>
            </div>

            {/* =============== VERTICAL GOLD DIVIDER =============== */}
            <div className="hidden md:flex items-stretch absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-20">
              <div 
                className="w-1 min-h-full"
                style={{
                  background: `linear-gradient(180deg, 
                    transparent 0%, 
                    #FFD700 10%, 
                    #FFFACD 30%,
                    #FFD700 50%, 
                    #FFFACD 70%,
                    #FFD700 90%, 
                    transparent 100%
                  )`,
                  boxShadow: `
                    0 0 15px rgba(255, 215, 0, 0.6),
                    0 0 25px rgba(255, 215, 0, 0.4),
                    inset 0 0 5px rgba(255, 255, 255, 0.3)
                  `,
                }}
              />
            </div>

            {/* Horizontal Divider for Mobile */}
            <div className="md:hidden px-4">
              <div className="h-1 rounded-full" style={{ background: "linear-gradient(90deg, transparent 0%, #FFD700 15%, #FFFACD 30%, #FFD700 50%, #FFFACD 70%, #FFD700 85%, transparent 100%)", boxShadow: "0 0 10px rgba(255, 215, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.3)" }} />
            </div>

            {/* =============== RIGHT COLUMN: TOP RANKING =============== */}
            <div className="p-4 flex flex-col">
              {/* Header */}
              <div className="mb-4 flex items-center justify-center gap-3 relative">
                <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-2xl">🏆</motion.span>
                <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-xl sm:text-2xl font-bold text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]">TOP RANKING</h3>
                <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-2xl">⭐</motion.span>
                <button onClick={() => fetchTopUsers(true)} disabled={refreshing} className="absolute right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50" title="Refresh ranking">
                  <RefreshCw className={`h-4 w-4 text-yellow-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {rankingLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/25 p-3">
                      <div className="h-8 w-8 animate-pulse rounded-full bg-white/35" />
                      <div className="flex-1"><div className="h-4 w-24 animate-pulse rounded bg-white/35" /></div>
                      <div className="h-4 w-16 animate-pulse rounded bg-white/35" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* PODIUM FOR TOP 3 - Mobile Optimized */}
                  <div className="flex items-end justify-center gap-1 xs:gap-2 sm:gap-4 mb-3 sm:mb-4 px-1">
                    {top3Users[1] && <div className="w-[31%] sm:w-1/3 order-1"><PodiumCard user={top3Users[1]} rank={2} maxBalance={maxBalance} isCurrentUser={user?.id === top3Users[1].id} /></div>}
                    {top3Users[0] && <div className="w-[31%] sm:w-1/3 order-2"><PodiumCard user={top3Users[0]} rank={1} maxBalance={maxBalance} isCurrentUser={user?.id === top3Users[0].id} /></div>}
                    {top3Users[2] && <div className="w-[31%] sm:w-1/3 order-3"><PodiumCard user={top3Users[2]} rank={3} maxBalance={maxBalance} isCurrentUser={user?.id === top3Users[2].id} /></div>}
                  </div>

                  {/* Empty State */}
                  {topUsers.length === 0 && (
                    <div className="text-center py-8">
                      <motion.span animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl block mb-3">🏆</motion.span>
                      <p className="text-white/80 text-lg font-semibold">Chưa có ai trong bảng xếp hạng</p>
                      <p className="text-yellow-300/70 text-sm mt-1">Hãy là người đầu tiên!</p>
                    </div>
                  )}

                  {/* Remaining Rankings with ScrollArea */}
                  {remainingUsers.length > 0 && (
                    <ScrollArea className="flex-1 max-h-[300px] sm:max-h-[350px] md:max-h-[400px] pr-1 sm:pr-2 ranking-scrollbar">
                      <div className="space-y-2">
                        {remainingUsers.map((rankedUser, index) => {
                          const rank = index + 4;
                          const isCurrentUser = user?.id === rankedUser.id;

                          return (
                            <HoverCard key={rankedUser.id} openDelay={200}>
                              <HoverCardTrigger asChild>
                                <div>
                                  <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 + 0.5 }}
                                    whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(255, 215, 0, 0.4)" }}
                                    className={`flex items-center gap-2.5 sm:gap-3 rounded-xl border p-2.5 sm:p-3 backdrop-blur-sm cursor-pointer transition-all border-white/40 bg-gradient-to-r from-white/30 to-white/25 ${isCurrentUser ? "ring-2 ring-yellow-400" : ""}`}
                                  >
                                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-500/20 flex-shrink-0">
                                    <span className="text-sm sm:text-base font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]">#{rank}</span>
                                  </div>
                                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-white/40 flex-shrink-0">
                                    <AvatarImage src={rankedUser.avatar_url || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xs sm:text-sm">{rankedUser.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className={`truncate max-w-[100px] sm:max-w-[140px] text-sm sm:text-base font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] ${isCurrentUser ? "text-yellow-300" : "text-white"}`}>
                                      {rankedUser.username}{isCurrentUser && <span className="ml-1 text-[10px] sm:text-xs text-yellow-300/80">(Bạn)</span>}
                                    </p>
                                    <ProgressBar value={rankedUser.total_camly || 0} maxValue={maxBalance} />
                                  </div>
                                  <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-gradient-to-r from-yellow-500/50 to-amber-500/40 px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-yellow-400/70 shadow-[0_0_15px_rgba(255,215,0,0.6)] flex-shrink-0">
                                    <Gem className="h-3 w-3 sm:h-4 sm:w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                                    <span className="text-xs sm:text-sm font-extrabold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"><AnimatedCounter value={rankedUser.total_camly || 0} /></span>
                                  </div>
                                </motion.div>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-64 bg-gradient-to-br from-purple-500/95 via-pink-500/90 to-yellow-400/95 border-pink-400/50 backdrop-blur-xl" side="top">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-14 w-14 border-2 border-yellow-400/50">
                                    <AvatarImage src={rankedUser.avatar_url || undefined} />
                                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">{rankedUser.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-bold text-white">{rankedUser.username}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Gem className="h-4 w-4 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.7)]" />
                                      <span className="text-sm font-bold text-white">{(rankedUser.total_camly || 0).toLocaleString()} CAMLY</span>
                                    </div>
                                    <p className="text-xs text-white mt-1">🏆 Xếp hạng: #{rank}</p>
                                    <p className="text-xs text-white">📊 {Math.round(((rankedUser.total_camly || 0) / maxBalance) * 100)}% so với #1</p>
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </>
              )}

              {/* View All Button */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="mt-auto pt-2">
                <Button onClick={() => navigate("/full-ranking")} variant="outline" className="w-full rounded-xl border-2 border-yellow-400/60 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 font-bold text-yellow-100 hover:border-yellow-300 hover:from-yellow-500/40 hover:to-amber-500/40 hover:text-white transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]">
                  Xem Tất Cả
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Donate Modal */}
      <DonateCAMLYModal open={showDonateModal} onOpenChange={setShowDonateModal} />
    </>
  );
};
