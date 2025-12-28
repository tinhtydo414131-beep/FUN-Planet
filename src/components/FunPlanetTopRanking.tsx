import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Crown, Medal, ChevronRight, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface RankedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  wallet_balance: number | null;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Medal className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankBorderColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "border-yellow-500/50 bg-yellow-500/10";
    case 2:
      return "border-gray-400/50 bg-gray-400/10";
    case 3:
      return "border-amber-600/50 bg-amber-600/10";
    default:
      return "border-border/50 bg-background/50";
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
      className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-secondary/5 p-6 shadow-xl"
    >
      {/* Glow effect */}
      <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
      
      {/* Header */}
      <div className="relative mb-4 flex items-center justify-center gap-3">
        <span className="text-2xl">🏆</span>
        <h3 className="bg-gradient-to-r from-fun-yellow via-primary to-secondary bg-clip-text text-2xl font-bold text-transparent">
          TOP RANKING
        </h3>
        <span className="text-2xl">⭐</span>
      </div>

      {/* Rankings List */}
      <div className="relative space-y-2">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 p-3"
            >
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-4 w-16 animate-pulse rounded bg-muted" />
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
                className={`flex items-center gap-3 rounded-xl border p-3 backdrop-blur-sm transition-all hover:scale-[1.02] hover:shadow-md ${getRankBorderColor(rank)} ${isCurrentUser ? "ring-2 ring-primary" : ""}`}
              >
                {/* Rank */}
                <div className="flex h-8 w-8 items-center justify-center">
                  {getRankIcon(rank)}
                </div>

                {/* Avatar */}
                <Avatar className={`h-10 w-10 border-2 ${rank <= 3 ? "border-primary" : "border-border"}`}>
                  <AvatarImage src={rankedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {rankedUser.username?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>

                {/* Username */}
                <div className="flex-1 min-w-0">
                  <p className={`truncate font-semibold ${isCurrentUser ? "text-primary" : "text-foreground"}`}>
                    {rankedUser.username}
                    {isCurrentUser && <span className="ml-1 text-xs">(Bạn)</span>}
                  </p>
                </div>

                {/* Balance */}
                <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-fun-yellow/20 to-primary/20 px-3 py-1">
                  <Gem className="h-4 w-4 text-fun-yellow" />
                  <span className="text-sm font-bold text-foreground">
                    {(rankedUser.wallet_balance || 0).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

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
          className="w-full rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-secondary/10 font-bold hover:border-primary hover:from-primary/20 hover:to-secondary/20"
        >
          Xem Tất Cả
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
};
