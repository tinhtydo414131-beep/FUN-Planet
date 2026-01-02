import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, ChevronLeft, ChevronRight, Gem, RefreshCw, Search, Trophy, Users, Wifi, WifiOff, Send, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRankingRealtime } from "@/hooks/useRealtimeConnection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import confetti from "canvas-confetti";
import { TransferModal } from "@/components/TransferModal";
import { toast } from "sonner";

interface RankedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_balance: number | null;
  wallet_address: string | null;
  claimed_amount: number | null;
  total_earned?: number | null;
}

const USERS_PER_PAGE = 20;

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const steps = 20;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// Rank Badge Component
const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full text-xs font-bold text-black shadow-lg"
        >
          ⭐ CHAMPION ⭐
        </motion.div>
      );
    case 2:
      return (
        <div className="px-3 py-1 bg-gradient-to-r from-slate-300 to-gray-400 rounded-full text-xs font-bold text-gray-800">
          🥈 SILVER
        </div>
      );
    case 3:
      return (
        <div className="px-3 py-1 bg-gradient-to-r from-orange-400 to-amber-600 rounded-full text-xs font-bold text-white">
          🥉 BRONZE
        </div>
      );
    default:
      return null;
  }
};

// Glowing Ring Component for Podium
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
      style={{
        background: colors[rank as keyof typeof colors] || colors[1],
        padding: "3px",
      }}
    />
  );
};

// Podium Card Component
const PodiumCard = ({
  user,
  rank,
  isCurrentUser,
  currentUserId,
  onTransfer,
}: {
  user: RankedUser;
  rank: number;
  isCurrentUser: boolean;
  currentUserId?: string;
  onTransfer: (user: RankedUser) => void;
}) => {
  const heights = { 1: "h-24", 2: "h-16", 3: "h-14" };
  const avatarSizes = { 1: "h-20 w-20", 2: "h-16 w-16", 3: "h-14 w-14" };
  const ringColors = {
    1: "border-yellow-400 shadow-[0_0_25px_rgba(255,215,0,0.9)]",
    2: "border-slate-300 shadow-[0_0_20px_rgba(192,192,192,0.7)]",
    3: "border-orange-400 shadow-[0_0_20px_rgba(205,127,50,0.7)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.2 : rank === 2 ? 0.1 : 0.3 }}
      className="flex flex-col items-center"
    >
      {/* Avatar with Glowing Ring */}
      <div className="relative mb-3">
        {/* Pulse Glow */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full blur-md ${
            rank === 1
              ? "bg-yellow-500/50"
              : rank === 2
              ? "bg-slate-400/40"
              : "bg-orange-500/40"
          }`}
          style={{ transform: "scale(1.2)" }}
        />

        {/* Spinning Ring */}
        <div className="relative">
          <GlowingRing rank={rank} />
          <Avatar
            className={`relative z-10 ${avatarSizes[rank as keyof typeof avatarSizes]} border-4 ${
              ringColors[rank as keyof typeof ringColors]
            }`}
          >
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl">
              {user.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Crown for #1 */}
        {rank === 1 && (
          <motion.div
            animate={{ y: [0, -4, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-5 left-1/2 -translate-x-1/2"
          >
            <Crown className="h-8 w-8 text-yellow-400 drop-shadow-[0_0_15px_rgba(255,215,0,1)]" />
          </motion.div>
        )}
      </div>

      {/* Badge */}
      <div className="mb-2">{getRankBadge(rank)}</div>

      {/* Username */}
      <p
        className={`text-base font-bold truncate max-w-[140px] text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] ${
          isCurrentUser ? "text-yellow-300" : "text-white"
        }`}
        style={{ textShadow: "0 0 10px rgba(255,255,255,0.5)" }}
      >
        {user.username}
      </p>

      {/* Balance */}
      <div className="flex items-center gap-1.5 mt-2">
        <Gem className="h-4 w-4 text-yellow-400 drop-shadow-[0_0_10px_rgba(255,255,0,0.9)]" />
        <span 
          className="text-lg font-extrabold bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent"
          style={{ textShadow: "0 0 15px rgba(255,255,255,0.9)" }}
        >
          <AnimatedCounter value={user.wallet_balance || 0} duration={1500} />
        </span>
      </div>

      {/* Claimed Amount */}
      <div className="flex items-center gap-1 mt-1">
        <Gift className="h-3 w-3 text-green-400" />
        <span className="text-xs text-green-300">
          {(user.claimed_amount || 0).toLocaleString()} đã nhận
        </span>
      </div>

      {/* Transfer Button */}
      {!isCurrentUser && currentUserId && (
        <div className="mt-2">
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onTransfer(user);
            }}
            disabled={!user.wallet_address}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs px-3 py-1 h-7"
          >
            <Send className="w-3 h-3 mr-1" />
            Gửi
          </Button>
        </div>
      )}

      {/* Podium Base */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className={`${heights[rank as keyof typeof heights]} w-28 mt-3 rounded-t-xl ${
          rank === 1
            ? "bg-gradient-to-t from-yellow-600/70 to-yellow-400/50 border-2 border-yellow-400/70"
            : rank === 2
            ? "bg-gradient-to-t from-slate-500/60 to-slate-300/40 border-2 border-slate-300/60"
            : "bg-gradient-to-t from-orange-600/60 to-orange-400/40 border-2 border-orange-400/60"
        }`}
        style={{
          boxShadow:
            rank === 1
              ? "0 0 25px rgba(255, 215, 0, 0.5)"
              : rank === 2
              ? "0 0 20px rgba(192, 192, 192, 0.4)"
              : "0 0 20px rgba(205, 127, 50, 0.4)",
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-3xl font-black bg-gradient-to-b from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,1)]">
            #{rank}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

// User Row Component
const UserRow = ({
  user,
  rank,
  isCurrentUser,
  index,
  currentUserId,
  onTransfer,
}: {
  user: RankedUser;
  rank: number;
  isCurrentUser: boolean;
  index: number;
  currentUserId?: string;
  onTransfer: (user: RankedUser) => void;
}) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => navigate(`/profile/${user.id}`)}
      className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
        isCurrentUser
          ? "bg-gradient-to-r from-yellow-500/30 to-amber-500/20 border-2 border-yellow-400/60 ring-2 ring-yellow-400/40"
          : "bg-white/10 border border-white/20 hover:bg-white/15"
      }`}
      style={{
        boxShadow: isCurrentUser ? "0 0 20px rgba(255, 215, 0, 0.3)" : "0 4px 15px rgba(0, 0, 0, 0.2)",
      }}
    >
      {/* Rank */}
      <div className="w-10 sm:w-12 flex justify-center shrink-0">
        <span 
          className="text-xl sm:text-2xl font-black bg-gradient-to-b from-yellow-300 to-amber-500 bg-clip-text text-transparent"
          style={{ textShadow: "0 0 8px rgba(255,215,0,0.5)" }}
        >
          #{rank}
        </span>
      </div>

      {/* Avatar */}
      <Avatar className={`w-10 h-10 sm:w-12 sm:h-12 border-2 shrink-0 ${
        isCurrentUser ? "border-yellow-400" : "border-white/40"
      }`}>
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
          {user.username?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <p 
          className={`font-bold text-sm sm:text-base truncate ${
            isCurrentUser ? "text-yellow-300" : "text-white"
          }`}
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}
        >
          {user.username || "Anonymous"}
          {isCurrentUser && <span className="text-yellow-400 ml-1.5">(Bạn)</span>}
        </p>
      </div>

      {/* Claimed Amount */}
      <div className="flex items-center gap-1 shrink-0">
        <Gift className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
        <span className="text-xs sm:text-sm text-green-300 font-medium">
          {(user.claimed_amount || 0).toLocaleString()}
        </span>
      </div>

      {/* Balance */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Gem className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(255,255,0,0.8)]" />
        <span 
          className="font-extrabold text-sm sm:text-base bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent"
          style={{ textShadow: "0 0 10px rgba(255,255,255,0.7)" }}
        >
          {(user.wallet_balance || 0).toLocaleString()}
        </span>
      </div>

      {/* Transfer Button */}
      {!isCurrentUser && currentUserId && (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            onClick={() => onTransfer(user)}
            disabled={!user.wallet_address}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white text-xs px-2 py-1 h-7 shrink-0"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default function FullRanking() {
  const [allUsers, setAllUsers] = useState<RankedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [confettiFired, setConfettiFired] = useState(false);
  const [realtimeUpdated, setRealtimeUpdated] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<{ address: string; username: string } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleTransfer = (targetUser: RankedUser) => {
    if (!targetUser.wallet_address) {
      toast.error("Người dùng chưa kết nối ví");
      return;
    }
    setSelectedRecipient({
      address: targetUser.wallet_address,
      username: targetUser.username || "User"
    });
    setTransferModalOpen(true);
  };

  const fetchAllUsers = useCallback(async (isRefresh = false, isRealtime = false) => {
    try {
      if (isRefresh && !isRealtime) setRefreshing(true);

      // Sử dụng view leaderboard_stats để lấy dữ liệu đã sync chính xác
      // View này tính: pending_balance = wallet_balance, total_claimed từ user_rewards
      const { data: statsData, error: statsError } = await supabase
        .from("leaderboard_stats")
        .select("*");

      if (statsError) {
        console.error("Error fetching leaderboard_stats:", statsError);
        // Fallback to old method if view fails
        const { data: profilesData, error: profilesError, count } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, wallet_balance, wallet_address", { count: "exact" })
          .order("wallet_balance", { ascending: false, nullsFirst: false });

        if (profilesError) throw profilesError;

        const userIds = (profilesData || []).map(p => p.id);
        const { data: rewardsData } = await supabase
          .from("user_rewards")
          .select("user_id, claimed_amount")
          .in("user_id", userIds);

        const rewardsMap = new Map<string, number>();
        (rewardsData || []).forEach(r => {
          rewardsMap.set(r.user_id, r.claimed_amount || 0);
        });

        const usersWithEarnings: RankedUser[] = (profilesData || []).map(p => ({
          ...p,
          claimed_amount: rewardsMap.get(p.id) || 0,
          total_earned: (p.wallet_balance || 0) + (rewardsMap.get(p.id) || 0)
        }));

        // Sort by total_earned descending
        usersWithEarnings.sort((a, b) => (b.total_earned || 0) - (a.total_earned || 0));

        setAllUsers(usersWithEarnings);
        setFilteredUsers(usersWithEarnings);
        setTotalUsers(count || 0);
      } else {
        // Use view data - already sorted by total_earned DESC
        const usersFromView: RankedUser[] = (statsData || []).map(s => ({
          id: s.user_id,
          username: s.username,
          avatar_url: s.avatar_url,
          wallet_balance: s.pending_balance,
          wallet_address: s.wallet_address,
          claimed_amount: s.total_claimed,
          total_earned: s.total_earned
        }));

        setAllUsers(usersFromView);
        setFilteredUsers(usersFromView);
        setTotalUsers(usersFromView.length);
      }
      
      // Show update indicator for realtime updates
      if (isRealtime) {
        setRealtimeUpdated(true);
        setTimeout(() => setRealtimeUpdated(false), 2000);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Realtime ranking updates
  const { isConnected: isRealtimeConnected } = useRankingRealtime(
    useCallback(() => {
      console.log('[FullRanking] Realtime update triggered');
      fetchAllUsers(true, true);
    }, [fetchAllUsers]),
    true
  );

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  // Fire confetti on load
  useEffect(() => {
    if (!loading && allUsers.length > 0 && !confettiFired) {
      setConfettiFired(true);
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#FFD700", "#FFA500", "#FFEC8B", "#FF6B35", "#FFE066"],
        ticks: 120,
      });
    }
  }, [loading, allUsers, confettiFired]);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter((u) =>
        u.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
    setCurrentPage(1);
  }, [searchQuery, allUsers]);

  const top3Users = allUsers.slice(0, 3);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const findUserRank = (userId: string) => {
    return allUsers.findIndex((u) => u.id === userId) + 1;
  };

  const currentUserRank = user ? findUserRank(user.id) : null;

  // Floating particles
  const floatingParticles = [
    { emoji: "✨", x: "5%", y: "10%", duration: 4 },
    { emoji: "⭐", x: "90%", y: "15%", duration: 5 },
    { emoji: "💎", x: "10%", y: "60%", duration: 4.5 },
    { emoji: "🌟", x: "85%", y: "55%", duration: 3.5 },
    { emoji: "💫", x: "50%", y: "5%", duration: 4 },
    { emoji: "🔥", x: "75%", y: "30%", duration: 5.5 },
    { emoji: "🚀", x: "20%", y: "40%", duration: 4.2 },
    { emoji: "✨", x: "60%", y: "70%", duration: 3.8 },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 -z-10" />
      
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover -z-10"
        style={{ opacity: 0.4 }}
      >
        <source src="/videos/ranking-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="fixed inset-0 bg-black/40 -z-10" />

      {/* Floating Particles */}
      {floatingParticles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: p.duration, repeat: Infinity }}
          className="fixed text-2xl pointer-events-none z-0"
          style={{ left: p.x, top: p.y }}
        >
          {p.emoji}
        </motion.div>
      ))}

      {/* CSS Keyframes */}
      <style>
        {`
          @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}
      </style>

      <div className="relative z-10 container mx-auto px-3 sm:px-4 py-6 pb-28 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/")}
            className="shrink-0 bg-white/10 border-white/30 hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 text-white drop-shadow-lg">
              <Trophy className="w-6 h-6 text-yellow-400" />
              <span 
                className="bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent"
                style={{ textShadow: "0 0 20px rgba(255,215,0,0.5)" }}
              >
                Bảng Xếp Hạng Toàn Cầu
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-white/70 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span className="font-semibold text-yellow-300">{totalUsers.toLocaleString()}</span> người chơi
              </p>
              {/* Realtime indicator */}
              <div className="flex items-center gap-1">
                {isRealtimeConnected ? (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-1"
                  >
                    <Wifi className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400">Live</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-1">
                    <WifiOff className="w-3 h-3 text-red-400" />
                    <span className="text-xs text-red-400">Offline</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Realtime update notification */}
          <AnimatePresence>
            {realtimeUpdated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-green-500/90 rounded-full text-white text-sm font-medium shadow-lg z-50"
              >
                ✨ Đã cập nhật thứ hạng!
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchAllUsers(true, false)}
            disabled={refreshing}
            className="shrink-0 bg-white/10 border-white/30 hover:bg-white/20"
          >
            <RefreshCw className={`h-4 w-4 text-white ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </motion.div>

        {/* Current User Rank */}
        {user && currentUserRank && currentUserRank > 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-2 border-yellow-400/50"
            style={{ boxShadow: "0 0 30px rgba(255,215,0,0.2)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm">Thứ hạng của bạn</span>
              <div className="flex items-center gap-3">
                <span 
                  className="text-3xl font-black bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent"
                  style={{ textShadow: "0 0 15px rgba(255,215,0,0.5)" }}
                >
                  #{currentUserRank}
                </span>
                <span className="text-white/60 text-sm">/ {totalUsers}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {!loading && top3Users.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 sm:p-6 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/20"
            style={{ boxShadow: "0 0 40px rgba(255,215,0,0.15)" }}
          >
            <div className="flex justify-center items-end gap-2 sm:gap-6">
              {/* 2nd Place */}
              <PodiumCard
                user={top3Users[1]}
                rank={2}
                isCurrentUser={user?.id === top3Users[1]?.id}
                currentUserId={user?.id}
                onTransfer={handleTransfer}
              />
              {/* 1st Place */}
              <PodiumCard
                user={top3Users[0]}
                rank={1}
                isCurrentUser={user?.id === top3Users[0]?.id}
                currentUserId={user?.id}
                onTransfer={handleTransfer}
              />
              {/* 3rd Place */}
              <PodiumCard
                user={top3Users[2]}
                rank={3}
                isCurrentUser={user?.id === top3Users[2]?.id}
                currentUserId={user?.id}
                onTransfer={handleTransfer}
              />
            </div>
          </motion.div>
        )}

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
            <Input
              placeholder="Tìm kiếm người chơi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:ring-yellow-400/50 focus:border-yellow-400/50"
            />
          </div>
        </motion.div>

        {/* User List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full" />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-16 text-white/60">
              {searchQuery ? "Không tìm thấy người chơi" : "Chưa có dữ liệu"}
            </div>
          ) : (
            paginatedUsers.map((u, index) => {
              const actualRank = filteredUsers.findIndex((fu) => fu.id === u.id) + 1;
              return (
                <UserRow
                  key={u.id}
                  user={u}
                  rank={actualRank}
                  isCurrentUser={user?.id === u.id}
                  index={index}
                  currentUserId={user?.id}
                  onTransfer={handleTransfer}
                />
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mt-8"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 ${
                      currentPage === pageNum
                        ? "bg-yellow-500/80 border-yellow-400 text-black font-bold"
                        : "bg-white/10 border-white/30 text-white hover:bg-white/20"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Page Info */}
        {totalPages > 1 && (
          <p className="text-center text-white/50 text-sm mt-4">
            Trang {currentPage} / {totalPages} ({filteredUsers.length} người chơi)
          </p>
        )}
      </div>

      {/* Transfer Modal */}
      <TransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        recipientAddress={selectedRecipient?.address || ""}
        recipientUsername={selectedRecipient?.username || ""}
      />
    </div>
  );
}
