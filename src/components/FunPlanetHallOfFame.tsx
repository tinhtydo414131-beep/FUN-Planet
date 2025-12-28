import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Gamepad2, Play, Upload, Gem, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";

// ============= Interfaces =============
interface Stats {
  totalUsers: number;
  totalGames: number;
  totalPlays: number;
  totalUploads: number;
  totalCamly: number;
}

interface Creator {
  id: string;
  username: string;
  avatar_url: string | null;
  games_count: number;
  total_plays: number;
}


// ============= Helper Components =============
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

// ============= Badge Configs =============
const creatorBadges = [
  { min: 10, label: "👑 Legend", color: "text-yellow-300" },
  { min: 5, label: "🔥 Hot Creator", color: "text-orange-400" },
  { min: 2, label: "⭐ Rising Star", color: "text-cyan-400" },
  { min: 0, label: "🌱 Newcomer", color: "text-green-400" },
];

const getCreatorBadge = (gamesCount: number) => {
  return creatorBadges.find(b => gamesCount >= b.min) || creatorBadges[creatorBadges.length - 1];
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
};

// ============= Floating Particles =============
const floatingParticles = [
  { emoji: "👑", delay: 0, x: "8%", y: "15%", duration: 4 },
  { emoji: "💎", delay: 0.5, x: "88%", y: "20%", duration: 5 },
  { emoji: "✨", delay: 1, x: "12%", y: "75%", duration: 4.5 },
  { emoji: "🎮", delay: 1.5, x: "85%", y: "80%", duration: 3.5 },
  { emoji: "🏆", delay: 2, x: "50%", y: "5%", duration: 4 },
];

// ============= Main Component =============
export const FunPlanetHallOfFame = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalGames: 0,
    totalPlays: 0,
    totalUploads: 0,
    totalCamly: 0,
  });
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch stats
      const [usersRes, gamesRes, playsRes, uploadsRes, camlyRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("uploaded_games").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("game_plays").select("*", { count: "exact", head: true }),
        supabase.from("uploaded_games").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("wallet_balance"),
      ]);

      const totalCamly = camlyRes.data?.reduce((sum, profile) => sum + (profile.wallet_balance || 0), 0) || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalGames: gamesRes.count || 0,
        totalPlays: playsRes.count || 0,
        totalUploads: uploadsRes.count || 0,
        totalCamly,
      });

      // Fetch creators
      const { data: gamesData } = await supabase
        .from("uploaded_games")
        .select("user_id, profiles!inner(id, username, avatar_url)")
        .eq("status", "approved");

      if (gamesData) {
        const creatorMap = new Map<string, Creator>();
        for (const game of gamesData) {
          const profile = game.profiles as any;
          if (!profile) continue;
          const existing = creatorMap.get(profile.id);
          if (existing) {
            existing.games_count++;
          } else {
            creatorMap.set(profile.id, {
              id: profile.id,
              username: profile.username,
              avatar_url: profile.avatar_url,
              games_count: 1,
              total_plays: 0,
            });
          }
        }

        const { data: playsData } = await supabase
          .from("game_plays")
          .select("game_id, uploaded_games!inner(user_id)");

        if (playsData) {
          for (const play of playsData) {
            const userId = (play.uploaded_games as any)?.user_id;
            if (userId && creatorMap.has(userId)) {
              creatorMap.get(userId)!.total_plays++;
            }
          }
        }

        setCreators(
          Array.from(creatorMap.values())
            .sort((a, b) => b.games_count - a.games_count || b.total_plays - a.total_plays)
            .slice(0, 5)
        );
      }

    } catch (error) {
      console.error("Error fetching hall of fame data:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(stats.totalUsers, stats.totalGames, stats.totalPlays, stats.totalUploads, stats.totalCamly, 1);

  const statItems = [
    { icon: Users, label: "Users", value: stats.totalUsers, bgColor: "bg-purple-500", accentColor: "#a855f7", suffix: "players" },
    { icon: Gamepad2, label: "Games", value: stats.totalGames, bgColor: "bg-teal-500", accentColor: "#14b8a6", suffix: "titles" },
    { icon: Play, label: "Plays", value: stats.totalPlays, bgColor: "bg-pink-500", accentColor: "#ec4899", suffix: "sessions" },
    { icon: Upload, label: "Uploads", value: stats.totalUploads, bgColor: "bg-green-500", accentColor: "#22c55e", suffix: "games" },
    { icon: Gem, label: "CAMLY", value: stats.totalCamly, bgColor: "bg-rose-500", accentColor: "#f43f5e", suffix: "💎" },
  ];

  return (
    <>
      <div className="relative">
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

        {/* Gold Metallic Border */}
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
          className="relative overflow-hidden rounded-3xl p-3 sm:p-4 shadow-xl h-full flex flex-col"
          style={{
            background: "linear-gradient(135deg, rgba(88, 28, 135, 0.9) 0%, rgba(49, 46, 129, 0.85) 50%, rgba(30, 58, 138, 0.9) 100%)",
          }}
        >
          {/* Inner Border */}
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              border: "2px solid rgba(255, 215, 0, 0.7)",
              boxShadow: "inset 0 0 25px rgba(255, 215, 0, 0.3)",
              zIndex: 5,
            }}
          />

          {/* Video Background - SHARED */}
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

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50 rounded-3xl z-[1]" />

          {/* Dot pattern */}
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

          {/* Header */}
          <div className="relative mb-3 flex items-center justify-center gap-2 z-10">
            <motion.span 
              className="text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              👑
            </motion.span>
            <h3 
              className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-base sm:text-lg font-bold text-transparent drop-shadow-[0_0_15px_rgba(255,215,0,0.7)]"
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

          {/* Tabs */}
          <Tabs defaultValue="stats" className="relative z-10 flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 bg-white/10 backdrop-blur-md rounded-xl p-1 mb-3 h-auto">
              <TabsTrigger 
                value="stats"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-blue-500 data-[state=active]:text-white rounded-lg font-semibold transition-all py-2 text-xs sm:text-sm text-white/70 data-[state=active]:shadow-lg"
              >
                <Users className="h-3.5 w-3.5 mr-1.5" />
                Stats
              </TabsTrigger>
              <TabsTrigger 
                value="creators"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white rounded-lg font-semibold transition-all py-2 text-xs sm:text-sm text-white/70 data-[state=active]:shadow-lg"
              >
                <Gamepad2 className="h-3.5 w-3.5 mr-1.5" />
                Creators
              </TabsTrigger>
            </TabsList>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-0">
              <div className="flex flex-col gap-1.5">
                {statItems.map((item, index) => {
                  const progressPercent = Math.min((item.value / maxValue) * 100, 100);
                  const isCamly = item.label === "CAMLY";
                  
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -2, boxShadow: `0 0 25px ${item.accentColor}50` }}
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
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <motion.div 
                          className="h-full"
                          style={{ background: `linear-gradient(90deg, ${item.accentColor}50 0%, ${item.accentColor}20 50%, transparent 100%)` }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1.5, delay: index * 0.15, ease: "easeOut" }}
                        />
                      </div>
                      <motion.div 
                        className={`relative z-10 rounded-lg ${item.bgColor} p-2 flex-shrink-0`}
                        style={{ boxShadow: `0 0 20px ${item.accentColor}80` }}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.2, ease: "easeInOut" }}
                      >
                        <item.icon className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]" />
                      </motion.div>
                      <div className="relative z-10 flex-1 flex items-center justify-between min-w-0">
                        <span className="text-xs font-semibold text-yellow-200">{item.label}</span>
                        <div className="flex items-center gap-1">
                          {isCamly && <Gem className="h-3.5 w-3.5 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />}
                          <span className="text-lg font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]">
                            {loading ? <span className="animate-pulse">...</span> : <AnimatedCounter value={item.value} />}
                          </span>
                          <span className="text-[10px] text-yellow-200/70 font-medium">{item.suffix}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Creators Tab */}
            <TabsContent value="creators" className="mt-0">
              <AnimatePresence mode="wait">
                {loading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="animate-pulse text-white/70">Loading...</div>
                  </div>
                ) : creators.length === 0 ? (
                  <div className="text-center text-white/60 py-8">
                    Chưa có creator nào. Hãy là người đầu tiên!
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                    {creators.map((creator, index) => {
                      const badge = getCreatorBadge(creator.games_count);
                      const rank = index + 1;
                      return (
                        <motion.div
                          key={creator.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="flex items-center gap-3 p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
                          style={{
                            boxShadow: rank <= 3 ? `0 0 15px ${rank === 1 ? 'rgba(255,215,0,0.4)' : rank === 2 ? 'rgba(192,192,192,0.4)' : 'rgba(205,127,50,0.4)'}` : undefined,
                          }}
                        >
                          <span className="text-lg w-8 text-center font-bold">{getRankIcon(rank)}</span>
                          <Avatar className="h-10 w-10 border-2 border-white/30">
                            <AvatarImage src={creator.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                              <User className="h-5 w-5 text-white" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">{creator.username}</div>
                            <div className={`text-xs ${badge.color}`}>{badge.label}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-white">
                              <Gamepad2 className="h-3 w-3 text-teal-400" />
                              <span>{creator.games_count}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-white/60">
                              <Play className="h-3 w-3" />
                              <span>{creator.total_plays}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

          </Tabs>
        </motion.div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 50%; }
            100% { background-position: -200% 50%; }
          }
        `}</style>
      </div>
    </>
  );
};
