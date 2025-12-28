import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, ChevronRight, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RankedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_balance: number | null;
}

// Animated Counter Component
const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1500;
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
  }, [value]);

  return <span>{count.toLocaleString()}</span>;
};

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return (
        <motion.div
          animate={{ y: [0, -3, 0], rotate: [-5, 5, -5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Crown className="h-5 w-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
        </motion.div>
      );
    case 2:
      return <Medal className="h-5 w-5 text-gray-300 drop-shadow-[0_0_6px_rgba(192,192,192,0.6)]" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600 drop-shadow-[0_0_6px_rgba(205,127,50,0.6)]" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankBorderColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "border-yellow-400/80 bg-gradient-to-r from-yellow-400/35 to-amber-500/25 shadow-[0_0_20px_rgba(255,215,0,0.4)]";
    case 2:
      return "border-slate-300/70 bg-gradient-to-r from-slate-300/30 to-gray-400/20 shadow-[0_0_15px_rgba(192,192,192,0.35)]";
    case 3:
      return "border-orange-400/70 bg-gradient-to-r from-orange-500/30 to-amber-600/20 shadow-[0_0_15px_rgba(205,127,50,0.35)]";
    default:
      return "border-white/35 bg-gradient-to-r from-white/15 to-white/10";
  }
};

export const FunPlanetTopRanking = () => {
  const [topUsers, setTopUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchTopUsers();
  }, []);

  const fetchTopUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, wallet_balance")
        .order("wallet_balance", { ascending: false, nullsFirst: false })
        .limit(5);

      if (error) throw error;
      setTopUsers(data || []);
    } catch (error) {
      console.error("Error fetching top users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Floating particles data
  const floatingParticles = [
    { emoji: "✨", delay: 0, x: "10%", duration: 4 },
    { emoji: "⭐", delay: 0.5, x: "85%", duration: 5 },
    { emoji: "💫", delay: 1, x: "25%", duration: 4.5 },
    { emoji: "✨", delay: 1.5, x: "70%", duration: 3.5 },
    { emoji: "⭐", delay: 2, x: "50%", duration: 4 },
    { emoji: "💎", delay: 0.8, x: "90%", duration: 5.5 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 shadow-2xl"
      style={{
        background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)",
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
          @keyframes float-particle {
            0%, 100% { 
              transform: translateY(0) rotate(0deg); 
              opacity: 0.6;
            }
            50% { 
              transform: translateY(-15px) rotate(10deg); 
              opacity: 1;
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

      {/* Golden Metallic Border with Shimmer */}
      <div 
        className="absolute inset-0 rounded-3xl -z-10"
        style={{
          padding: "3px",
          background: "linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FFEC8B 50%, #FFA500 75%, #FFD700 100%)",
          backgroundSize: "200% 200%",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      >
        {/* Brighter gradient background instead of black */}
        <div 
          className="h-full w-full rounded-3xl"
          style={{
            background: "linear-gradient(135deg, rgba(88, 28, 135, 0.85) 0%, rgba(49, 46, 129, 0.8) 50%, rgba(30, 58, 138, 0.85) 100%)",
          }}
        />
      </div>

      {/* Subtle dot pattern overlay */}
      <div 
        className="absolute inset-0 rounded-3xl pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Light overlay gradient for brightness */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-transparent via-white/5 to-white/15 pointer-events-none" />

      {/* Golden Glow effect */}
      <div className="absolute inset-0 rounded-3xl shadow-[0_0_40px_rgba(255,215,0,0.5)] pointer-events-none" />

      {/* Inner glow effects - brighter */}
      <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-purple-500/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-yellow-500/20 blur-3xl" />

      {/* Floating Particles */}
      {floatingParticles.map((particle, index) => (
        <motion.div
          key={index}
          className="absolute pointer-events-none text-lg"
          style={{ left: particle.x, top: "20%" }}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 10, 0],
            opacity: [0.6, 1, 0.6],
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
      <div className="relative mb-4 flex items-center justify-center gap-3">
        <span className="text-2xl">🏆</span>
        <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-2xl font-bold text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]">
          TOP RANKING
        </h3>
        <span className="text-2xl">⭐</span>
      </div>

      {/* Rankings List with ScrollArea and custom scrollbar */}
      <ScrollArea className="h-[280px] pr-2 ranking-scrollbar">
        <div className="relative space-y-2">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
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
            ))
          ) : (
            topUsers.map((rankedUser, index) => {
              const rank = index + 1;
              const isCurrentUser = user?.id === rankedUser.id;
              
              return (
                <motion.div
                  key={rankedUser.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ 
                    scale: 1.03, 
                    boxShadow: "0 0 25px rgba(255, 215, 0, 0.4)" 
                  }}
                  className={`flex items-center gap-3 rounded-xl border p-3 backdrop-blur-sm cursor-pointer transition-all ${getRankBorderColor(rank)} ${isCurrentUser ? "ring-2 ring-yellow-400" : ""}`}
                >
                  {/* Rank */}
                  <div className="flex h-8 w-8 items-center justify-center">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className={`h-10 w-10 border-2 ${rank === 1 ? "border-yellow-400 shadow-[0_0_12px_rgba(255,215,0,0.6)]" : rank === 2 ? "border-slate-300 shadow-[0_0_8px_rgba(192,192,192,0.4)]" : rank === 3 ? "border-orange-400 shadow-[0_0_8px_rgba(205,127,50,0.4)]" : "border-white/40"}`}>
                    <AvatarImage src={rankedUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
                      {rankedUser.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <p className={`truncate font-semibold ${isCurrentUser ? "text-yellow-300" : "text-white"}`}>
                      {rankedUser.username}
                      {isCurrentUser && <span className="ml-1 text-xs text-yellow-300/80">(Bạn)</span>}
                    </p>
                  </div>

                  {/* Balance with Animated Counter */}
                  <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-500/40 to-amber-500/30 px-3 py-1 border border-yellow-400/40 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                    <Gem className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm font-bold text-yellow-100">
                      <AnimatedCounter value={rankedUser.wallet_balance || 0} />
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* View All Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
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