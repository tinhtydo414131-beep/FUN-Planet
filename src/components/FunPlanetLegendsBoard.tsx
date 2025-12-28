import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Gamepad2, Gem, Play, Heart, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DonateCAMLYModal } from "./DonateCAMLYModal";

interface Creator {
  id: string;
  username: string;
  avatar_url: string | null;
  games_count: number;
  total_plays: number;
}

interface Donor {
  id: string;
  username: string;
  avatar_url: string | null;
  total_donated: number;
  is_anonymous: boolean;
}

type TabType = "creators" | "donors";

// Badge configurations
const creatorBadges = [
  { min: 10, label: "👑 Legend", color: "text-yellow-300" },
  { min: 5, label: "🔥 Hot Creator", color: "text-orange-400" },
  { min: 2, label: "⭐ Rising Star", color: "text-cyan-400" },
  { min: 0, label: "🌱 Newcomer", color: "text-green-400" },
];

const donorBadges = [
  { min: 10000000, label: "👑 Platinum", color: "text-purple-300" },
  { min: 1000000, label: "💎 Diamond", color: "text-cyan-300" },
  { min: 500000, label: "🥇 Gold", color: "text-yellow-300" },
  { min: 100000, label: "🥈 Silver", color: "text-gray-300" },
  { min: 0, label: "🥉 Bronze", color: "text-amber-600" },
];

const getCreatorBadge = (gamesCount: number) => {
  return creatorBadges.find(b => gamesCount >= b.min) || creatorBadges[creatorBadges.length - 1];
};

const getDonorBadge = (totalDonated: number) => {
  return donorBadges.find(b => totalDonated >= b.min) || donorBadges[donorBadges.length - 1];
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}`;
};

const floatingParticles = [
  { emoji: "👑", delay: 0, x: "8%", y: "20%", duration: 4 },
  { emoji: "💎", delay: 0.5, x: "88%", y: "15%", duration: 5 },
  { emoji: "✨", delay: 1, x: "15%", y: "75%", duration: 4.5 },
  { emoji: "🎮", delay: 1.5, x: "85%", y: "80%", duration: 3.5 },
  { emoji: "💜", delay: 2, x: "50%", y: "5%", duration: 4 },
];

export const FunPlanetLegendsBoard = () => {
  const [activeTab, setActiveTab] = useState<TabType>("creators");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch top creators - users with most approved games
      const { data: gamesData } = await supabase
        .from("uploaded_games")
        .select("user_id, profiles!inner(id, username, avatar_url)")
        .eq("status", "approved");

      if (gamesData) {
        // Count games and plays per user
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

        // Get play counts
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

      // Fetch top donors
      const { data: donationsData } = await supabase
        .from("platform_donations")
        .select("user_id, amount, is_anonymous, profiles!inner(id, username, avatar_url)")
        .order("created_at", { ascending: false });

      if (donationsData) {
        const donorMap = new Map<string, Donor>();
        
        for (const donation of donationsData) {
          const profile = donation.profiles as any;
          if (!profile) continue;
          
          const existing = donorMap.get(profile.id);
          if (existing) {
            existing.total_donated += donation.amount;
          } else {
            donorMap.set(profile.id, {
              id: profile.id,
              username: donation.is_anonymous ? "Anonymous" : profile.username,
              avatar_url: donation.is_anonymous ? null : profile.avatar_url,
              total_donated: donation.amount,
              is_anonymous: donation.is_anonymous,
            });
          }
        }

        setDonors(
          Array.from(donorMap.values())
            .sort((a, b) => b.total_donated - a.total_donated)
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error("Error fetching legends data:", error);
    } finally {
      setLoading(false);
    }
  };

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
          className="relative overflow-hidden rounded-3xl p-3 sm:p-4 shadow-xl"
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

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/30 rounded-3xl" />

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
              FUN PLANET LEGENDS
            </h3>
            <motion.span 
              className="text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              👑
            </motion.span>
          </div>

          {/* Tabs */}
          <div className="relative z-10 flex gap-2 mb-3">
            <button
              onClick={() => setActiveTab("creators")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "creators"
                  ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/50"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              <Gamepad2 className="h-4 w-4" />
              <span className="text-sm">Top Creators</span>
            </button>
            <button
              onClick={() => setActiveTab("donors")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "donors"
                  ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg shadow-rose-500/50"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              <Gem className="h-4 w-4" />
              <span className="text-sm">Top Donors</span>
            </button>
          </div>

          {/* Content */}
          <div className="relative z-10 space-y-1.5 min-h-[200px]">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-[280px]"
                >
                  <div className="animate-pulse text-white/70">Loading...</div>
                </motion.div>
              ) : activeTab === "creators" ? (
                <motion.div
                  key="creators"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-2"
                >
                  {creators.length === 0 ? (
                    <div className="text-center text-white/60 py-8">
                      Chưa có creator nào. Hãy là người đầu tiên!
                    </div>
                  ) : (
                    creators.map((creator, index) => {
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
                          <span className="text-lg w-8 text-center font-bold">
                            {getRankIcon(rank)}
                          </span>
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
                    })
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="donors"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-2"
                >
                  {donors.length === 0 ? (
                    <div className="text-center text-white/60 py-8">
                      <Heart className="h-8 w-8 mx-auto mb-2 text-rose-400" />
                      <p>Chưa có ai ủng hộ. Hãy là người đầu tiên!</p>
                    </div>
                  ) : (
                    donors.map((donor, index) => {
                      const badge = getDonorBadge(donor.total_donated);
                      const rank = index + 1;
                      
                      return (
                        <motion.div
                          key={donor.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          className="flex items-center gap-3 p-2 rounded-xl bg-white/10 hover:bg-white/15 transition-all cursor-pointer"
                          style={{
                            boxShadow: rank <= 3 ? `0 0 15px ${rank === 1 ? 'rgba(255,215,0,0.4)' : rank === 2 ? 'rgba(192,192,192,0.4)' : 'rgba(205,127,50,0.4)'}` : undefined,
                          }}
                        >
                          <span className="text-lg w-8 text-center font-bold">
                            {getRankIcon(rank)}
                          </span>
                          <Avatar className="h-10 w-10 border-2 border-white/30">
                            {donor.is_anonymous ? (
                              <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-700">
                                <span className="text-lg">🎭</span>
                              </AvatarFallback>
                            ) : (
                              <>
                                <AvatarImage src={donor.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-pink-500">
                                  <User className="h-5 w-5 text-white" />
                                </AvatarFallback>
                              </>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">
                              {donor.is_anonymous ? "Ẩn danh" : donor.username}
                            </div>
                            <div className={`text-xs ${badge.color}`}>{badge.label}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-rose-300 font-semibold">
                              <Gem className="h-3 w-3" />
                              <span>{donor.total_donated.toLocaleString()}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Donate Button */}
          <div className="relative z-10 mt-4">
            <Button
              onClick={() => setShowDonateModal(true)}
              className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 hover:from-rose-600 hover:via-pink-600 hover:to-rose-600 text-white font-bold py-3 shadow-lg shadow-rose-500/30 transition-all hover:scale-[1.02]"
            >
              <Heart className="mr-2 h-5 w-5 animate-pulse" />
              💎 Ủng hộ FUN Planet
            </Button>
          </div>
        </motion.div>

        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 50%; }
            100% { background-position: -200% 50%; }
          }
        `}</style>
      </div>

      <DonateCAMLYModal 
        open={showDonateModal} 
        onOpenChange={setShowDonateModal}
        onSuccess={fetchData}
      />
    </>
  );
};
