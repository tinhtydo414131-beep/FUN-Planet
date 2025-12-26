import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Flame, MessageCircle, BookOpen, Brain, Heart, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Achievement {
  id: string;
  type: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requirement: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: "first_chat",
    type: "first_chat",
    name: "Lần Đầu Gặp Gỡ",
    description: "Trò chuyện lần đầu với Angel AI",
    icon: <MessageCircle className="w-6 h-6" />,
    color: "from-pink-500 to-rose-500",
    requirement: "Gửi tin nhắn đầu tiên"
  },
  {
    id: "curious_10",
    type: "curious_10",
    name: "Bé Tò Mò",
    description: "Hỏi Angel 10 câu hỏi",
    icon: <Star className="w-6 h-6" />,
    color: "from-yellow-500 to-amber-500",
    requirement: "10 câu hỏi"
  },
  {
    id: "curious_50",
    type: "curious_50",
    name: "Nhà Khám Phá",
    description: "Hỏi Angel 50 câu hỏi",
    icon: <Star className="w-6 h-6" />,
    color: "from-orange-500 to-red-500",
    requirement: "50 câu hỏi"
  },
  {
    id: "curious_100",
    type: "curious_100",
    name: "Siêu Tò Mò",
    description: "Hỏi Angel 100 câu hỏi",
    icon: <Sparkles className="w-6 h-6" />,
    color: "from-purple-500 to-violet-500",
    requirement: "100 câu hỏi"
  },
  {
    id: "quiz_streak_3",
    type: "quiz_streak_3",
    name: "Chăm Chỉ",
    description: "Hoàn thành quiz 3 ngày liên tiếp",
    icon: <Flame className="w-6 h-6" />,
    color: "from-orange-500 to-yellow-500",
    requirement: "3 ngày streak"
  },
  {
    id: "quiz_streak_7",
    type: "quiz_streak_7",
    name: "Ngôi Sao Kiên Trì",
    description: "Hoàn thành quiz 7 ngày liên tiếp",
    icon: <Flame className="w-6 h-6" />,
    color: "from-red-500 to-orange-500",
    requirement: "7 ngày streak"
  },
  {
    id: "quiz_streak_30",
    type: "quiz_streak_30",
    name: "Huyền Thoại",
    description: "Hoàn thành quiz 30 ngày liên tiếp",
    icon: <Trophy className="w-6 h-6" />,
    color: "from-yellow-400 to-yellow-600",
    requirement: "30 ngày streak"
  },
  {
    id: "quiz_perfect",
    type: "quiz_perfect",
    name: "Hoàn Hảo",
    description: "Đạt điểm tuyệt đối trong quiz",
    icon: <Star className="w-6 h-6" />,
    color: "from-emerald-500 to-green-500",
    requirement: "5/5 câu đúng"
  },
  {
    id: "story_lover_5",
    type: "story_lover_5",
    name: "Bé Yêu Truyện",
    description: "Hoàn thành 5 câu chuyện",
    icon: <BookOpen className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    requirement: "5 truyện"
  },
  {
    id: "story_lover_20",
    type: "story_lover_20",
    name: "Nhà Văn Nhí",
    description: "Hoàn thành 20 câu chuyện",
    icon: <BookOpen className="w-6 h-6" />,
    color: "from-indigo-500 to-purple-500",
    requirement: "20 truyện"
  },
  {
    id: "brain_master",
    type: "brain_master",
    name: "Thần Đồng",
    description: "Trả lời đúng 50 câu quiz",
    icon: <Brain className="w-6 h-6" />,
    color: "from-violet-500 to-purple-600",
    requirement: "50 câu đúng"
  },
  {
    id: "kind_heart",
    type: "kind_heart",
    name: "Trái Tim Nhân Ái",
    description: "Chia sẻ 10 tin nhắn tích cực",
    icon: <Heart className="w-6 h-6" />,
    color: "from-pink-500 to-red-500",
    requirement: "10 tin nhắn"
  },
];

export function AchievementBadge() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement | null>(null);

  useEffect(() => {
    if (user) loadAchievements();
  }, [user]);

  const loadAchievements = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('angel_ai_achievements')
      .select('*')
      .eq('user_id', user.id);

    const unlockedTypes = new Set(data?.map(a => a.achievement_type) || []);
    const unlockedMap = new Map(data?.map(a => [a.achievement_type, a.unlocked_at]) || []);

    const allAchievements = ACHIEVEMENT_DEFINITIONS.map(def => ({
      ...def,
      unlocked: unlockedTypes.has(def.type),
      unlockedAt: unlockedMap.get(def.type)
    }));

    setAchievements(allAchievements);
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="h-full flex flex-col">
      {/* Newly unlocked popup */}
      <AnimatePresence>
        {newlyUnlocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setNewlyUnlocked(null)}
          >
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl text-center max-w-sm mx-4"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${newlyUnlocked.color} flex items-center justify-center text-white shadow-xl`}
              >
                {newlyUnlocked.icon}
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">🎉 Mở Khóa Thành Công!</h3>
              <p className="text-xl font-bold text-primary mb-1">{newlyUnlocked.name}</p>
              <p className="text-muted-foreground">{newlyUnlocked.description}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Huy Hiệu Của Bé
          </h2>
          <span className="text-sm text-muted-foreground">
            {unlockedCount}/{totalCount}
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            className="h-full bg-gradient-to-r from-yellow-500 to-amber-500"
          />
        </div>
      </div>

      {/* Achievements grid */}
      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((achievement, index) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-4 rounded-2xl border-2 transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 border-yellow-300 shadow-lg'
                  : 'bg-muted/30 border-transparent opacity-60'
              }`}
            >
              {/* Badge icon */}
              <div
                className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
                  achievement.unlocked
                    ? `bg-gradient-to-br ${achievement.color} text-white shadow-md`
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {achievement.unlocked ? (
                  achievement.icon
                ) : (
                  <Lock className="w-6 h-6" />
                )}
              </div>

              {/* Badge info */}
              <div className="text-center">
                <h4 className="font-bold text-sm mb-1">{achievement.name}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {achievement.description}
                </p>
                {!achievement.unlocked && (
                  <p className="text-xs text-primary mt-2 font-medium">
                    {achievement.requirement}
                  </p>
                )}
              </div>

              {/* Unlocked indicator */}
              {achievement.unlocked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow"
                >
                  <Star className="w-4 h-4 text-white fill-white" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {unlockedCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Bé chưa có huy hiệu nào!<br />
              Hãy trò chuyện với Angel để mở khóa nhé! 🌟
            </p>
          </motion.div>
        )}
      </ScrollArea>
    </div>
  );
}