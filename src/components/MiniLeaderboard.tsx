import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Heart, Gamepad2, Star, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface LeaderboardRow {
  id: string;
  icon: React.ReactNode;
  label: string;
  username: string;
  avatar_url: string | null;
  value: string;
  userId: string;
}

export const MiniLeaderboard = React.forwardRef<HTMLDivElement, object>((props, ref) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [rankingResult, donorsResult, creatorsResult] = await Promise.all([
        supabase.rpc('get_public_ranking', { limit_count: 1 }) as any,
        supabase.rpc('get_public_donors', { limit_count: 1 }) as any,
        supabase.rpc('get_public_ranking', { limit_count: 10 }) as any,
      ]);

      const newRows: LeaderboardRow[] = [];

      // Row 1: Top Ranking (CAMLY)
      if (rankingResult.data?.[0]) {
        const r = rankingResult.data[0];
        const value = Number(r.wallet_balance) || Number(r.total_camly) || 0;
        newRows.push({
          id: 'top-ranking',
          icon: <Trophy className="w-4 h-4 text-yellow-500" />,
          label: 'Top Ranking',
          username: r.username || 'Anonymous',
          avatar_url: r.avatar_url,
          value: formatValue(value),
          userId: r.id,
        });
      }

      // Row 2: Hot 1h (placeholder - using same top ranking for now)
      if (rankingResult.data?.[0]) {
        const r = rankingResult.data[0];
        newRows.push({
          id: 'hot-1h',
          icon: <Clock className="w-4 h-4 text-orange-500" />,
          label: 'Hót 1h',
          username: r.username || 'Anonymous',
          avatar_url: r.avatar_url,
          value: '🔥',
          userId: r.id,
        });
      }

      // Row 3: Top Donors
      if (donorsResult.data?.[0]) {
        const d = donorsResult.data[0];
        const donated = Number(d.total_donated) || 0;
        newRows.push({
          id: 'top-donors',
          icon: <Heart className="w-4 h-4 text-pink-500" />,
          label: 'Top Donors',
          username: d.username || 'Anonymous',
          avatar_url: d.avatar_url,
          value: formatValue(donated),
          userId: d.id || d.user_id,
        });
      }

      // Row 4: Top Creators - with fallback to ensure always 4 rows
      if (creatorsResult.data) {
        const topCreator = creatorsResult.data
          .filter((c: any) => (c.games_uploaded || 0) > 0)
          .sort((a: any, b: any) => (b.games_uploaded || 0) - (a.games_uploaded || 0))[0];
        
        if (topCreator) {
          newRows.push({
            id: 'top-creators',
            icon: <Gamepad2 className="w-4 h-4 text-purple-500" />,
            label: 'Top Creators',
            username: topCreator.username || 'Anonymous',
            avatar_url: topCreator.avatar_url,
            value: `${topCreator.games_uploaded || 0} 🎮`,
            userId: topCreator.id,
          });
        } else {
          // Fallback placeholder when no creators found
          newRows.push({
            id: 'top-creators',
            icon: <Gamepad2 className="w-4 h-4 text-purple-500" />,
            label: 'Top Creators',
            username: 'Đang chờ...',
            avatar_url: null,
            value: '🎮',
            userId: '',
          });
        }
      } else {
        // Fallback when query fails
        newRows.push({
          id: 'top-creators',
          icon: <Gamepad2 className="w-4 h-4 text-purple-500" />,
          label: 'Top Creators',
          username: 'Đang chờ...',
          avatar_url: null,
          value: '🎮',
          userId: '',
        });
      }

      setRows(newRows);
    } catch (error) {
      console.error('MiniLeaderboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  // Debounced fetch for realtime events
  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchData();
    }, 600);
  }, [fetchData]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Supabase Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('mini_leaderboard_static')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_rewards' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_donations' }, debouncedFetch)
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [debouncedFetch]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full sm:w-72 mx-auto lg:mx-0"
    >
      {/* Glassmorphism container with holographic border */}
      <div 
        className="relative rounded-2xl overflow-hidden bg-white/40 backdrop-blur-xl border-2 p-3 sm:p-4 shadow-lg"
        style={{
          borderImage: 'linear-gradient(135deg, #F3C4FB, #A2D2FF, #CDB4DB, #F3C4FB) 1',
          boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15), 0 0 30px rgba(243, 196, 251, 0.2), 0 0 15px rgba(162, 210, 255, 0.15)',
        }}
      >
        {/* 4 Static Rows */}
        <AnimatePresence mode="wait">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            {loading ? (
              // Loading skeleton
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2 p-2 animate-pulse min-h-[44px]">
                  <div className="w-5 h-5 bg-gray-200 rounded-full" />
                  <div className="w-16 h-3 bg-gray-200 rounded" />
                  <div className="flex-1" />
                  <div className="w-7 h-7 bg-gray-200 rounded-full" />
                  <div className="w-10 h-3 bg-gray-200 rounded" />
                  <Star className="w-4 h-4 text-gray-200" />
                </div>
              ))
            ) : rows.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                {t('miniLeaderboard.noData') || 'No data yet'}
              </div>
            ) : (
              rows.map((row, index) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 300 }}
                  className="flex items-center gap-2 py-2.5 px-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all cursor-pointer group min-h-[44px]"
                  onClick={() => navigate(`/profile/${row.userId}`)}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-5 flex items-center justify-center">
                    {row.icon}
                  </div>
                  
                  {/* Label */}
                  <span className="text-xs font-medium text-gray-600 w-16 truncate flex-shrink-0">
                    {row.label}
                  </span>
                  
                  <div className="flex-1" />
                  
                  {/* Avatar */}
                  <Avatar className="w-7 h-7 border-2 border-white shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                    <AvatarImage src={row.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-[10px]">
                      {row.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Value */}
                  <span className="font-bold text-xs text-gray-800 min-w-[40px] text-right">
                    {row.value}
                  </span>
                  
                  {/* Star icon */}
                  <Star className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="currentColor" />
                </motion.div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* View All link */}
        <motion.button
          onClick={() => navigate('/full-ranking')}
          className="w-full mt-3 py-2 text-center text-xs font-bold text-purple-600 hover:text-pink-600 transition-colors flex items-center justify-center gap-1"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {t('miniLeaderboard.viewAll') || 'View All'} →
        </motion.button>
      </div>
    </motion.div>
  );
});

MiniLeaderboard.displayName = 'MiniLeaderboard';
