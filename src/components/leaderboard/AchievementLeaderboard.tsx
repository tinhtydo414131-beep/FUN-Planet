import { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import { Crown, Trophy, Medal, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AchievementUser {
  id: string;
  username: string;
  avatar_url: string | null;
  achievement_count: number;
  total_achievements: number;
}

const TOTAL_ACHIEVEMENTS = 12; // Total possible achievements

const PodiumCard = memo(({ user, rank, isCurrentUser }: { 
  user: AchievementUser; 
  rank: number; 
  isCurrentUser: boolean;
}) => {
  const navigate = useNavigate();
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
      className="flex flex-col items-center cursor-pointer"
      onClick={() => navigate(`/profile/${user.id}`)}
    >
      {/* Avatar */}
      <div className="relative mb-3">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`absolute inset-0 rounded-full blur-md ${
            rank === 1 ? "bg-yellow-500/50" : rank === 2 ? "bg-slate-400/40" : "bg-orange-500/40"
          }`}
          style={{ transform: "scale(1.2)" }}
        />
        
        <Avatar className={`relative z-10 ${avatarSizes[rank as keyof typeof avatarSizes]} border-4 ${ringColors[rank as keyof typeof ringColors]}`}>
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-xl">
            {user.username?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

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
      <div className="mb-2">
        {rank === 1 && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full text-xs font-bold text-black shadow-lg"
          >
            ⭐ CHAMPION ⭐
          </motion.div>
        )}
        {rank === 2 && (
          <div className="px-3 py-1 bg-gradient-to-r from-slate-300 to-gray-400 rounded-full text-xs font-bold text-gray-800">
            🥈 SILVER
          </div>
        )}
        {rank === 3 && (
          <div className="px-3 py-1 bg-gradient-to-r from-orange-400 to-amber-600 rounded-full text-xs font-bold text-white">
            🥉 BRONZE
          </div>
        )}
      </div>

      {/* Username */}
      <p className={`text-base font-bold truncate max-w-[140px] text-center ${isCurrentUser ? "text-yellow-300" : "text-white"}`}>
        {user.username}
      </p>

      {/* Achievement Count */}
      <div className="flex items-center gap-1.5 mt-2">
        <Trophy className="h-4 w-4 text-yellow-400" />
        <span className="text-lg font-extrabold bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 bg-clip-text text-transparent">
          {user.achievement_count}/{TOTAL_ACHIEVEMENTS}
        </span>
      </div>

      {/* Podium Base */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className={`${heights[rank as keyof typeof heights]} w-28 mt-3 rounded-t-xl ${
          rank === 1 ? "bg-gradient-to-t from-yellow-600/70 to-yellow-400/50 border-2 border-yellow-400/70"
            : rank === 2 ? "bg-gradient-to-t from-slate-500/60 to-slate-300/40 border-2 border-slate-300/60"
            : "bg-gradient-to-t from-orange-600/60 to-orange-400/40 border-2 border-orange-400/60"
        }`}
      >
        <div className="flex items-center justify-center h-full">
          <span className="text-3xl font-black bg-gradient-to-b from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            #{rank}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
});
PodiumCard.displayName = 'PodiumCard';

const UserRow = memo(({ user, rank, isCurrentUser, index }: {
  user: AchievementUser;
  rank: number;
  isCurrentUser: boolean;
  index: number;
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => navigate(`/profile/${user.id}`)}
      className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${
        isCurrentUser
          ? "bg-gradient-to-r from-yellow-500/30 to-amber-500/20 border-2 border-yellow-400/60"
          : "bg-white/10 border border-white/20 hover:bg-white/15"
      }`}
    >
      {/* Rank */}
      <div className="w-10 flex justify-center shrink-0">
        <span className="text-xl font-black bg-gradient-to-b from-yellow-300 to-amber-500 bg-clip-text text-transparent">
          #{rank}
        </span>
      </div>

      {/* Avatar */}
      <Avatar className={`w-10 h-10 border-2 shrink-0 ${isCurrentUser ? "border-yellow-400" : "border-white/40"}`}>
        <AvatarImage src={user.avatar_url || undefined} />
        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold">
          {user.username?.charAt(0).toUpperCase() || "?"}
        </AvatarFallback>
      </Avatar>

      {/* Username */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${isCurrentUser ? "text-yellow-300" : "text-white"}`}>
          {user.username || "Anonymous"}
          {isCurrentUser && <span className="text-yellow-400 ml-1.5">(Bạn)</span>}
        </p>
      </div>

      {/* Achievement Count */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Trophy className="w-4 h-4 text-yellow-400" />
        <span className="font-extrabold text-sm bg-gradient-to-r from-yellow-300 to-yellow-100 bg-clip-text text-transparent">
          {user.achievement_count}/{TOTAL_ACHIEVEMENTS}
        </span>
      </div>
    </motion.div>
  );
});
UserRow.displayName = 'UserRow';

export function AchievementLeaderboard() {
  const [users, setUsers] = useState<AchievementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Get achievements count per user
      const { data: achievements, error } = await supabase
        .from("game_achievements")
        .select("user_id")
        .not("unlocked_at", "is", null);

      if (error) throw error;

      // Count achievements per user
      const countMap = new Map<string, number>();
      achievements?.forEach(a => {
        countMap.set(a.user_id, (countMap.get(a.user_id) || 0) + 1);
      });

      // Get top user IDs sorted by count
      const sortedUserIds = Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId]) => userId);

      if (sortedUserIds.length === 0) {
        setUsers([]);
        return;
      }

      // Fetch profile data for top users
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", sortedUserIds);

      if (profileError) throw profileError;

      // Combine data
      const leaderboard: AchievementUser[] = sortedUserIds.map(userId => {
        const profile = profiles?.find(p => p.id === userId);
        return {
          id: userId,
          username: profile?.username || "Anonymous",
          avatar_url: profile?.avatar_url || null,
          achievement_count: countMap.get(userId) || 0,
          total_achievements: TOTAL_ACHIEVEMENTS,
        };
      });

      setUsers(leaderboard);
    } catch (error) {
      console.error("Error fetching achievement leaderboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="h-5 w-5 text-yellow-400" />
            🏆 Top Achievement Hunters
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Chưa có ai unlock achievement</p>
          </div>
        ) : (
          <>
            {/* Podium for Top 3 */}
            {top3.length > 0 && (
              <div className="flex justify-center items-end gap-4 py-4">
                {top3[1] && (
                  <PodiumCard
                    user={top3[1]}
                    rank={2}
                    isCurrentUser={user?.id === top3[1].id}
                  />
                )}
                {top3[0] && (
                  <PodiumCard
                    user={top3[0]}
                    rank={1}
                    isCurrentUser={user?.id === top3[0].id}
                  />
                )}
                {top3[2] && (
                  <PodiumCard
                    user={top3[2]}
                    rank={3}
                    isCurrentUser={user?.id === top3[2].id}
                  />
                )}
              </div>
            )}

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((u, idx) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    rank={idx + 4}
                    isCurrentUser={user?.id === u.id}
                    index={idx}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AchievementLeaderboard;
