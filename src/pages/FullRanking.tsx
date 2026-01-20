import { useState, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Medal, ChevronLeft, ChevronRight, Gem, RefreshCw, Search, Trophy, Users, Wifi, WifiOff, Send, Gift, Clock, Award, Star, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRankingRealtime } from "@/hooks/useRealtimeConnection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import confetti from "canvas-confetti";
import { TransferModal } from "@/components/TransferModal";
import { toast } from "sonner";
import AchievementLeaderboard from "@/components/leaderboard/AchievementLeaderboard";
import { UserProfileModal } from "@/components/ranking/UserProfileModal";

interface RankedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_balance: number | null;
  wallet_address: string | null;
  pending_amount: number;
  claimed_amount: number;
  total_camly: number;
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

// Podium Card Component - White Theme
const PodiumCard = memo(({
  user,
  rank,
  isCurrentUser,
  currentUserId,
  onTransfer,
  onUserClick,
}: {
  user: RankedUser;
  rank: number;
  isCurrentUser: boolean;
  currentUserId?: string;
  onTransfer: (user: RankedUser) => void;
  onUserClick: (user: RankedUser, rank: number) => void;
}) => {
  const heights = { 1: "h-24", 2: "h-16", 3: "h-14" };
  const avatarSizes = { 1: "h-20 w-20", 2: "h-16 w-16", 3: "h-14 w-14" };
  const ringColors = {
    1: "border-yellow-400 shadow-[0_0_25px_rgba(255,215,0,0.6)]",
    2: "border-slate-300 shadow-[0_0_20px_rgba(192,192,192,0.5)]",
    3: "border-orange-400 shadow-[0_0_20px_rgba(205,127,50,0.5)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.2 : rank === 2 ? 0.1 : 0.3 }}
      className="flex flex-col items-center cursor-pointer"
      onClick={() => onUserClick(user, rank)}
    >
      {/* Avatar with Glowing Ring */}
      <div className="relative mb-3">
        {/* Pulse Glow */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full blur-md ${
            rank === 1
              ? "bg-yellow-400/40"
              : rank === 2
              ? "bg-slate-300/30"
              : "bg-orange-400/30"
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
            <AvatarFallback className="bg-gradient-to-br from-pink-400 to-blue-400 text-white font-bold text-xl">
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
            <Crown className="h-8 w-8 text-yellow-500 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          </motion.div>
        )}
      </div>

      {/* Badge */}
      <div className="mb-2">{getRankBadge(rank)}</div>

      {/* Username */}
      <p
        className={`text-base font-bold truncate max-w-[140px] text-center ${
          isCurrentUser ? "text-pink-500" : "text-gray-800"
        }`}
      >
        {user.username}
      </p>

      {/* Total CAMLY */}
      <div className="flex items-center gap-1.5 mt-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Gem className="h-4 w-4 text-yellow-500 drop-shadow-[0_0_6px_rgba(255,255,0,0.6)] cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-white border-pink-200 shadow-lg max-w-xs">
              <div className="text-pink-500 font-bold mb-1">💎 Tổng CAMLY</div>
              <p className="text-gray-600 text-xs">Tổng số CAMLY (chờ claim + đã claim). Xếp hạng theo giá trị này.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-lg font-extrabold bg-gradient-to-r from-yellow-500 via-pink-500 to-yellow-500 bg-clip-text text-transparent">
          <AnimatedCounter value={user.total_camly || 0} duration={1500} />
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
            className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white text-xs px-3 py-1 h-7 shadow-md"
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
            ? "bg-gradient-to-t from-yellow-400/80 to-yellow-300/60 border-2 border-yellow-400"
            : rank === 2
            ? "bg-gradient-to-t from-slate-400/60 to-slate-300/40 border-2 border-slate-300"
            : "bg-gradient-to-t from-orange-400/60 to-orange-300/40 border-2 border-orange-400"
        }`}
        style={{
          boxShadow:
            rank === 1
              ? "0 4px 20px rgba(255, 215, 0, 0.3)"
              : rank === 2
              ? "0 4px 15px rgba(192, 192, 192, 0.25)"
              : "0 4px 15px rgba(205, 127, 50, 0.25)",
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-3xl font-black bg-gradient-to-b from-yellow-500 to-pink-500 bg-clip-text text-transparent">
            #{rank}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
});
PodiumCard.displayName = 'PodiumCard';

// User Row Component - White Theme
const UserRow = memo(({
  user,
  rank,
  isCurrentUser,
  index,
  currentUserId,
  onTransfer,
  onUserClick,
}: {
  user: RankedUser;
  rank: number;
  isCurrentUser: boolean;
  index: number;
  currentUserId?: string;
  onTransfer: (user: RankedUser) => void;
  onUserClick: (user: RankedUser, rank: number) => void;
}) => {
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onUserClick(user, rank)}
      className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ${
        isCurrentUser
          ? "bg-gradient-to-r from-yellow-50 to-pink-50 border-2 border-yellow-400/60 shadow-[0_0_20px_rgba(255,215,0,0.15)]"
          : "bg-white border border-gray-200 hover:border-pink-200 hover:shadow-md"
      }`}
    >
      {/* Rank */}
      <div className="w-10 sm:w-12 flex justify-center shrink-0">
        <span className="text-xl sm:text-2xl font-black bg-gradient-to-b from-yellow-500 to-pink-500 bg-clip-text text-transparent">
          #{rank}
        </span>
      </div>

      {/* Avatar */}
      <Avatar className={`w-10 h-10 sm:w-12 sm:h-12 border-2 shrink-0 ${
        isCurrentUser ? "border-yellow-400" : "border-gray-200"
      }`}>
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-blue-400 text-white font-bold">
          {user.username?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm sm:text-base truncate ${
          isCurrentUser ? "text-pink-600" : "text-gray-800"
        }`}>
          {user.username || "Anonymous"}
          {isCurrentUser && <span className="text-yellow-500 ml-1.5">(Bạn)</span>}
        </p>
      </div>

      {/* Total CAMLY */}
      <div className="flex items-center gap-1.5 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Gem className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 drop-shadow-[0_0_5px_rgba(255,255,0,0.5)] cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="bg-white border-pink-200 shadow-lg max-w-xs">
              <div className="text-pink-500 font-bold mb-1">💎 Tổng CAMLY</div>
              <p className="text-gray-600 text-xs">Tổng số CAMLY (chờ claim + đã claim). Xếp hạng theo giá trị này.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="font-extrabold text-sm sm:text-base bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
          {(user.total_camly || 0).toLocaleString()}
        </span>
      </div>

      {/* Transfer Button */}
      {!isCurrentUser && currentUserId && (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            onClick={() => onTransfer(user)}
            className="bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white text-xs px-2 py-1 h-7 shrink-0 shadow-md"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      )}
    </motion.div>
  );
});
UserRow.displayName = 'UserRow';

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
  const [activeTab, setActiveTab] = useState("camly");
  const [selectedRecipient, setSelectedRecipient] = useState<{ 
    id: string; 
    username: string; 
    avatar?: string | null;
    walletAddress?: string | null;
  } | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState<{ user: RankedUser; rank: number } | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleUserClick = (targetUser: RankedUser, rank: number) => {
    console.log('[FullRanking] User clicked:', {
      userId: targetUser.id,
      username: targetUser.username,
      rank,
      totalCamly: targetUser.total_camly
    });
    
    if (!targetUser.id) {
      console.error('[FullRanking] targetUser.id is missing!');
      toast.error('Không thể hiển thị thông tin user này');
      return;
    }
    
    setSelectedUserForModal({ user: targetUser, rank });
    setUserModalOpen(true);
  };

  const handleTransfer = (targetUser: RankedUser) => {
    setSelectedRecipient({
      id: targetUser.id,
      username: targetUser.username || "User",
      avatar: targetUser.avatar_url,
      walletAddress: targetUser.wallet_address
    });
    setTransferModalOpen(true);
  };

  const fetchAllUsers = useCallback(async (isRefresh = false, isRealtime = false) => {
    try {
      if (isRefresh && !isRealtime) setRefreshing(true);

      console.log("[FullRanking] Fetching all users via RPC...");
      
      // Use RPC to bypass RLS and get ALL users for ranking
      // Pass a high limit (1000) to get all users
      const { data, error: rpcError } = await supabase
        .rpc('get_public_ranking' as any, { limit_count: 1000 }) as { 
          data: any[] | null; 
          error: any 
        };

      if (rpcError) {
        console.error("[FullRanking] RPC error:", rpcError);
        throw rpcError;
      }

      const usersWithEarnings: RankedUser[] = (data || []).map((row: any) => ({
        id: row.user_id, // ✅ Sửa từ row.id thành row.user_id (RPC trả về user_id)
        username: (row.username || 'Unknown').trim(),
        avatar_url: row.avatar_url,
        wallet_balance: Number(row.wallet_balance) || 0,
        wallet_address: null,
        pending_amount: Number(row.pending_amount) || 0,
        claimed_amount: Number(row.claimed_amount) || 0,
        total_camly: Number(row.total_camly) || 0,
      }));

      console.log("[FullRanking] Success! Fetched", usersWithEarnings.length, "users");

      setAllUsers(usersWithEarnings);
      setFilteredUsers(usersWithEarnings);
      setTotalUsers(usersWithEarnings.length);
      
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

  // Listen for wallet-connected-refresh event to force update ranking after wallet connect
  useEffect(() => {
    const handleWalletRefresh = () => {
      console.log('[FullRanking] Wallet connected - delaying refresh by 800ms for DB sync');
      // Delay refresh to allow database triggers to complete wallet bonus sync
      setTimeout(() => {
        console.log('[FullRanking] Now refreshing ranking data');
        fetchAllUsers(true);
      }, 800);
    };
    
    window.addEventListener('wallet-connected-refresh', handleWalletRefresh);
    return () => window.removeEventListener('wallet-connected-refresh', handleWalletRefresh);
  }, [fetchAllUsers]);

  // Fire confetti on load
  useEffect(() => {
    if (!loading && allUsers.length > 0 && !confettiFired) {
      setConfettiFired(true);
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ["#FFD700", "#F472B6", "#3B82F6", "#FFA500", "#FFE066"],
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

  // Floating particles - Holographic Pink-Purple-Blue-Mint theme
  const floatingParticles = [
    { color: "text-[#F3C4FB]", x: "5%", y: "10%", duration: 4, size: "w-5 h-5", type: "star" },
    { color: "text-[#CDB4DB]", x: "90%", y: "15%", duration: 5, size: "w-4 h-4", type: "sparkle" },
    { color: "text-[#A2D2FF]", x: "10%", y: "60%", duration: 4.5, size: "w-4 h-4", type: "star" },
    { color: "text-[#B8F0F0]", x: "85%", y: "55%", duration: 3.5, size: "w-5 h-5", type: "sparkle" },
    { color: "text-[#F3C4FB]", x: "50%", y: "5%", duration: 4, size: "w-5 h-5", type: "star" },
    { color: "text-[#CDB4DB]", x: "75%", y: "30%", duration: 5.5, size: "w-4 h-4", type: "sparkle" },
    { color: "text-[#A2D2FF]", x: "20%", y: "40%", duration: 4.2, size: "w-4 h-4", type: "star" },
    { color: "text-[#B8F0F0]", x: "60%", y: "70%", duration: 3.8, size: "w-5 h-5", type: "sparkle" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden holographic-page-bg">
      {/* Subtle decorative gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      {/* Floating Particles - Stars & Sparkles */}
      {floatingParticles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -15, 0], opacity: [0.5, 0.9, 0.5], rotate: [0, 10, -10, 0] }}
          transition={{ duration: p.duration, repeat: Infinity }}
          className={`fixed pointer-events-none z-0 ${p.size} ${p.color}`}
          style={{ left: p.x, top: p.y, filter: `drop-shadow(0 0 6px currentColor)` }}
        >
          {p.type === "star" ? <Star className="w-full h-full fill-current" /> : <Sparkles className="w-full h-full" />}
        </motion.div>
      ))}

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
            className="shrink-0 bg-white border-pink-200 hover:bg-pink-50 shadow-sm"
          >
            <ChevronLeft className="h-5 w-5 text-pink-500" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#F3C4FB]" style={{ filter: 'drop-shadow(0 0 6px rgba(243,196,251,0.6))' }} />
              <span 
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #F3C4FB, #CDB4DB, #A2D2FF, #F3C4FB)' }}
              >
                Bảng Xếp Hạng Toàn Cầu
              </span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span className="font-semibold text-pink-500">{totalUsers.toLocaleString()}</span> người chơi
              </p>
              {/* Realtime indicator */}
              <div className="flex items-center gap-1">
                {isRealtimeConnected ? (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex items-center gap-1"
                  >
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-1">
                    <WifiOff className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-400">Offline</span>
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
                className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full text-white text-sm font-medium shadow-lg z-50"
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
            className="shrink-0 bg-white border-blue-200 hover:bg-blue-50 shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 text-blue-500 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </motion.div>

        {/* Tabs for CAMLY vs Achievement Ranking */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 glass-card border border-white/20 shadow-sm rounded-xl p-1">
            <TabsTrigger 
              value="camly" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F3C4FB] data-[state=active]:via-[#CDB4DB] data-[state=active]:to-[#A2D2FF] data-[state=active]:text-gray-800 data-[state=active]:shadow-md text-gray-600 rounded-lg font-quicksand font-bold transition-all"
            >
              <Gem className="w-4 h-4 mr-2" />
              CAMLY Ranking
            </TabsTrigger>
            <TabsTrigger 
              value="achievement" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#CDB4DB] data-[state=active]:via-[#A2D2FF] data-[state=active]:to-[#B8F0F0] data-[state=active]:text-gray-800 data-[state=active]:shadow-md text-gray-600 rounded-lg font-quicksand font-bold transition-all"
            >
              <Award className="w-4 h-4 mr-2" />
              Achievement Ranking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camly" className="mt-4">
            {/* Current User Rank */}
            {user && currentUserRank && currentUserRank > 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-pink-50 border-2 border-yellow-300/60 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-sm">Thứ hạng của bạn</span>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black bg-gradient-to-r from-yellow-500 to-pink-500 bg-clip-text text-transparent">
                      #{currentUserRank}
                    </span>
                    <span className="text-gray-400 text-sm">/ {totalUsers}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Top 3 Podium */}
            {!loading && top3Users.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 sm:p-6 rounded-3xl glass-card holo-border"
                style={{ boxShadow: '0 8px 32px rgba(243,196,251,0.15), 0 0 40px rgba(162,210,255,0.1)' }}
              >
                <div className="flex justify-center items-end gap-2 sm:gap-6">
                  {/* 2nd Place */}
                  <PodiumCard
                    user={top3Users[1]}
                    rank={2}
                    isCurrentUser={user?.id === top3Users[1]?.id}
                    currentUserId={user?.id}
                    onTransfer={handleTransfer}
                    onUserClick={handleUserClick}
                  />
                  {/* 1st Place */}
                  <PodiumCard
                    user={top3Users[0]}
                    rank={1}
                    isCurrentUser={user?.id === top3Users[0]?.id}
                    currentUserId={user?.id}
                    onTransfer={handleTransfer}
                    onUserClick={handleUserClick}
                  />
                  {/* 3rd Place */}
                  <PodiumCard
                    user={top3Users[2]}
                    rank={3}
                    isCurrentUser={user?.id === top3Users[2]?.id}
                    currentUserId={user?.id}
                    onTransfer={handleTransfer}
                    onUserClick={handleUserClick}
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-pink-400" />
                <Input
                  placeholder="Tìm kiếm người chơi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus:ring-pink-400/50 focus:border-pink-400 shadow-sm"
                />
              </div>
            </motion.div>

            {/* User List */}
            <div className="space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full" />
                </div>
              ) : paginatedUsers.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
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
                      onUserClick={handleUserClick}
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
                  className="bg-white border-gray-200 text-gray-600 hover:bg-pink-50 hover:border-pink-200 disabled:opacity-50"
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
                            ? "bg-gradient-to-r from-yellow-400 to-pink-500 border-yellow-400 text-white font-bold shadow-md"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-pink-50 hover:border-pink-200"
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
                  className="bg-white border-gray-200 text-gray-600 hover:bg-pink-50 hover:border-pink-200 disabled:opacity-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* Page Info */}
            {totalPages > 1 && (
              <p className="text-center text-gray-500 text-sm mt-4">
                Trang {currentPage} / {totalPages} ({filteredUsers.length} người chơi)
              </p>
            )}
          </TabsContent>

          <TabsContent value="achievement" className="mt-4">
            <AchievementLeaderboard />
          </TabsContent>
        </Tabs>
      </div>

      {/* Transfer Modal */}
      {selectedRecipient && (
        <TransferModal
          open={transferModalOpen}
          onOpenChange={setTransferModalOpen}
          recipientId={selectedRecipient.id}
          recipientUsername={selectedRecipient.username}
          recipientAvatar={selectedRecipient.avatar}
          recipientWalletAddress={selectedRecipient.walletAddress}
        />
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        open={userModalOpen}
        onOpenChange={setUserModalOpen}
        userId={selectedUserForModal?.user.id || null}
        totalCamly={selectedUserForModal?.user.total_camly}
        userRank={selectedUserForModal?.rank}
      />
    </div>
  );
}
