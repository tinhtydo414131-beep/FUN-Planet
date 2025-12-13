import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, Users, Coins } from "lucide-react";

export function HeroStats() {
  const [stats, setStats] = useState({
    totalGames: 0,
    totalPlayers: 0,
    totalCamly: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('stats-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'uploaded_games' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      // Get total games
      const { count: gamesCount } = await supabase
        .from('uploaded_games')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Get total players (unique users with game plays)
      const { count: playersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get total CAMLY distributed
      const { data: camlyData } = await supabase
        .from('profiles')
        .select('wallet_balance');

      const totalCamly = camlyData?.reduce((sum, p) => sum + (p.wallet_balance || 0), 0) || 0;

      setStats({
        totalGames: (gamesCount || 0) + 50, // Add built-in games
        totalPlayers: playersCount || 0,
        totalCamly,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const statItems = [
    {
      icon: Gamepad2,
      value: stats.totalGames,
      label: "Epic Games",
      color: "from-yellow-400 to-orange-500",
      textColor: "text-yellow-300",
      glow: "drop-shadow-[0_0_15px_rgba(253,224,71,0.8)]",
    },
    {
      icon: Users,
      value: stats.totalPlayers,
      label: "Active Players",
      color: "from-cyan-400 to-blue-500",
      textColor: "text-cyan-300",
      glow: "drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]",
    },
    {
      icon: Coins,
      value: stats.totalCamly,
      label: "CAMLY Earned",
      color: "from-pink-400 to-purple-500",
      textColor: "text-pink-300",
      glow: "drop-shadow-[0_0_15px_rgba(244,114,182,0.8)]",
    },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 sm:gap-8 pt-8">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15 + 0.5 }}
            whileHover={{ scale: 1.1 }}
            className="relative group"
          >
            <div className="relative bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/20 hover:bg-white/20 transition-all overflow-hidden">
              {/* Gradient border effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-20 transition-opacity rounded-2xl`} />
              
              <div className="relative flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-gradient-to-r ${stat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <motion.p
                    key={stat.value}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className={`text-2xl sm:text-3xl font-bold ${stat.textColor} ${stat.glow}`}
                  >
                    {loading ? "..." : formatNumber(stat.value)}
                  </motion.p>
                  <p className="text-xs sm:text-sm text-white/80 font-medium">{stat.label}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
