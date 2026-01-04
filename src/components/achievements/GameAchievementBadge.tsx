import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, Trophy, Gamepad2, Sparkles, Heart, Rocket, 
  Crown, Compass, Palette, Book, Music, Zap, Lock,
  PartyPopper, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requirement: string;
  requiredCount: number;
  unlocked: boolean;
  progress: number;
  unlockedAt?: string;
}

const GAME_ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'progress' | 'unlockedAt'>[] = [
  {
    id: "first_game",
    type: "first_game",
    name: "Bé Chơi Game 🎮",
    description: "Chơi game đầu tiên trên FUN Planet",
    icon: <Gamepad2 className="w-6 h-6" />,
    color: "from-green-400 to-emerald-500",
    requirement: "Chơi 1 game",
    requiredCount: 1
  },
  {
    id: "explorer_5",
    type: "explorer_5",
    name: "Bé Khám Phá 🌍",
    description: "Khám phá 5 game khác nhau",
    icon: <Compass className="w-6 h-6" />,
    color: "from-blue-400 to-cyan-500",
    requirement: "5 games",
    requiredCount: 5
  },
  {
    id: "explorer_10",
    type: "explorer_10",
    name: "Nhà Thám Hiểm 🗺️",
    description: "Khám phá 10 game khác nhau",
    icon: <Rocket className="w-6 h-6" />,
    color: "from-purple-400 to-violet-500",
    requirement: "10 games",
    requiredCount: 10
  },
  {
    id: "explorer_25",
    type: "explorer_25",
    name: "Siêu Khám Phá 🚀",
    description: "Khám phá 25 game khác nhau",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-amber-400 to-orange-500",
    requirement: "25 games",
    requiredCount: 25
  },
  {
    id: "educational_3",
    type: "educational_3",
    name: "Bé Học Giỏi 📚",
    description: "Chơi 3 game Educational",
    icon: <Book className="w-6 h-6" />,
    color: "from-indigo-400 to-blue-500",
    requirement: "3 game học tập",
    requiredCount: 3
  },
  {
    id: "creative_3",
    type: "creative_3",
    name: "Bé Sáng Tạo 🎨",
    description: "Chơi 3 game Creative",
    icon: <Palette className="w-6 h-6" />,
    color: "from-pink-400 to-rose-500",
    requirement: "3 game sáng tạo",
    requiredCount: 3
  },
  {
    id: "music_3",
    type: "music_3",
    name: "Bé Yêu Nhạc 🎵",
    description: "Chơi 3 game Music",
    icon: <Music className="w-6 h-6" />,
    color: "from-fuchsia-400 to-purple-500",
    requirement: "3 game âm nhạc",
    requiredCount: 3
  },
  {
    id: "streak_3",
    type: "streak_3",
    name: "Bé Chăm Chỉ ⚡",
    description: "Chơi game 3 ngày liên tiếp",
    icon: <Zap className="w-6 h-6" />,
    color: "from-yellow-400 to-amber-500",
    requirement: "3 ngày streak",
    requiredCount: 3
  },
  {
    id: "streak_7",
    type: "streak_7",
    name: "Ngôi Sao Kiên Trì ⭐",
    description: "Chơi game 7 ngày liên tiếp",
    icon: <Star className="w-6 h-6" />,
    color: "from-orange-400 to-red-500",
    requirement: "7 ngày streak",
    requiredCount: 7
  },
  {
    id: "streak_30",
    type: "streak_30",
    name: "Huyền Thoại 👑",
    description: "Chơi game 30 ngày liên tiếp",
    icon: <Crown className="w-6 h-6" />,
    color: "from-yellow-300 to-yellow-500",
    requirement: "30 ngày streak",
    requiredCount: 30
  },
  {
    id: "play_time_60",
    type: "play_time_60",
    name: "Bé Chơi Ngoan 💖",
    description: "Tích lũy 60 phút chơi game",
    icon: <Heart className="w-6 h-6" />,
    color: "from-rose-400 to-pink-500",
    requirement: "60 phút",
    requiredCount: 60
  },
  {
    id: "champion",
    type: "champion",
    name: "Nhà Vô Địch 🏆",
    description: "Đạt top 10 bảng xếp hạng",
    icon: <Trophy className="w-6 h-6" />,
    color: "from-amber-300 to-yellow-400",
    requirement: "Top 10",
    requiredCount: 1
  },
];

interface GameAchievementBadgeProps {
  isChildFriendly?: boolean;
  onSyncAchievements?: () => Promise<boolean | undefined>;
}

export function GameAchievementBadge({ isChildFriendly = false, onSyncAchievements }: GameAchievementBadgeProps) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (!onSyncAchievements) return;
    setSyncing(true);
    try {
      const result = await onSyncAchievements();
      if (result) {
        toast.success("Đã đồng bộ thành tích! 🎉");
        await loadAchievements();
      }
    } catch (error) {
      toast.error("Không thể đồng bộ thành tích");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data } = await supabase
        .from('game_achievements')
        .select('*')
        .eq('user_id', user.id);

      const achievementMap = new Map(data?.map(a => [a.achievement_type, a]) || []);

      const allAchievements = GAME_ACHIEVEMENT_DEFINITIONS.map(def => {
        const dbAchievement = achievementMap.get(def.type);
        return {
          ...def,
          unlocked: !!dbAchievement?.unlocked_at,
          progress: dbAchievement?.progress || 0,
          unlockedAt: dbAchievement?.unlocked_at
        };
      });

      setAchievements(allAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Newly Unlocked Popup */}
      <AnimatePresence>
        {newlyUnlocked && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setNewlyUnlocked(null)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-2xl shadow-2xl text-center max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <PartyPopper className="w-16 h-16 mx-auto text-white mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">
                🎉 Chúc mừng bé! 🎉
              </h3>
              <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${newlyUnlocked.color} flex items-center justify-center text-white mb-4`}>
                {newlyUnlocked.icon}
              </div>
              <p className="text-xl font-bold text-white">{newlyUnlocked.name}</p>
              <p className="text-white/80 mt-2">{newlyUnlocked.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-yellow-500" />
            {isChildFriendly ? "Bộ Sưu Tập Huy Hiệu ⭐" : "Thành Tích Game"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Progress value={(unlockedCount / totalCount) * 100} className="flex-1" />
            <span className="text-sm font-medium">
              {isChildFriendly 
                ? `${unlockedCount}/${totalCount} ⭐` 
                : `${unlockedCount}/${totalCount}`}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            {isChildFriendly && (
              <p className="text-xs text-muted-foreground">
                Chơi game để mở khóa thêm huy hiệu nhé! 🎮
              </p>
            )}
            {onSyncAchievements && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                className="gap-2 ml-auto"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Đang đồng bộ...' : 'Đồng bộ'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Achievement Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {achievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group"
          >
            <div
              className={`
                aspect-square rounded-xl p-2 flex flex-col items-center justify-center text-center
                transition-all duration-300 cursor-pointer
                ${achievement.unlocked
                  ? `bg-gradient-to-br ${achievement.color} text-white shadow-lg hover:scale-105`
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }
              `}
            >
              {/* Icon */}
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center mb-1
                ${achievement.unlocked 
                  ? 'bg-white/20' 
                  : 'bg-muted-foreground/20'
                }
              `}>
                {achievement.unlocked ? achievement.icon : <Lock className="w-5 h-5" />}
              </div>

              {/* Name */}
              <p className="text-[10px] font-medium leading-tight line-clamp-2">
                {achievement.name}
              </p>

              {/* Progress for locked */}
              {!achievement.unlocked && achievement.progress > 0 && (
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary/50 rounded-full"
                      style={{ width: `${Math.min((achievement.progress / achievement.requiredCount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-popover text-popover-foreground text-xs p-2 rounded-lg shadow-lg whitespace-nowrap">
                <p className="font-medium">{achievement.name}</p>
                <p className="text-muted-foreground">{achievement.description}</p>
                <p className="text-primary mt-1">
                  {achievement.unlocked 
                    ? '✅ Đã mở khóa!' 
                    : `📊 ${achievement.progress}/${achievement.requiredCount}`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {unlockedCount === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <Gamepad2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {isChildFriendly 
                ? "Chơi game để mở khóa huy hiệu đầu tiên nhé bé! 🌟"
                : "Chưa có thành tích nào. Hãy chơi game để mở khóa!"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
