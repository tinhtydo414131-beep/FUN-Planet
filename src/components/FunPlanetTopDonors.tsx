import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Gem, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { DonateCAMLYModal } from "./DonateCAMLYModal";

interface Donor {
  id: string;
  username: string;
  avatar_url: string | null;
  total_donated: number;
  is_anonymous: boolean;
}

const donorBadges = [
  { min: 10000000, label: "👑 Platinum", color: "text-purple-300" },
  { min: 1000000, label: "💎 Diamond", color: "text-cyan-300" },
  { min: 500000, label: "🥇 Gold", color: "text-yellow-300" },
  { min: 100000, label: "🥈 Silver", color: "text-gray-300" },
  { min: 0, label: "🥉 Bronze", color: "text-amber-600" },
];

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
  { emoji: "💎", delay: 0, x: "10%", y: "20%", duration: 4 },
  { emoji: "❤️", delay: 0.5, x: "85%", y: "15%", duration: 5 },
  { emoji: "✨", delay: 1, x: "15%", y: "80%", duration: 4.5 },
  { emoji: "💖", delay: 1.5, x: "80%", y: "75%", duration: 3.5 },
];

export const FunPlanetTopDonors = () => {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
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
      console.error("Error fetching donors:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative">
        {/* Outer Rose Glow */}
        <div 
          className="absolute rounded-3xl pointer-events-none"
          style={{
            inset: "-12px",
            boxShadow: `
              0 0 30px rgba(244, 63, 94, 0.5),
              0 0 50px rgba(236, 72, 153, 0.3),
              0 0 80px rgba(244, 63, 94, 0.2)
            `,
            zIndex: -15,
          }}
        />

        {/* Rose/Pink Metallic Border */}
        <div
          className="absolute rounded-3xl animate-metallic-shine"
          style={{
            inset: "-8px",
            background: `
              linear-gradient(135deg, 
                #f43f5e 0%, #fda4af 10%, #fecdd3 20%, 
                #f43f5e 35%, #be123c 50%, #f43f5e 65%, 
                #fecdd3 80%, #fda4af 90%, #f43f5e 100%
              )
            `,
            backgroundSize: "200% 200%",
            boxShadow: `
              0 0 10px rgba(244, 63, 94, 0.5),
              0 0 20px rgba(244, 63, 94, 0.3),
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
            background: "linear-gradient(135deg, rgba(136, 19, 55, 0.9) 0%, rgba(157, 23, 77, 0.85) 50%, rgba(190, 18, 60, 0.9) 100%)",
          }}
        >
          {/* Inner Border */}
          <div 
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{
              border: "2px solid rgba(244, 63, 94, 0.7)",
              boxShadow: "inset 0 0 25px rgba(244, 63, 94, 0.3)",
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
            style={{ opacity: 0.3 }}
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
          <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-rose-500/40 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-pink-500/40 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-32 rounded-full bg-rose-400/15 blur-2xl" />

          {/* Header */}
          <div className="relative mb-3 flex items-center justify-center gap-2 z-10">
            <motion.span 
              className="text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              💎
            </motion.span>
            <h3 
              className="bg-gradient-to-r from-rose-300 via-pink-400 to-rose-300 bg-clip-text text-base sm:text-lg font-bold text-transparent drop-shadow-[0_0_15px_rgba(244,63,94,0.7)]"
              style={{
                backgroundSize: "200% 100%",
                animation: "shimmer 3s linear infinite",
              }}
            >
              TOP DONORS
            </h3>
            <motion.span 
              className="text-base drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              ❤️
            </motion.span>
          </div>

          {/* Donors List */}
          <div className="relative z-10 flex-1">
            <AnimatePresence mode="wait">
              {loading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="animate-pulse text-white/70">Loading...</div>
                </div>
              ) : donors.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-rose-400 animate-pulse" />
                  <p className="text-sm">Chưa có ai ủng hộ. Hãy là người đầu tiên!</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  {donors.map((donor, index) => {
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
                        <span className="text-lg w-8 text-center font-bold">{getRankIcon(rank)}</span>
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
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Donate Button - Always visible */}
          <div className="relative z-10 mt-4">
            <Button
              onClick={() => setShowDonateModal(true)}
              className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 hover:from-rose-600 hover:via-pink-600 hover:to-rose-600 text-white font-bold py-3 shadow-lg shadow-rose-500/30 transition-all hover:scale-[1.02] animate-pulse hover:animate-none"
            >
              <Heart className="mr-2 h-5 w-5" />
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
        onSuccess={fetchDonors}
      />
    </>
  );
};
