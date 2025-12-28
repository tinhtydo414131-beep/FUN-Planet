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
      return "border-yellow-500/70 bg-gradient-to-r from-yellow-500/20 to-amber-500/10 shadow-[0_0_15px_rgba(255,215,0,0.3)]";
    case 2:
      return "border-gray-300/70 bg-gradient-to-r from-gray-300/20 to-gray-400/10 shadow-[0_0_12px_rgba(192,192,192,0.3)]";
    case 3:
      return "border-amber-600/70 bg-gradient-to-r from-amber-600/20 to-orange-500/10 shadow-[0_0_12px_rgba(205,127,50,0.3)]";
    default:
      return "border-white/20 bg-white/5";
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
        <div className="h-full w-full rounded-3xl bg-black/90" />
      </div>

      {/* Golden Glow effect */}
      <div className="absolute inset-0 rounded-3xl shadow-[0_0_30px_rgba(255,215,0,0.4)] pointer-events-none" />

      {/* Inner glow effects */}
      <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-yellow-500/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
      
      {/* Header */}
      <div className="relative mb-4 flex items-center justify-center gap-3">
        <span className="text-2xl">🏆</span>
        <h3 className="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 bg-clip-text text-2xl font-bold text-transparent drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
          TOP RANKING
        </h3>
        <span className="text-2xl">⭐</span>
      </div>

      {/* Rankings List with ScrollArea */}
      <ScrollArea className="h-[280px] pr-2">
        <div className="relative space-y-2">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 p-3"
              >
                <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
                <div className="flex-1">
                  <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                </div>
                <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
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
                    boxShadow: "0 0 20px rgba(255, 215, 0, 0.3)" 
                  }}
                  className={`flex items-center gap-3 rounded-xl border p-3 backdrop-blur-sm cursor-pointer transition-colors ${getRankBorderColor(rank)} ${isCurrentUser ? "ring-2 ring-yellow-500" : ""}`}
                >
                  {/* Rank */}
                  <div className="flex h-8 w-8 items-center justify-center">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className={`h-10 w-10 border-2 ${rank === 1 ? "border-yellow-500 shadow-[0_0_10px_rgba(255,215,0,0.5)]" : rank === 2 ? "border-gray-300" : rank === 3 ? "border-amber-600" : "border-white/30"}`}>
                    <AvatarImage src={rankedUser.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white font-bold">
                      {rankedUser.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <p className={`truncate font-semibold ${isCurrentUser ? "text-yellow-400" : "text-white"}`}>
                      {rankedUser.username}
                      {isCurrentUser && <span className="ml-1 text-xs text-yellow-400/80">(Bạn)</span>}
                    </p>
                  </div>

                  {/* Balance with Animated Counter */}
                  <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-500/30 to-amber-500/20 px-3 py-1 border border-yellow-500/30">
                    <Gem className="h-4 w-4 text-yellow-400" />
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
          className="w-full rounded-xl border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 font-bold text-yellow-100 hover:border-yellow-400 hover:from-yellow-500/30 hover:to-amber-500/30 hover:text-white transition-all"
        >
          Xem Tất Cả
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
