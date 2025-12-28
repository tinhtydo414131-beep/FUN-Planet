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

  // Calculate max value for progress bar percentage
  const maxValue = Math.max(stats.totalUsers, stats.totalGames, stats.totalPlays, stats.totalUploads, stats.totalCamly, 1);

  const statItems = [
    { icon: Users, label: "Users", value: stats.totalUsers, bgColor: "bg-purple-500", accentColor: "#a855f7" },
    { icon: Gamepad2, label: "Games", value: stats.totalGames, bgColor: "bg-teal-500", accentColor: "#14b8a6" },
    { icon: Play, label: "Plays", value: stats.totalPlays, bgColor: "bg-pink-500", accentColor: "#ec4899" },
    { icon: Upload, label: "Uploads", value: stats.totalUploads, bgColor: "bg-green-500", accentColor: "#22c55e" },
    { icon: Gem, label: "CAMLY", value: stats.totalCamly, bgColor: "bg-rose-500", accentColor: "#f43f5e" },
  ];

  return (
    <div className="relative h-full">
      {/* Outer Gold Glow - Tinh tế hơn */}
      <div 
        className="absolute rounded-3xl pointer-events-none"
        style={{
          inset: "-12px",
          boxShadow: `
            0 0 30px rgba(255, 215, 0, 0.5),
            0 0 50px rgba(255, 165, 0, 0.3),
            0 0 80px rgba(255, 215, 0, 0.2)
          `,
          zIndex: -15,
        }}
      />

      {/* Gold Metallic Border - 8px thay vì 18px */}
      <div
        className="absolute rounded-3xl animate-metallic-shine"
        style={{
          inset: "-8px",
          background: `
            linear-gradient(135deg, 
              #FFD700 0%, #FFFACD 10%, #FFF8DC 20%, 
              #FFD700 35%, #B8860B 50%, #FFD700 65%, 
              #FFF8DC 80%, #FFFACD 90%, #FFD700 100%
            )
          `,
          backgroundSize: "200% 200%",
          boxShadow: `
            0 0 10px rgba(255, 215, 0, 0.5),
            0 0 20px rgba(255, 215, 0, 0.3),
            inset 0 1px 3px rgba(255, 255, 255, 0.5),
            inset 0 -1px 3px rgba(0, 0, 0, 0.3)
          `,
          zIndex: -10,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-4 shadow-xl h-full"
        style={{
          background: "linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(49, 46, 129, 0.85) 50%, rgba(30, 58, 138, 0.9) 100%)",
        }}
      >
        {/* Inner Border Highlight - Mỏng hơn */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            border: "2px solid rgba(255, 215, 0, 0.7)",
            boxShadow: "inset 0 0 25px rgba(255, 215, 0, 0.3)",
            zIndex: 5,
          }}
        />

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30 rounded-3xl" />

        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10 rounded-3xl"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }}
        />

        {/* Glow effects */}
        <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-purple-500/40 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-blue-500/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-32 rounded-full bg-yellow-400/15 blur-2xl" />
        
        {/* Header - Compact */}
        <div className="relative mb-3 flex items-center justify-center gap-2 z-10">
          <span className="text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">🌍</span>
          <h3 className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-lg font-bold text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]">
            HONOR BOARD
          </h3>
          <span className="text-lg drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">🏆</span>
        </div>

        {/* Vertical Stacked Bars */}
        <div className="relative flex flex-col gap-2 z-10">
          {statItems.map((item, index) => {
            const progressPercent = Math.min((item.value / maxValue) * 100, 100);
            
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative flex items-center gap-3 rounded-xl p-2 px-3 overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-default"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,215,0,0.05) 100%)",
                  borderLeft: `4px solid ${item.accentColor}`,
                }}
              >
                {/* Progress bar background */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <motion.div 
                    className="h-full"
                    style={{
                      background: `linear-gradient(90deg, ${item.accentColor}30 0%, transparent 100%)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, delay: index * 0.15, ease: "easeOut" }}
                  />
                </div>

                {/* Icon */}
                <div 
                  className={`relative z-10 rounded-lg ${item.bgColor} p-2 flex-shrink-0`} 
                  style={{ boxShadow: `0 0 12px ${item.accentColor}` }}
                >
                  <item.icon className="h-4 w-4 text-white drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                  <span className="text-sm font-medium text-yellow-200/90">{item.label}</span>
                  <span className="text-lg font-bold text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]">
                    {loading ? (
                      <span className="animate-pulse">...</span>
                    ) : (
                      <AnimatedCounter value={item.value} />
                    )}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
