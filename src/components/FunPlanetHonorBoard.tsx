import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const prevValueRef = useRef(value);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    const startValue = prevValueRef.current;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Smooth interpolation from previous value to new value
      setCount(Math.floor(startValue + (value - startValue) * progress));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);
  
  return <span className="text-white">{count.toLocaleString()}</span>;
};

// Floating particles configuration
const floatingParticles = [
  { emoji: "👤", delay: 0, x: "10%", y: "15%", duration: 4 },
  { emoji: "🎮", delay: 0.5, x: "85%", y: "25%", duration: 5 },
  { emoji: "▶️", delay: 1, x: "12%", y: "65%", duration: 4.5 },
  { emoji: "📤", delay: 1.5, x: "82%", y: "70%", duration: 3.5 },
  { emoji: "💎", delay: 2, x: "50%", y: "8%", duration: 4 },
];

export const FunPlanetHonorBoard = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalGames: 0,
    totalPlays: 0,
    totalUploads: 0,
    totalCamly: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Count games from uploaded_games (approved)
      const { count: uploadedGamesCount } = await supabase
        .from("uploaded_games")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved");

      // Count games from lovable_games (approved)
      const { count: lovableGamesCount } = await supabase
        .from("lovable_games")
        .select("*", { count: "exact", head: true })
        .eq("approved", true);

      // Total games = uploaded_games + lovable_games
      const totalGames = (uploadedGamesCount || 0) + (lovableGamesCount || 0);

      // Count unique players from game_plays
      const { data: playersData } = await supabase
        .from("game_plays")
        .select("user_id");
      
      const uniquePlayers = new Set(playersData?.map(p => p.user_id) || []).size;

      const { count: uploadsCount } = await supabase
        .from("uploaded_games")
        .select("*", { count: "exact", head: true });

      const { data: camlyData } = await supabase
        .from("profiles")
        .select("wallet_balance");
      
      const totalCamly = camlyData?.reduce((sum, profile) => sum + (profile.wallet_balance || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalGames: totalGames,
        totalPlays: uniquePlayers,
        totalUploads: uploadsCount || 0,
        totalCamly: totalCamly,
      });
      
      // Flash update indicator
      setHasUpdate(true);
      setTimeout(() => setHasUpdate(false), 1000);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    fetchStats();

    // Subscribe to profiles changes
    const profilesChannel = supabase
      .channel('honor_board_profiles')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchStats()
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setIsLive(true);
      });

    // Subscribe to uploaded_games changes
    const gamesChannel = supabase
      .channel('honor_board_games')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'uploaded_games' },
        () => fetchStats()
      )
      .subscribe();

    // Subscribe to game_plays changes
    const playsChannel = supabase
      .channel('honor_board_plays')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'game_plays' },
        () => fetchStats()
      )
      .subscribe();

    // Subscribe to lovable_games changes
    const lovableGamesChannel = supabase
      .channel('honor_board_lovable_games')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'lovable_games' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      setIsLive(false);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(gamesChannel);
      supabase.removeChannel(playsChannel);
      supabase.removeChannel(lovableGamesChannel);
    };
  }, [fetchStats]);

  // Calculate max value for progress bar percentage
  const maxValue = Math.max(stats.totalUsers, stats.totalGames, stats.totalPlays, stats.totalUploads, stats.totalCamly, 1);

  const statItems = [
    { icon: Users, label: "Users", value: stats.totalUsers, bgColor: "bg-purple-500", accentColor: "#a855f7", suffix: "players" },
    { icon: Gamepad2, label: "Games", value: stats.totalGames, bgColor: "bg-teal-500", accentColor: "#14b8a6", suffix: "titles" },
    { icon: Play, label: "Players", value: stats.totalPlays, bgColor: "bg-pink-500", accentColor: "#ec4899", suffix: "gamers" },
    { icon: Upload, label: "Uploads", value: stats.totalUploads, bgColor: "bg-green-500", accentColor: "#22c55e", suffix: "games" },
    { icon: Gem, label: "CAMLY", value: stats.totalCamly, bgColor: "bg-rose-500", accentColor: "#f43f5e", suffix: "💎" },
  ];

  return (
    <div className="relative h-full">
      {/* Outer Gold Glow */}
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

      {/* Gold Metallic Border - 8px */}
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
        className="relative overflow-hidden rounded-3xl p-3 shadow-xl"
        style={{
          background: "linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(49, 46, 129, 0.85) 50%, rgba(30, 58, 138, 0.9) 100%)",
        }}
      >
        {/* Inner Border Highlight */}
        <div 
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            border: "2px solid rgba(255, 215, 0, 0.7)",
            boxShadow: "inset 0 0 25px rgba(255, 215, 0, 0.3)",
            zIndex: 5,
          }}
        />

        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover rounded-3xl z-0"
          style={{ opacity: 0.4 }}
        >
          <source src="/videos/honor-board-bg.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50 rounded-3xl z-[1]" />

        {/* Dot pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10 rounded-3xl"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }}
        />

        {/* Floating Particles */}
        {floatingParticles.map((particle, index) => (
          <motion.div
            key={index}
            className="absolute text-sm pointer-events-none z-20"
            style={{ left: particle.x, top: particle.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0.8, 0],
              scale: [0.5, 1, 1, 0.5],
              y: [0, -15, -30, -45],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {particle.emoji}
          </motion.div>
        ))}

        {/* Glow effects */}
        <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-purple-500/40 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-blue-500/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-32 rounded-full bg-yellow-400/15 blur-2xl" />
        
        {/* Live Indicator */}
        {isLive && (
          <motion.div 
            className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-[10px] text-green-300 font-medium">LIVE</span>
          </motion.div>
        )}

        {/* Update Flash */}
        <AnimatePresence>
          {hasUpdate && (
            <motion.div 
              className="absolute inset-0 z-30 pointer-events-none rounded-3xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                background: "radial-gradient(circle at center, rgba(74, 222, 128, 0.2) 0%, transparent 70%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Header with Animated Emojis */}
        <div className="relative mb-2 flex items-center justify-center gap-2 z-10">
          <motion.span 
            className="text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            🌍
          </motion.span>
          <h3 
            className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-base font-bold text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]"
            style={{
              backgroundSize: "200% 100%",
              animation: "shimmer 3s linear infinite",
            }}
          >
            HONOR BOARD
          </h3>
          <motion.span 
            className="text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            🏆
          </motion.span>
        </div>

        {/* Vertical Stacked Bars */}
        <div className="relative flex flex-col gap-1.5 z-10">
          {statItems.map((item, index) => {
            const progressPercent = Math.min((item.value / maxValue) * 100, 100);
            const isCamly = item.label === "CAMLY";
            
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  boxShadow: `0 0 25px ${item.accentColor}50`,
                }}
                className="relative flex items-center gap-2 rounded-xl p-1.5 px-2.5 overflow-hidden cursor-pointer transition-all duration-300"
                style={{
                  background: "linear-gradient(90deg, rgba(255,255,255,0.12) 0%, rgba(255,215,0,0.05) 100%)",
                  borderLeft: `4px solid ${item.accentColor}`,
                  ...(isCamly && {
                    border: "2px solid rgba(244, 63, 94, 0.6)",
                    borderLeft: `4px solid ${item.accentColor}`,
                    boxShadow: "0 0 20px rgba(244, 63, 94, 0.3)",
                  }),
                }}
              >
                {/* Progress bar background - Enhanced gradient */}
                <div className="absolute inset-0 rounded-xl overflow-hidden">
                  <motion.div 
                    className="h-full"
                    style={{
                      background: `linear-gradient(90deg, ${item.accentColor}50 0%, ${item.accentColor}20 50%, transparent 100%)`,
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1.5, delay: index * 0.15, ease: "easeOut" }}
                  />
                </div>

                {/* Icon with Pulse Animation */}
                <motion.div 
                  className={`relative z-10 rounded-lg ${item.bgColor} p-2 flex-shrink-0`}
                  style={{ boxShadow: `0 0 20px ${item.accentColor}80` }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.2, ease: "easeInOut" }}
                >
                  <item.icon className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                </motion.div>

                {/* Content */}
                <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                  <span className="text-xs font-semibold text-yellow-200">{item.label}</span>
                  <div className="flex items-center gap-1">
                    {isCamly && <Gem className="h-3.5 w-3.5 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />}
                    <span className="relative z-20 text-lg font-black text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]" style={{ textShadow: '0 0 8px #fff, 1px 1px 2px #000' }}>
                      {loading ? (
                        <span className="animate-pulse">...</span>
                      ) : (
                        <AnimatedCounter value={item.value} />
                      )}
                    </span>
                    <span className="text-[10px] text-white font-medium drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]">{item.suffix}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 50%; }
          100% { background-position: -200% 50%; }
        }
      `}</style>
    </div>
  );
};
