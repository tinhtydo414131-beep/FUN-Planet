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
      // Fetch total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch total approved games
      const { count: gamesCount } = await supabase
        .from("uploaded_games")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      // Fetch total plays
      const { count: playsCount } = await supabase
        .from("game_plays")
        .select("*", { count: "exact", head: true });

      // Fetch total uploads (all statuses)
      const { count: uploadsCount } = await supabase
        .from("uploaded_games")
        .select("*", { count: "exact", head: true });

      // Fetch total CAMLY (sum of wallet_balance)
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
    { icon: Users, label: "Users", value: stats.totalUsers, gradient: "from-primary to-purple-500" },
    { icon: Gamepad2, label: "Games", value: stats.totalGames, gradient: "from-accent to-green-500" },
    { icon: Play, label: "Plays", value: stats.totalPlays, gradient: "from-secondary to-pink-500" },
    { icon: Upload, label: "Uploads", value: stats.totalUploads, gradient: "from-fun-blue to-blue-500" },
    { icon: Gem, label: "CAMLY", value: stats.totalCamly, gradient: "from-fun-yellow to-orange-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-xl"
    >
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-secondary/20 blur-3xl" />
      
      {/* Header */}
      <div className="relative mb-6 flex items-center justify-center gap-3">
        <span className="text-3xl">🌍</span>
        <h3 className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-2xl font-bold text-transparent">
          HONOR BOARD
        </h3>
        <span className="text-3xl">🏆</span>
      </div>

      {/* Stats Grid */}
      <div className="relative grid grid-cols-3 gap-3 md:grid-cols-5 md:gap-4">
        {statItems.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center rounded-2xl border border-border/50 bg-background/50 p-3 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg"
          >
            <div className={`mb-2 rounded-xl bg-gradient-to-br ${item.gradient} p-2`}>
              <item.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-xl font-bold text-foreground md:text-2xl">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : (
                <AnimatedCounter value={item.value} />
              )}
            </p>
            <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
