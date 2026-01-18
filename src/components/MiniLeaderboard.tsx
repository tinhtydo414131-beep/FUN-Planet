import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Heart, Gamepad2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  value: number;
}

type TabType = "camly" | "donors" | "creators";

export const MiniLeaderboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("donors");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Reordered: Sponsors first, then Creators, then CAMLY ranking
  const tabs = [
    { id: "donors" as TabType, icon: Heart, label: t('miniLeaderboard.donors') || "Nhà Tài Trợ", color: "from-pink-400 to-rose-500" },
    { id: "creators" as TabType, icon: Gamepad2, label: t('miniLeaderboard.creators') || "Nhà Sáng Tạo", color: "from-purple-400 to-violet-500" },
    { id: "camly" as TabType, icon: Trophy, label: t('miniLeaderboard.camly') || "CAMLY", color: "from-yellow-400 to-amber-500" },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "camly") {
        const { data: ranking, error } = await supabase
          .rpc('get_public_ranking', { limit_count: 3 }) as { data: any[] | null; error: any };
        
        if (error) {
          console.error('MiniLeaderboard CAMLY fetch error:', error);
        }
        
        if (ranking && ranking.length > 0) {
          setData(ranking.map((r: any) => ({
            id: r.id,
            username: r.username || 'Anonymous',
            avatar_url: r.avatar_url,
            value: Number(r.wallet_balance) || Number(r.total_camly) || Number(r.camly_balance) || 0
          })));
        }
      } else if (activeTab === "donors") {
        const { data: donors, error } = await supabase
          .rpc('get_public_donors', { limit_count: 3 }) as { data: any[] | null; error: any };
        
        if (error) {
          console.error('MiniLeaderboard Donors fetch error:', error);
        }
        
        if (donors && donors.length > 0) {
          setData(donors.map((d: any) => ({
            id: d.id || d.user_id,
            username: d.username || 'Anonymous',
            avatar_url: d.avatar_url,
            value: Number(d.total_donated) || 0
          })));
        }
      } else {
        // Top Creators - users with most approved games
        const { data: creators } = await supabase
          .rpc('get_public_ranking', { limit_count: 10 }) as { data: any[] | null };
        if (creators) {
          const topCreators = creators
            .filter((c: any) => (c.games_uploaded || 0) > 0)
            .sort((a: any, b: any) => (b.games_uploaded || 0) - (a.games_uploaded || 0))
            .slice(0, 3);
          setData(topCreators.map((c: any) => ({
            id: c.id,
            username: c.username || 'Anonymous',
            avatar_url: c.avatar_url,
            value: Number(c.games_uploaded) || 0
          })));
        }
      }
    } catch (error) {
      console.error('MiniLeaderboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔴 Supabase Realtime subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel('mini_leaderboard_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_rewards' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_donations' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const formatValue = (value: number) => {
    if (activeTab === "creators") return `${value} 🎮`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toString();
  };

  const getRankEmoji = (index: number) => {
    const emojis = ["🥇", "🥈", "🥉"];
    return emojis[index] || `${index + 1}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="w-full max-w-[320px] mx-auto lg:mx-0"
    >
      {/* Glassmorphism container with holographic border */}
      <div className="relative rounded-3xl overflow-hidden">
        {/* ✨ Enhanced holographic border with animated gradient */}
        <div 
          className="absolute -inset-[2px] rounded-3xl opacity-80"
          style={{
            background: 'linear-gradient(135deg, #F3C4FB 0%, #A2D2FF 25%, #CDB4DB 50%, #98F5E1 75%, #F3C4FB 100%)',
            backgroundSize: '300% 300%',
            animation: 'gradient-shift 6s ease infinite',
          }}
        />
        
        {/* Glass content */}
        <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/50">
          {/* Tab buttons with shimmer effect */}
          <div className="flex gap-1 mb-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-0.5 sm:gap-1 py-2.5 px-1.5 sm:px-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all min-h-[44px] relative overflow-hidden ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                    : 'bg-white/50 text-gray-600 hover:bg-white/70'
                }`}
              >
                {/* ✨ Shimmer effect for active tab */}
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_ease-in-out_infinite] -skew-x-12" />
                )}
                <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 relative z-10" />
                <span className="truncate relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Leaderboard entries with AnimatePresence for smooth transitions */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {loading ? (
                // Loading skeleton
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="w-6 h-6 bg-gray-200 rounded-full" />
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded w-20" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-12" />
                  </div>
                ))
              ) : data.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  {t('miniLeaderboard.noData') || 'No data yet'}
                </div>
              ) : (
                data.map((entry, index) => (
                  <motion.div
                    key={`${entry.id}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                    className="flex items-center gap-3 p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all cursor-pointer group"
                    onClick={() => navigate(`/profile/${entry.id}`)}
                  >
                    {/* Rank with glow */}
                    <motion.span 
                      className="text-lg w-6 text-center drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]"
                      whileHover={{ scale: 1.2 }}
                    >
                      {getRankEmoji(index)}
                    </motion.span>
                    
                    {/* Avatar */}
                    <Avatar className="w-8 h-8 border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                      <AvatarImage src={entry.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xs">
                        {entry.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Username */}
                    <span className="flex-1 font-bold text-gray-700 text-sm truncate">
                      {entry.username}
                    </span>
                    
                    {/* ✨ Value with glow animation */}
                    <motion.span 
                      key={`${entry.id}-${entry.value}`}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-sm drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                    >
                      {formatValue(entry.value)}
                    </motion.span>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>

          {/* View All link */}
          <motion.button
            onClick={() => navigate('/full-ranking')}
            className="w-full mt-3 py-2 text-center text-sm font-bold text-purple-600 hover:text-pink-600 transition-colors flex items-center justify-center gap-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {t('miniLeaderboard.viewAll') || 'View All'} →
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
