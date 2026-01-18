import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Heart, Gamepad2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
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
  const [activeTab, setActiveTab] = useState<TabType>("camly");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: "camly" as TabType, icon: Trophy, label: "CAMLY", color: "from-yellow-400 to-amber-500" },
    { id: "donors" as TabType, icon: Heart, label: t('miniLeaderboard.donors') || "Donors", color: "from-pink-400 to-rose-500" },
    { id: "creators" as TabType, icon: Gamepad2, label: t('miniLeaderboard.creators') || "Creators", color: "from-purple-400 to-violet-500" },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "camly") {
        const { data: ranking } = await supabase
          .rpc('get_public_ranking', { limit_count: 3 }) as { data: any[] | null };
        if (ranking) {
          setData(ranking.map((r: any) => ({
            id: r.id,
            username: r.username || 'Anonymous',
            avatar_url: r.avatar_url,
            value: Number(r.wallet_balance) || 0
          })));
        }
      } else if (activeTab === "donors") {
        const { data: donors } = await supabase
          .rpc('get_public_donors', { limit_count: 3 }) as { data: any[] | null };
        if (donors) {
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
  };

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
        {/* Holographic border effect */}
        <div 
          className="absolute -inset-[2px] rounded-3xl opacity-80"
          style={{
            background: 'linear-gradient(135deg, #F3C4FB 0%, #A2D2FF 50%, #CDB4DB 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 4s ease infinite',
          }}
        />
        
        {/* Glass content */}
        <div className="relative bg-white/40 backdrop-blur-xl rounded-3xl p-4 border border-white/50">
          {/* Tab buttons */}
          <div className="flex gap-1 mb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                    : 'bg-white/50 text-gray-600 hover:bg-white/70'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Leaderboard entries */}
          <div className="space-y-2">
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
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-xl bg-white/50 hover:bg-white/70 transition-all cursor-pointer group"
                  onClick={() => navigate(`/profile/${entry.id}`)}
                >
                  {/* Rank */}
                  <span className="text-lg w-6 text-center">{getRankEmoji(index)}</span>
                  
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
                  
                  {/* Value */}
                  <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 text-sm">
                    {formatValue(entry.value)}
                  </span>
                </motion.div>
              ))
            )}
          </div>

          {/* View All link */}
          <button
            onClick={() => navigate('/full-ranking')}
            className="w-full mt-3 py-2 text-center text-sm font-bold text-purple-600 hover:text-pink-600 transition-colors flex items-center justify-center gap-1"
          >
            {t('miniLeaderboard.viewAll') || 'View All'} →
          </button>
        </div>
      </div>
    </motion.div>
  );
};
