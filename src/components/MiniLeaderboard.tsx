import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Crown, Gem, Heart, Gamepad2, ChevronRight, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

type TabType = "ranking" | "donors" | "creators";

interface RankedUser {
  id: string;
  username: string;
  avatar_url: string | null;
  total_camly: number;
}

interface Donor {
  id: string;
  username: string;
  avatar_url: string | null;
  total_donated: number;
  is_anonymous: boolean;
}

interface Creator {
  id: string;
  username: string;
  avatar_url: string | null;
  games_count: number;
}

const getRankEmoji = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
};

const MiniLeaderboardSkeleton = () => (
  <div className="space-y-2 p-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-white/10">
        <Skeleton className="h-8 w-8 rounded-full bg-white/20" />
        <div className="flex-1">
          <Skeleton className="h-3 w-16 bg-white/20" />
        </div>
        <Skeleton className="h-3 w-12 bg-white/20" />
      </div>
    ))}
  </div>
);

export const MiniLeaderboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("ranking");
  const [topUsers, setTopUsers] = useState<RankedUser[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch top ranking users
      const { data: rankingData } = await supabase
        .rpc('get_public_ranking' as any, { limit_count: 3 }) as { data: any[] | null; error: any };
      
      if (rankingData) {
        setTopUsers(rankingData.map((u: any) => ({
          id: u.id,
          username: u.username || 'Anonymous',
          avatar_url: u.avatar_url,
          total_camly: Number(u.total_camly) || 0
        })));
      }

      // Fetch top donors
      const { data: donorsData } = await supabase
        .rpc('get_public_donors' as any, { limit_count: 3 }) as { data: any[] | null; error: any };
      
      if (donorsData) {
        setDonors(donorsData.map((d: any) => ({
          id: d.id,
          username: d.is_anonymous ? 'Ẩn danh' : (d.username || 'Anonymous'),
          avatar_url: d.is_anonymous ? null : d.avatar_url,
          total_donated: Number(d.total_donated) || 0,
          is_anonymous: d.is_anonymous
        })));
      }

      // Fetch top creators
      const { data: gamesData } = await supabase
        .from("uploaded_games")
        .select("user_id, profiles!uploaded_games_user_id_fkey(id, username, avatar_url)")
        .eq("status", "approved");

      if (gamesData) {
        const creatorMap = new Map<string, Creator>();
        for (const game of gamesData) {
          const profile = game.profiles as any;
          if (!profile) continue;
          const existing = creatorMap.get(profile.id);
          if (existing) existing.games_count++;
          else creatorMap.set(profile.id, { 
            id: profile.id, 
            username: profile.username || 'Anonymous', 
            avatar_url: profile.avatar_url, 
            games_count: 1 
          });
        }
        setCreators(Array.from(creatorMap.values())
          .sort((a, b) => b.games_count - a.games_count)
          .slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching mini leaderboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: "ranking" as TabType, label: "🏆 Top", icon: Crown },
    { id: "donors" as TabType, label: "💎 Donors", icon: Heart },
    { id: "creators" as TabType, label: "🎮 Creators", icon: Gamepad2 },
  ];

  const renderList = () => {
    if (loading) return <MiniLeaderboardSkeleton />;

    let items: { id: string; username: string; avatar_url: string | null; value: number; suffix: string }[] = [];
    
    if (activeTab === "ranking") {
      items = topUsers.map(u => ({ ...u, value: u.total_camly, suffix: "" }));
    } else if (activeTab === "donors") {
      items = donors.map(d => ({ ...d, value: d.total_donated, suffix: "" }));
    } else {
      items = creators.map(c => ({ ...c, value: c.games_count, suffix: " games" }));
    }

    return (
      <div className="space-y-1.5 p-2">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            onClick={() => navigate(`/profile/${item.id}`)}
          >
            {/* Rank */}
            <span className="text-sm font-bold w-6 text-center">
              {getRankEmoji(index + 1)}
            </span>
            
            {/* Avatar */}
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7 border border-white/30">
              <AvatarImage src={item.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-[10px] sm:text-xs font-bold">
                {item.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            {/* Username */}
            <span className="flex-1 text-xs font-semibold text-white truncate max-w-[80px]">
              {item.username}
            </span>
            
            {/* Value */}
            <div className="flex items-center gap-0.5">
              {activeTab !== "creators" && <Gem className="h-3 w-3 text-yellow-400" />}
              {activeTab === "creators" && <Star className="h-3 w-3 text-yellow-400" />}
              <span className="text-xs font-bold text-yellow-400">
                {item.value.toLocaleString()}{item.suffix}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="relative w-full max-w-[260px] sm:max-w-[280px] md:max-w-[300px] mx-auto lg:mx-0"
    >
      {/* Glassmorphism Card */}
      <div 
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '2px solid transparent',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15), rgba(255,255,255,0.15)), linear-gradient(135deg, #F3C4FB, #A2D2FF, #CDB4DB)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/20">
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-bold text-white">Mini Leaderboard</span>
            <Crown className="h-4 w-4 text-yellow-400" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex p-1.5 gap-1 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-pink-500/80 to-purple-500/80 text-white shadow-lg'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {renderList()}

        {/* View All Button */}
        <div className="p-2 border-t border-white/10">
          <Button
            onClick={() => navigate('/honor-board')}
            variant="ghost"
            size="sm"
            className="w-full text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold"
          >
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
