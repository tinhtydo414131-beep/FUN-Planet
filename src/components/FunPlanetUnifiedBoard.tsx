import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Gamepad2, Play, Upload, Gem, Crown, Heart, User, Medal, ChevronRight, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { DonateCAMLYModal } from "./DonateCAMLYModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import confetti from "canvas-confetti";

// =============== TYPES ===============
interface Stats {
  totalUsers: number;
  totalGames: number;
  totalPlays: number;
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
  total_donated: number;
  is_anonymous: boolean;
}

interface RankedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_balance: number | null;
}

type TabType = "creators" | "donors";

// =============== ANIMATED COUNTER ===============
const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
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
  
  return <span className="text-white">{count.toLocaleString()}</span>;
};

// =============== BADGES ===============
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
const getRankIcon = (rank: number) => rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `${rank}`;

// =============== PODIUM COMPONENTS ===============
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

const PodiumCard = ({ user, rank, isCurrentUser }: { user: RankedUser; rank: number; maxBalance: number; isCurrentUser: boolean }) => {
  const heights = { 1: "h-16", 2: "h-12", 3: "h-10" };
  const avatarSizes = { 1: "h-12 w-12", 2: "h-10 w-10", 3: "h-10 w-10" };
  const ringColors = {
    1: "border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.8)]",
    2: "border-slate-300 shadow-[0_0_10px_rgba(192,192,192,0.6)]",
    3: "border-orange-400 shadow-[0_0_10px_rgba(205,127,50,0.6)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.2 : rank === 2 ? 0.1 : 0.3 }}
      className="flex flex-col items-center"
    >
      <div className="relative mb-1">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full blur-md ${
            rank === 1 ? "bg-yellow-500/50" : rank === 2 ? "bg-slate-400/40" : "bg-orange-500/40"
          }`}
          style={{ transform: "scale(1.2)" }}
        />
        <div className="relative">
          <GlowingRing rank={rank} />
          <Avatar className={`relative z-10 ${avatarSizes[rank as keyof typeof avatarSizes]} border-2 ${ringColors[rank as keyof typeof ringColors]}`}>
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
              {user.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
        {rank === 1 && (
          <motion.div
            animate={{ y: [0, -2, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-3 left-1/2 -translate-x-1/2"
          >
            <Crown className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,215,0,1)]" />
          </motion.div>
        )}
      </div>
      <p className={`text-xs font-bold truncate max-w-[80px] text-center ${isCurrentUser ? "text-yellow-300" : "text-white"}`}>
        {user.username}
      </p>
      <div className="flex items-center gap-0.5 mt-0.5">
        <Gem className="h-3 w-3 text-white" />
        <span className="text-xs font-bold text-white">
          <AnimatedCounter value={user.wallet_balance || 0} duration={1500} />
        </span>
      </div>
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className={`${heights[rank as keyof typeof heights]} w-full mt-1 rounded-t-lg ${
          rank === 1 ? "bg-gradient-to-t from-yellow-600/60 to-yellow-400/40 border border-yellow-400/60"
            : rank === 2 ? "bg-gradient-to-t from-slate-500/50 to-slate-300/30 border border-slate-300/50"
            : "bg-gradient-to-t from-orange-600/50 to-orange-400/30 border border-orange-400/50"
        }`}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-lg font-black bg-gradient-to-b from-yellow-300 to-amber-500 bg-clip-text text-transparent">#{rank}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// =============== FLOATING PARTICLES ===============
const floatingParticles = [
  { emoji: "👤", delay: 0, x: "5%", y: "10%", duration: 4 },
  { emoji: "🎮", delay: 0.5, x: "95%", y: "15%", duration: 5 },
  { emoji: "💎", delay: 1, x: "8%", y: "50%", duration: 4.5 },
  { emoji: "👑", delay: 1.5, x: "92%", y: "55%", duration: 3.5 },
  { emoji: "✨", delay: 2, x: "50%", y: "5%", duration: 4 },
  { emoji: "⭐", delay: 2.5, x: "35%", y: "90%", duration: 5 },
  { emoji: "🚀", delay: 3, x: "65%", y: "85%", duration: 4.2 },
  { emoji: "🔥", delay: 3.5, x: "20%", y: "75%", duration: 3.8 },
];

// =============== VERTICAL GOLD DIVIDER ===============
const VerticalGoldDivider = () => (
  <div 
    className="hidden md:block w-1 min-h-full self-stretch"
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
        0 0 10px rgba(255, 215, 0, 0.6),
        0 0 20px rgba(255, 215, 0, 0.3)
      `,
    }}
  />
);

// =============== MAIN COMPONENT ===============
export const FunPlanetUnifiedBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Honor Board State
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalGames: 0, totalPlays: 0, totalUploads: 0, totalCamly: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Legends Board State
  const [activeTab, setActiveTab] = useState<TabType>("creators");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [legendsLoading, setLegendsLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);

  // Top Ranking State
  const [topUsers, setTopUsers] = useState<RankedUser[]>([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confettiFired, setConfettiFired] = useState(false);

  // Shared State
  const [isLive, setIsLive] = useState(false);

  // Fetch Honor Board Stats
  const fetchStats = useCallback(async () => {
    try {
      const { count: usersCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: uploadedGamesCount } = await supabase.from("uploaded_games").select("*", { count: "exact", head: true }).eq("status", "approved");
      const { count: lovableGamesCount } = await supabase.from("lovable_games").select("*", { count: "exact", head: true }).eq("approved", true);
      const totalGames = (uploadedGamesCount || 0) + (lovableGamesCount || 0);
      const { data: playersData } = await supabase.from("game_plays").select("user_id");
      const uniquePlayers = new Set(playersData?.map(p => p.user_id) || []).size;
      const { count: uploadsCount } = await supabase.from("uploaded_games").select("*", { count: "exact", head: true });
      const { data: camlyData } = await supabase.from("profiles").select("wallet_balance");
      const totalCamly = camlyData?.reduce((sum, profile) => sum + (profile.wallet_balance || 0), 0) || 0;
      setStats({ totalUsers: usersCount || 0, totalGames, totalPlays: uniquePlayers, totalUploads: uploadsCount || 0, totalCamly });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch Legends Data
  const fetchLegends = useCallback(async () => {
    try {
      const { data: gamesData } = await supabase
        .from("uploaded_games")
        .select("user_id, profiles!uploaded_games_user_id_fkey(id, username, avatar_url)")
        .eq("status", "approved");

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
        setCreators(Array.from(creatorMap.values()).sort((a, b) => b.games_count - a.games_count || b.total_plays - a.total_plays).slice(0, 5));
      }

      const { data: donationsData } = await supabase
        .from("platform_donations")
        .select("user_id, amount, is_anonymous, profiles!platform_donations_user_id_fkey(id, username, avatar_url)")
        .order("created_at", { ascending: false });

      if (donationsData) {
        const donorMap = new Map<string, Donor>();
        for (const donation of donationsData) {
          const profile = donation.profiles as any;
          if (!profile) continue;
          const existing = donorMap.get(profile.id);
          if (existing) existing.total_donated += donation.amount;
          else donorMap.set(profile.id, { id: profile.id, username: donation.is_anonymous ? "Anonymous" : profile.username, avatar_url: donation.is_anonymous ? null : profile.avatar_url, total_donated: donation.amount, is_anonymous: donation.is_anonymous });
        }
        setDonors(Array.from(donorMap.values()).sort((a, b) => b.total_donated - a.total_donated).slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching legends:", error);
    } finally {
      setLegendsLoading(false);
    }
  }, []);

  // Fetch Top Ranking
  const fetchTopUsers = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const { data } = await supabase.from("profiles").select("id, username, avatar_url, wallet_balance").order("wallet_balance", { ascending: false, nullsFirst: false }).limit(10);
      setTopUsers(data || []);
    } catch (error) {
      console.error("Error fetching ranking:", error);
    } finally {
      setRankingLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch all data
  const fetchAllData = useCallback(() => {
    fetchStats();
    fetchLegends();
    fetchTopUsers();
  }, [fetchStats, fetchLegends, fetchTopUsers]);

  // Real-time subscriptions
  useEffect(() => {
    fetchAllData();

    const channels = [
      supabase.channel('unified_profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAllData()).subscribe(s => s === 'SUBSCRIBED' && setIsLive(true)),
      supabase.channel('unified_games').on('postgres_changes', { event: '*', schema: 'public', table: 'uploaded_games' }, () => fetchAllData()).subscribe(),
      supabase.channel('unified_plays').on('postgres_changes', { event: '*', schema: 'public', table: 'game_plays' }, () => fetchAllData()).subscribe(),
      supabase.channel('unified_lovable').on('postgres_changes', { event: '*', schema: 'public', table: 'lovable_games' }, () => fetchAllData()).subscribe(),
      supabase.channel('unified_donations').on('postgres_changes', { event: '*', schema: 'public', table: 'platform_donations' }, () => fetchAllData()).subscribe(),
    ];

    return () => {
      setIsLive(false);
      channels.forEach(ch => supabase.removeChannel(ch));
    };
  }, [fetchAllData]);

  // Fire confetti when ranking loads
  useEffect(() => {
    if (!rankingLoading && topUsers.length > 0 && !confettiFired) {
      setConfettiFired(true);
      confetti({ particleCount: 40, spread: 60, origin: { x: 0.5, y: 0.6 }, colors: ["#FFD700", "#FFA500", "#FFEC8B"], ticks: 80, gravity: 1.2, scalar: 0.8 });
    }
  }, [rankingLoading, topUsers, confettiFired]);

  const maxValue = Math.max(stats.totalUsers, stats.totalGames, stats.totalPlays, stats.totalUploads, stats.totalCamly, 1);
  const maxBalance = topUsers[0]?.wallet_balance || 1;
  const top3Users = topUsers.slice(0, 3);
  const remainingUsers = topUsers.slice(3, 7);

  const statItems = [
    { icon: Users, label: "Users", value: stats.totalUsers, bgColor: "bg-purple-500", accentColor: "#a855f7", suffix: "players" },
    { icon: Gamepad2, label: "Games", value: stats.totalGames, bgColor: "bg-teal-500", accentColor: "#14b8a6", suffix: "titles" },
    { icon: Play, label: "Players", value: stats.totalPlays, bgColor: "bg-pink-500", accentColor: "#ec4899", suffix: "gamers" },
    { icon: Upload, label: "Uploads", value: stats.totalUploads, bgColor: "bg-green-500", accentColor: "#22c55e", suffix: "games" },
    { icon: Gem, label: "CAMLY", value: stats.totalCamly, bgColor: "bg-rose-500", accentColor: "#f43f5e", suffix: "💎" },
  ];

  return (
    <>
      <style>{`
        @keyframes shimmer { 0% { background-position: 200% 50%; } 100% { background-position: -200% 50%; } }
        @keyframes metallic-shine { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
      `}</style>

      <div className="relative">
        {/* Outer Gold Glow */}
        <div className="absolute rounded-3xl pointer-events-none" style={{ inset: "-12px", boxShadow: "0 0 30px rgba(255, 215, 0, 0.5), 0 0 50px rgba(255, 165, 0, 0.3), 0 0 80px rgba(255, 215, 0, 0.2)", zIndex: -15 }} />

        {/* Gold Metallic Border */}
        <div className="absolute rounded-3xl animate-metallic-shine" style={{ inset: "-8px", background: "linear-gradient(135deg, #FFD700 0%, #FFFACD 10%, #FFF8DC 20%, #FFD700 35%, #B8860B 50%, #FFD700 65%, #FFF8DC 80%, #FFFACD 90%, #FFD700 100%)", backgroundSize: "200% 200%", animation: "metallic-shine 4s ease infinite", boxShadow: "0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.5), inset 0 -1px 3px rgba(0, 0, 0, 0.3)", zIndex: -10 }} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-4 shadow-xl"
          style={{ background: "linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(49, 46, 129, 0.85) 50%, rgba(30, 58, 138, 0.9) 100%)" }}
        >
          {/* Inner Border */}
          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ border: "2px solid rgba(255, 215, 0, 0.7)", boxShadow: "inset 0 0 25px rgba(255, 215, 0, 0.3)", zIndex: 5 }} />

          {/* Video Background */}
          <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover rounded-3xl z-0" style={{ opacity: 0.15 }}>
            <source src="/videos/honor-board-bg.mp4" type="video/mp4" />
          </video>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-3xl z-[1]" />

          {/* Floating Particles */}
          {floatingParticles.map((particle, index) => (
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

          {/* =============== 3-COLUMN GRID =============== */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 md:gap-0">
            
            {/* ========== SECTION 1: HONOR BOARD ========== */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-center gap-2">
                <motion.span className="text-base" animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>🌍</motion.span>
                <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-lg sm:text-xl font-bold text-transparent" style={{ backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }}>HONOR BOARD</h3>
                <motion.span className="text-base" animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}>🏆</motion.span>
              </div>
              <div className="flex flex-col gap-1.5">
                {statItems.map((item, index) => {
                  const progressPercent = Math.min((item.value / maxValue) * 100, 100);
                  const isCamly = item.label === "CAMLY";
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="relative flex items-center gap-2 rounded-xl p-1.5 px-2.5 overflow-hidden cursor-pointer transition-all"
                      style={{ background: "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,215,0,0.05) 100%)", borderLeft: `4px solid ${item.accentColor}`, ...(isCamly && { border: "2px solid rgba(244, 63, 94, 0.6)", borderLeft: `4px solid ${item.accentColor}`, boxShadow: "0 0 20px rgba(244, 63, 94, 0.3)" }) }}
                    >
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <motion.div className="h-full" style={{ background: `linear-gradient(90deg, ${item.accentColor}50 0%, ${item.accentColor}20 50%, transparent 100%)` }} initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1.5, delay: index * 0.15, ease: "easeOut" }} />
                      </div>
                      <motion.div className={`relative z-10 rounded-lg ${item.bgColor} p-1.5 flex-shrink-0`} style={{ boxShadow: `0 0 15px ${item.accentColor}80` }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}>
                        <item.icon className="h-3.5 w-3.5 text-white" />
                      </motion.div>
                      <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                        <span className="text-sm font-bold text-yellow-200">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {isCamly && <Gem className="h-3 w-3 text-rose-400" />}
                          <span className="text-sm font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]" style={{ textShadow: '0 0 8px #fff' }}>
                            {statsLoading ? <span className="animate-pulse">...</span> : <AnimatedCounter value={item.value} />}
                          </span>
                          <span className="text-xs text-white/80">{item.suffix}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* VERTICAL DIVIDER 1 */}
            <VerticalGoldDivider />

            {/* ========== SECTION 2: LEGENDS BOARD ========== */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-center gap-2">
                <motion.span className="text-base" animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity }}>👑</motion.span>
                <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-lg sm:text-xl font-bold text-transparent" style={{ backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }}>LEGENDS</h3>
                <motion.span className="text-base" animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}>👑</motion.span>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setActiveTab("creators")}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "creators" ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg" : "bg-white/10 !text-yellow-400 hover:bg-white/20"}`}
                >
                  <Gamepad2 className="h-3.5 w-3.5" />
                  <span>Creators</span>
                </button>
                <button
                  onClick={() => setActiveTab("donors")}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "donors" ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg" : "bg-white/10 !text-yellow-400 hover:bg-white/20"}`}
                >
                  <Gem className="h-3.5 w-3.5" />
                  <span>Donors</span>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <AnimatePresence mode="wait">
                  {legendsLoading ? (
                    <motion.div key="loading" className="flex items-center justify-center h-24"><div className="animate-pulse text-white/70">Loading...</div></motion.div>
                  ) : activeTab === "creators" ? (
                    <motion.div key="creators" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-1">
                      {creators.length === 0 ? (
                        <div className="text-center text-white/60 py-4 text-sm">Chưa có creator nào</div>
                      ) : (
                        creators.map((creator, index) => {
                          const badge = getCreatorBadge(creator.games_count);
                          return (
                            <motion.div key={creator.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-2 p-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all cursor-pointer">
                              <span className="text-sm w-6 text-center font-bold text-white">{getRankIcon(index + 1)}</span>
                              <Avatar className="h-7 w-7 border border-white/30">
                                <AvatarImage src={creator.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-xs"><User className="h-3 w-3 text-white" /></AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold truncate text-white">{creator.username}</div>
                                <div className={`text-[10px] ${badge.color}`}>{badge.label}</div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-white"><Gamepad2 className="h-3 w-3 text-teal-400" />{creator.games_count}</div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </motion.div>
                  ) : (
                    <motion.div key="donors" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-1">
                      {donors.length === 0 ? (
                        <div className="text-center py-4 text-white text-sm"><Heart className="h-6 w-6 mx-auto mb-1 text-rose-400" /><p>Chưa có ai ủng hộ</p></div>
                      ) : (
                        donors.map((donor, index) => {
                          const badge = getDonorBadge(donor.total_donated);
                          return (
                            <motion.div key={donor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-2 p-1.5 rounded-xl bg-white/10 hover:bg-white/15 transition-all cursor-pointer">
                              <span className="text-sm w-6 text-center font-bold text-white">{getRankIcon(index + 1)}</span>
                              <Avatar className="h-7 w-7 border border-white/30">
                                {donor.is_anonymous ? <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-700 text-sm">🎭</AvatarFallback> : <><AvatarImage src={donor.avatar_url || undefined} /><AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-500"><User className="h-3 w-3 text-white" /></AvatarFallback></>}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate">{donor.username}</div>
                                <div className={`text-[10px] ${badge.color}`}>{badge.label}</div>
                              </div>
                              <div className="flex items-center gap-1 text-xs font-bold text-rose-300"><Gem className="h-3 w-3" /><span className="text-white">{donor.total_donated.toLocaleString()}</span></div>
                            </motion.div>
                          );
                        })
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Donate Button */}
              <Button onClick={() => setShowDonateModal(true)} className="mt-2 w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold py-1.5 rounded-xl shadow-lg text-sm">
                <Heart className="h-3.5 w-3.5 mr-1" />Donate CAMLY
              </Button>
            </div>

            {/* VERTICAL DIVIDER 2 */}
            <VerticalGoldDivider />

            {/* ========== SECTION 3: TOP RANKING ========== */}
            <div className="flex flex-col">
              <div className="mb-2 flex items-center justify-center gap-2">
                <motion.span className="text-base" animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>🏆</motion.span>
                <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-lg sm:text-xl font-bold text-transparent" style={{ backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }}>TOP RANKING</h3>
                <motion.span className="text-base" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>⭐</motion.span>
                <button onClick={() => fetchTopUsers(true)} disabled={refreshing} className="absolute right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50">
                  <RefreshCw className={`h-3.5 w-3.5 text-yellow-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {rankingLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="flex items-center gap-2 rounded-xl bg-white/10 p-2"><div className="h-8 w-8 animate-pulse rounded-full bg-white/20" /><div className="flex-1"><div className="h-3 w-20 animate-pulse rounded bg-white/20" /></div></div>)}</div>
              ) : (
                <>
                  {/* PODIUM */}
                  <div className="flex items-end justify-center gap-2 mb-2">
                    {top3Users[1] && <div className="w-1/3 order-1"><PodiumCard user={top3Users[1]} rank={2} maxBalance={maxBalance} isCurrentUser={user?.id === top3Users[1].id} /></div>}
                    {top3Users[0] && <div className="w-1/3 order-2"><PodiumCard user={top3Users[0]} rank={1} maxBalance={maxBalance} isCurrentUser={user?.id === top3Users[0].id} /></div>}
                    {top3Users[2] && <div className="w-1/3 order-3"><PodiumCard user={top3Users[2]} rank={3} maxBalance={maxBalance} isCurrentUser={user?.id === top3Users[2].id} /></div>}
                  </div>

                  {/* Remaining Users */}
                  {remainingUsers.length > 0 && (
                    <div className="space-y-1">
                      {remainingUsers.map((rankedUser, index) => {
                        const rank = index + 4;
                        const isCurrentUser = user?.id === rankedUser.id;
                        return (
                          <HoverCard key={rankedUser.id} openDelay={200}>
                            <HoverCardTrigger asChild>
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 + 0.5 }}
                                whileHover={{ scale: 1.02 }}
                                className={`flex items-center gap-2 rounded-xl border p-1.5 cursor-pointer transition-all border-white/35 bg-gradient-to-r from-white/15 to-white/10 ${isCurrentUser ? "ring-2 ring-yellow-400" : ""}`}
                              >
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500/30">
                                  <span className="text-xs font-bold text-yellow-300">#{rank}</span>
                                </div>
                                <Avatar className="h-7 w-7 border border-white/40">
                                  <AvatarImage src={rankedUser.avatar_url || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xs">{rankedUser.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                                </Avatar>
                                <p className={`flex-1 truncate text-xs font-bold ${isCurrentUser ? "text-yellow-300" : "text-white"}`}>{rankedUser.username}</p>
                                <div className="flex items-center gap-1 rounded-full bg-yellow-500/40 px-2 py-0.5 border border-yellow-400/70">
                                  <Gem className="h-3 w-3 text-white" />
                                  <span className="text-xs font-bold text-white"><AnimatedCounter value={rankedUser.wallet_balance || 0} /></span>
                                </div>
                              </motion.div>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-56 bg-gradient-to-br from-purple-500/95 via-pink-500/90 to-yellow-400/95 border-pink-400/50" side="top">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border-2 border-yellow-400/50">
                                  <AvatarImage src={rankedUser.avatar_url || undefined} />
                                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">{rankedUser.username?.charAt(0).toUpperCase() || "?"}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-bold text-white">{rankedUser.username}</p>
                                  <div className="flex items-center gap-1 mt-0.5"><Gem className="h-3 w-3 text-white" /><span className="text-xs font-bold text-white">{(rankedUser.wallet_balance || 0).toLocaleString()} CAMLY</span></div>
                                  <p className="text-[10px] text-white mt-0.5">🏆 Rank: #{rank}</p>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* View All Button */}
              <Button onClick={() => navigate("/full-ranking")} variant="outline" className="mt-2 w-full rounded-xl border-2 border-yellow-400/60 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 font-bold text-yellow-100 hover:border-yellow-300 text-sm py-1.5">
                Xem Tất Cả<ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      <DonateCAMLYModal open={showDonateModal} onOpenChange={setShowDonateModal} />
    </>
  );
};
