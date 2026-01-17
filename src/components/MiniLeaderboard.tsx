import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, Gamepad2, Crown, Heart, ChevronRight, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";

interface RankedUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_camly: number;
  rank: number;
}

interface Donor {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_donated: number;
  is_anonymous: boolean;
}

interface Stats {
  total_users: number;
  total_games: number;
  total_camly: number;
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toLocaleString();
};

const rankColors = {
  1: "from-yellow-400 to-amber-500",
  2: "from-gray-300 to-slate-400",
  3: "from-orange-400 to-amber-600",
};

const rankEmojis = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export const MiniLeaderboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [topRanking, setTopRanking] = useState<RankedUser[]>([]);
  const [topDonor, setTopDonor] = useState<Donor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch stats, top ranking, and top donor in parallel
      const [statsResult, rankingResult, donorResult] = await Promise.all([
        supabase.rpc('get_public_stats'),
        supabase.rpc('get_public_ranking', { limit_count: 3 }),
        supabase.rpc('get_public_donors', { limit_count: 1 }),
      ]);

      if (statsResult.data) {
        const data = statsResult.data as any;
        setStats({
          total_users: data.total_users || 0,
          total_games: data.total_games || 0,
          total_camly: data.total_camly || 0,
        });
      }

      if (rankingResult.data && Array.isArray(rankingResult.data)) {
        setTopRanking(rankingResult.data as RankedUser[]);
      }

      if (donorResult.data && Array.isArray(donorResult.data) && donorResult.data.length > 0) {
        setTopDonor(donorResult.data[0] as Donor);
      }
    } catch (error) {
      console.error("Error fetching mini leaderboard data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="w-[300px] lg:w-[320px] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl p-4 border border-purple-200/50 dark:border-purple-500/30 shadow-xl">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 mx-auto bg-purple-200/50" />
          <div className="flex justify-between gap-2">
            <Skeleton className="h-12 flex-1 rounded-lg bg-purple-200/50" />
            <Skeleton className="h-12 flex-1 rounded-lg bg-purple-200/50" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg bg-purple-200/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
      className="w-[300px] lg:w-[320px] relative group"
    >
      {/* Rainbow border animation */}
      <div 
        className="absolute -inset-[2px] rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity"
        style={{
          background: 'linear-gradient(135deg, #FFD700, #FF6BD6, #A855F7, #3B82F6, #FFD700)',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 5s ease infinite',
        }}
      />
      
      {/* Main container */}
      <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl p-4 border border-white/50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-bold text-foreground text-sm">
            {t('miniLeaderboard.title', 'BẢNG VINH DANH')}
          </h3>
          <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="flex items-center justify-between gap-2 mb-4 p-2 rounded-xl bg-gradient-to-r from-purple-100/80 to-pink-100/80 dark:from-purple-900/30 dark:to-pink-900/30">
            <div className="flex items-center gap-1 text-xs">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span className="font-semibold text-foreground">{formatNumber(stats.total_users)}</span>
            </div>
            <div className="w-px h-4 bg-purple-300/50" />
            <div className="flex items-center gap-1 text-xs">
              <Gamepad2 className="w-3.5 h-3.5 text-pink-600" />
              <span className="font-semibold text-foreground">{formatNumber(stats.total_games)}</span>
            </div>
            <div className="w-px h-4 bg-purple-300/50" />
            <div className="flex items-center gap-1 text-xs">
              <span className="text-yellow-500">💎</span>
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                {formatNumber(stats.total_camly)}
              </span>
            </div>
          </div>
        )}

        {/* Top 3 Ranking */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
            <Crown className="w-3.5 h-3.5 text-yellow-500" />
            <span>{t('miniLeaderboard.topCamly', 'TOP CAMLY')}</span>
          </div>
          
          {topRanking.map((user, index) => (
            <motion.div
              key={user.user_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-white/50 to-transparent dark:from-slate-700/50 hover:from-purple-50 dark:hover:from-purple-900/20 transition-colors cursor-pointer"
              onClick={() => navigate(`/profile/${user.user_id}`)}
            >
              <span className="text-base">{rankEmojis[user.rank as keyof typeof rankEmojis]}</span>
              <Avatar className="w-7 h-7 border border-purple-200/50">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className={`bg-gradient-to-br ${rankColors[user.rank as keyof typeof rankColors]} text-white text-xs font-bold`}>
                  {user.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-xs font-medium text-foreground truncate max-w-[100px]">
                {user.username || "Anonymous"}
              </span>
              <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
                💎 {formatNumber(user.total_camly)}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Top Donor */}
        {topDonor && !topDonor.is_anonymous && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              <span>{t('miniLeaderboard.topLegend', 'TOP LEGEND')}</span>
            </div>
            
            <div 
              className="flex items-center gap-2 p-2 rounded-xl bg-gradient-to-r from-pink-50 to-red-50/50 dark:from-pink-900/20 dark:to-red-900/10 border border-pink-200/30 cursor-pointer hover:border-pink-300/50 transition-colors"
              onClick={() => navigate(`/profile/${topDonor.user_id}`)}
            >
              <span className="text-base">❤️</span>
              <Avatar className="w-7 h-7 border border-pink-200/50">
                <AvatarImage src={topDonor.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-red-500 text-white text-xs font-bold">
                  {topDonor.username?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 text-xs font-medium text-foreground truncate max-w-[100px]">
                {topDonor.username || "Anonymous"}
              </span>
              <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500">
                💎 {formatNumber(topDonor.total_donated)}
              </span>
            </div>
          </div>
        )}

        {/* View All Button */}
        <Button
          onClick={() => navigate('/honor-board')}
          variant="outline"
          size="sm"
          className="w-full h-9 rounded-xl border-purple-300/50 hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-700 dark:text-purple-300 font-semibold text-xs group/btn"
        >
          <span>{t('miniLeaderboard.viewAll', 'Xem Bảng Vinh Danh')}</span>
          <ChevronRight className="w-4 h-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </div>
    </motion.div>
  );
};
