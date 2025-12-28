import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, ChevronRight, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import confetti from "canvas-confetti";

interface RankedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_balance: number | null;
  created_at?: string | null;
}

// Animated Counter Component
const AnimatedCounter = ({ value, duration = 1500 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const steps = 30;
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

// Progress Bar Component
const ProgressBar = ({ value, maxValue }: { value: number; maxValue: number }) => {
  const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;

  return (
    <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden mt-1">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500"
        style={{
          boxShadow: "0 0 10px rgba(255, 215, 0, 0.5)",
        }}
      />
    </div>
  );
};

// Rank Badge Component
const getRankBadge = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full text-[10px] font-bold text-black shadow-lg"
        >
          ⭐ CHAMPION ⭐
        </motion.div>
      );
    case 2:
      return (
        <div className="px-2 py-0.5 bg-gradient-to-r from-slate-300 to-gray-400 rounded-full text-[10px] font-bold text-gray-800">
          🥈 SILVER
        </div>
      );
    case 3:
      return (
        <div className="px-2 py-0.5 bg-gradient-to-r from-orange-400 to-amber-600 rounded-full text-[10px] font-bold text-white">
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
  maxBalance,
  isCurrentUser,
}: {
  user: RankedUser;
  rank: number;
  maxBalance: number;
  isCurrentUser: boolean;
}) => {
  const heights = { 1: "h-20", 2: "h-14", 3: "h-12" };
  const avatarSizes = { 1: "h-18 w-18", 2: "h-14 w-14", 3: "h-12 w-12" };
  const ringColors = {
    1: "border-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.8)]",
    2: "border-slate-300 shadow-[0_0_15px_rgba(192,192,192,0.6)]",
    3: "border-orange-400 shadow-[0_0_15px_rgba(205,127,50,0.6)]",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.2 : rank === 2 ? 0.1 : 0.3 }}
      className="flex flex-col items-center"
    >
      {/* Avatar with Glowing Ring */}
      <div className="relative mb-2">
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
            className={`relative z-10 ${avatarSizes[rank as keyof typeof avatarSizes]} border-3 ${
              ringColors[rank as keyof typeof ringColors]
            }`}
          >
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
              {user.username?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Crown for #1 */}
        {rank === 1 && (
          <motion.div
            animate={{ y: [0, -3, 0], rotate: [-5, 5, -5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-4 left-1/2 -translate-x-1/2"
          >
            <Crown className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_10px_rgba(255,215,0,1)]" />
          </motion.div>
        )}
      </div>

      {/* Badge */}
      <div className="mb-1">{getRankBadge(rank)}</div>

      {/* Username */}
      <p
        className={`text-sm font-bold truncate max-w-[120px] text-center drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] ${
          isCurrentUser ? "text-yellow-300" : "text-white"
        }`}
      >
        {user.username}
      </p>

      {/* Balance */}
      <div className="flex items-center gap-1 mt-1">
        <Gem className="h-3.5 w-3.5 text-yellow-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]" />
        <span className="text-sm font-extrabold text-yellow-300 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)]">
          <AnimatedCounter value={user.wallet_balance || 0} duration={2000} />
        </span>
      </div>

      {/* Podium Base */}
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
        style={{
          boxShadow:
            rank === 1
              ? "0 0 20px rgba(255, 215, 0, 0.4)"
              : rank === 2
              ? "0 0 15px rgba(192, 192, 192, 0.3)"
              : "0 0 15px rgba(205, 127, 50, 0.3)",
        }}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-2xl font-black text-white/90">#{rank}</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const FunPlanetTopRanking = () => {
  const [topUsers, setTopUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [confettiFired, setConfettiFired] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchTopUsers();
  }, []);

  // Fire confetti when data loads
  useEffect(() => {
    if (!loading && topUsers.length > 0 && !confettiFired) {
      setConfettiFired(true);
      // Fire confetti with gold colors
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { x: 0.5, y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FFEC8B", "#FF6B35", "#FFE066"],
        ticks: 100,
        gravity: 1.2,
        scalar: 0.9,
      });
    }
  }, [loading, topUsers, confettiFired]);

  const fetchTopUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, wallet_balance, created_at")
        .order("wallet_balance", { ascending: false, nullsFirst: false })
        .limit(10);

      if (error) throw error;
      setTopUsers(data || []);
    } catch (error) {
      console.error("Error fetching top users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced floating particles
  const floatingParticles = [
    { emoji: "✨", delay: 0, x: "5%", y: "15%", duration: 4, size: "text-xl" },
    { emoji: "⭐", delay: 0.3, x: "92%", y: "20%", duration: 5, size: "text-lg" },
    { emoji: "💎", delay: 0.6, x: "12%", y: "70%", duration: 4.5, size: "text-2xl" },
    { emoji: "🌟", delay: 0.9, x: "88%", y: "65%", duration: 3.5, size: "text-xl" },
    { emoji: "💫", delay: 1.2, x: "50%", y: "8%", duration: 4, size: "text-lg" },
    { emoji: "🔥", delay: 1.5, x: "78%", y: "35%", duration: 5.5, size: "text-xl" },
    { emoji: "🚀", delay: 1.8, x: "22%", y: "45%", duration: 4.2, size: "text-lg" },
    { emoji: "✨", delay: 2.1, x: "65%", y: "75%", duration: 3.8, size: "text-2xl" },
    { emoji: "⭐", delay: 2.4, x: "35%", y: "25%", duration: 4.8, size: "text-xl" },
    { emoji: "💎", delay: 2.7, x: "95%", y: "50%", duration: 5, size: "text-lg" },
  ];

  const maxBalance = topUsers[0]?.wallet_balance || 1;
  const top3Users = topUsers.slice(0, 3);
  const remainingUsers = topUsers.slice(3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-4 sm:p-6 shadow-2xl"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* CSS Keyframes */}
      <style>
        {`
          @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes rainbow-border {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float-particle {
            0%, 100% { 
              transform: translateY(0) rotate(0deg) scale(1); 
              opacity: 0.6;
            }
            25% {
              transform: translateY(-10px) rotate(5deg) scale(1.1);
              opacity: 0.8;
            }
            50% { 
              transform: translateY(-20px) rotate(-5deg) scale(1); 
              opacity: 1;
            }
            75% {
              transform: translateY(-10px) rotate(5deg) scale(1.1);
              opacity: 0.8;
            }
          }
          .ranking-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .ranking-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .ranking-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #FFD700 0%, #FFA500 100%);
            border-radius: 10px;
          }
          .ranking-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #FFEC8B 0%, #FFD700 100%);
          }
        `}
      </style>

      {/* Rainbow Border for the whole component (rotating gradient) */}
      <div
        className="absolute inset-0 rounded-3xl -z-10"
        style={{
          padding: "3px",
          background:
            "linear-gradient(90deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, #ff0000)",
          backgroundSize: "400% 400%",
          animation: "rainbow-border 6s ease infinite",
        }}
      >
        {/* Inner gradient background */}
        <div
          className="h-full w-full rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(49, 46, 129, 0.85) 50%, rgba(30, 58, 138, 0.9) 100%)",
          }}
        />
      </div>

      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover rounded-3xl z-0"
        style={{ opacity: 0.7 }}
      >
        <source src="/videos/ranking-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 rounded-3xl bg-black/50 z-0" />

      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-10 z-[1]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
          backgroundSize: "15px 15px",
        }}
      />

      {/* Light overlay gradient for brightness */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/8 pointer-events-none z-[1]" />

      {/* Golden Glow effect */}
      <div className="absolute inset-0 rounded-3xl shadow-[0_0_50px_rgba(255,215,0,0.4)] pointer-events-none z-[1]" />

      {/* Inner glow effects */}
      <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-purple-500/30 blur-3xl z-[1]" />
      <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-blue-500/30 blur-3xl z-[1]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl z-[1]" />

      {/* Floating Particles */}
      {floatingParticles.slice(0, 6).map((particle, index) => (
        <motion.div
          key={index}
          className={`absolute pointer-events-none ${particle.size} z-[2]`}
          style={{ left: particle.x, top: particle.y }}
          animate={{
            y: [0, -20, 0],
            x: [0, 5, -5, 0],
            rotate: [0, 10, -10, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {particle.emoji}
        </motion.div>
      ))}

      {/* Header */}
      <div className="relative mb-4 flex items-center justify-center gap-3 z-10">
        <motion.span
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl"
        >
          🏆
        </motion.span>
        <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-xl sm:text-2xl font-bold text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]">
          TOP RANKING
        </h3>
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-2xl"
        >
          ⭐
        </motion.span>
      </div>

      {loading ? (
        // Loading skeleton
        <div className="space-y-3 relative z-10">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-white/30 bg-white/10 p-3"
            >
              <div className="h-8 w-8 animate-pulse rounded-full bg-white/20" />
              <div className="flex-1">
                <div className="h-4 w-24 animate-pulse rounded bg-white/20" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-white/20" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* PODIUM FOR TOP 3 */}
          <div className="flex items-end justify-center gap-2 sm:gap-4 mb-4 relative z-10">
            {/* #2 Silver - Left */}
            {top3Users[1] && (
              <div className="w-1/3 order-1">
                <PodiumCard
                  user={top3Users[1]}
                  rank={2}
                  maxBalance={maxBalance}
                  isCurrentUser={user?.id === top3Users[1].id}
                />
              </div>
            )}

            {/* #1 Gold - Center (highest) */}
            {top3Users[0] && (
              <div className="w-1/3 order-2">
                <PodiumCard
                  user={top3Users[0]}
                  rank={1}
                  maxBalance={maxBalance}
                  isCurrentUser={user?.id === top3Users[0].id}
                />
              </div>
            )}

            {/* #3 Bronze - Right */}
            {top3Users[2] && (
              <div className="w-1/3 order-3">
                <PodiumCard
                  user={top3Users[2]}
                  rank={3}
                  maxBalance={maxBalance}
                  isCurrentUser={user?.id === top3Users[2].id}
                />
              </div>
            )}
          </div>

          {/* Empty State */}
          {topUsers.length === 0 && (
            <div className="text-center py-8">
              <motion.span
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-5xl block mb-3"
              >
                🏆
              </motion.span>
              <p className="text-white/80 text-lg font-semibold">Chưa có ai trong bảng xếp hạng</p>
              <p className="text-yellow-300/70 text-sm mt-1">Hãy là người đầu tiên!</p>
            </div>
          )}

          {/* Remaining Rankings with HoverCard */}
          {remainingUsers.length > 0 && (
            <ScrollArea className="h-[220px] pr-2 ranking-scrollbar">
              <div className="space-y-2">
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
                          whileHover={{
                            scale: 1.02,
                            boxShadow: "0 0 25px rgba(255, 215, 0, 0.4)",
                          }}
                          className={`flex items-center gap-3 rounded-xl border p-2.5 backdrop-blur-sm cursor-pointer transition-all border-white/35 bg-gradient-to-r from-white/15 to-white/10 ${
                            isCurrentUser ? "ring-2 ring-yellow-400" : ""
                          }`}
                        >
                          {/* Rank */}
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-500/30 to-amber-500/20">
                            <span className="text-sm font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(255,215,0,0.6)]">
                              #{rank}
                            </span>
                          </div>

                          {/* Avatar */}
                          <Avatar className="h-9 w-9 border-2 border-white/40">
                            <AvatarImage src={rankedUser.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                              {rankedUser.username?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>

                          {/* Username & Progress */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`truncate max-w-[140px] text-base font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] ${
                                isCurrentUser ? "text-yellow-300" : "text-white"
                              }`}
                            >
                              {rankedUser.username}
                              {isCurrentUser && (
                                <span className="ml-1 text-xs text-yellow-300/80">
                                  (Bạn)
                                </span>
                              )}
                            </p>
                            <ProgressBar
                              value={rankedUser.wallet_balance || 0}
                              maxValue={maxBalance}
                            />
                          </div>

                          {/* Balance */}
                          <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-yellow-500/50 to-amber-500/40 px-3 py-1.5 border-2 border-yellow-400/60 shadow-[0_0_12px_rgba(255,215,0,0.5)]">
                            <Gem className="h-4 w-4 text-yellow-300 drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]" />
                            <span className="text-sm font-extrabold text-yellow-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.7)]">
                              <AnimatedCounter value={rankedUser.wallet_balance || 0} />
                            </span>
                          </div>
                        </motion.div>
                      </HoverCardTrigger>
                      <HoverCardContent
                        className="w-64 bg-black/95 border-yellow-500/50 backdrop-blur-xl"
                        side="top"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-14 w-14 border-2 border-yellow-400/50">
                            <AvatarImage src={rankedUser.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-lg">
                              {rankedUser.username?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-bold text-white">{rankedUser.username}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Gem className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm font-semibold text-yellow-400">
                                {(rankedUser.wallet_balance || 0).toLocaleString()} CAMLY
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              🏆 Xếp hạng: #{rank}
                            </p>
                            <p className="text-xs text-gray-400">
                              📊{" "}
                              {Math.round(
                                ((rankedUser.wallet_balance || 0) / maxBalance) * 100
                              )}
                              % so với #1
                            </p>
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative mt-4"
      >
        <Button
          onClick={() => navigate("/camly-leaderboard")}
          variant="outline"
          className="w-full rounded-xl border-2 border-yellow-400/60 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 font-bold text-yellow-100 hover:border-yellow-300 hover:from-yellow-500/40 hover:to-amber-500/40 hover:text-white transition-all shadow-[0_0_15px_rgba(255,215,0,0.3)]"
        >
          Xem Tất Cả
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
