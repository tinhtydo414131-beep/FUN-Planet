import { motion } from "framer-motion";
import { ChevronLeft, Trophy, Star, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AchievementLeaderboard as AchievementLeaderboardComponent } from "@/components/leaderboard/AchievementLeaderboard";

export default function AchievementLeaderboard() {
  const navigate = useNavigate();

  // Floating particles - Yellow, Pink, Blue theme
  const floatingParticles = [
    { color: "text-yellow-500", x: "5%", y: "15%", duration: 4, size: "w-5 h-5", type: "star" },
    { color: "text-pink-500", x: "92%", y: "20%", duration: 5, size: "w-4 h-4", type: "sparkle" },
    { color: "text-blue-500", x: "8%", y: "65%", duration: 4.5, size: "w-4 h-4", type: "star" },
    { color: "text-yellow-400", x: "88%", y: "60%", duration: 3.5, size: "w-5 h-5", type: "sparkle" },
    { color: "text-pink-400", x: "45%", y: "8%", duration: 4, size: "w-5 h-5", type: "star" },
    { color: "text-blue-400", x: "70%", y: "35%", duration: 5.5, size: "w-4 h-4", type: "sparkle" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-white via-pink-50/30 to-blue-50/30">
      {/* Subtle decorative gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-pink-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      {/* Floating Particles - Stars & Sparkles */}
      {floatingParticles.map((p, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -15, 0], opacity: [0.5, 0.9, 0.5], rotate: [0, 10, -10, 0] }}
          transition={{ duration: p.duration, repeat: Infinity }}
          className={`fixed pointer-events-none z-0 ${p.size} ${p.color}`}
          style={{ left: p.x, top: p.y, filter: `drop-shadow(0 0 6px currentColor)` }}
        >
          {p.type === "star" ? <Star className="w-full h-full fill-current" /> : <Sparkles className="w-full h-full" />}
        </motion.div>
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(-1)}
            className="bg-white border-pink-200 hover:bg-pink-50 shadow-sm"
          >
            <ChevronLeft className="h-6 w-6 text-pink-500" />
          </Button>
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.6))' }} />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
              Achievement Leaderboard
            </h1>
          </div>
        </motion.div>

        {/* Leaderboard Component */}
        <AchievementLeaderboardComponent />
      </div>
    </div>
  );
}
