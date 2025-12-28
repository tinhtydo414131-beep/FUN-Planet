import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Gamepad2, Play, Upload, Gem } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalUsers: number;
  totalGames: number;
  totalPlays: number;
  totalUploads: number;
  totalCamly: number;
}

const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span>{count.toLocaleString()}</span>;
};

export const FunPlanetHonorBoard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalGames: 0,
    totalPlays: 0,
    totalUploads: 0,
    totalCamly: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: gamesCount } = await supabase
        .from("uploaded_games")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      const { count: playsCount } = await supabase
        .from("game_plays")
        .select("*", { count: "exact", head: true });

      const { count: uploadsCount } = await supabase
        .from("uploaded_games")
        .select("*", { count: "exact", head: true });

      const { data: camlyData } = await supabase
        .from("profiles")
        .select("wallet_balance");
      
      const totalCamly = camlyData?.reduce((sum, profile) => sum + (profile.wallet_balance || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalGames: gamesCount || 0,
        totalPlays: playsCount || 0,
        totalUploads: uploadsCount || 0,
        totalCamly: totalCamly,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { icon: Users, label: "Users", value: stats.totalUsers, bgColor: "bg-purple-500" },
    { icon: Gamepad2, label: "Games", value: stats.totalGames, bgColor: "bg-teal-500" },
    { icon: Play, label: "Plays", value: stats.totalPlays, bgColor: "bg-pink-500" },
    { icon: Upload, label: "Uploads", value: stats.totalUploads, bgColor: "bg-green-500" },
    { icon: Gem, label: "CAMLY", value: stats.totalCamly, bgColor: "bg-rose-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 shadow-xl h-full"
    >
      {/* Glow effects */}
      <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-primary/30 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-20 w-20 rounded-full bg-secondary/30 blur-2xl" />
      
      {/* Header */}
      <div className="relative mb-4 flex items-center justify-center gap-2">
        <span className="text-xl">🌍</span>
        <h3 className="bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 bg-clip-text text-lg font-bold text-transparent">
          HONOR BOARD
        </h3>
        <span className="text-xl">🏆</span>
      </div>

      {/* Horizontal Stats */}
      <div className="relative flex flex-wrap justify-center gap-2">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center rounded-xl bg-white/10 backdrop-blur-sm p-2 min-w-[60px] border border-white/10 hover:border-white/30 hover:bg-white/20 transition-all"
          >
            <div className={`mb-1 rounded-lg ${item.bgColor} p-1.5`}>
              <item.icon className="h-4 w-4 text-white" />
            </div>
            <p className="text-base font-bold text-white">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <AnimatedCounter value={item.value} />
              )}
            </p>
            <p className="text-[10px] font-medium text-white/70">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
