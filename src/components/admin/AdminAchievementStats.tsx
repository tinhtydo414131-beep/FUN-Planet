import { useState, useEffect, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, Calendar, Star, RefreshCw, Loader2 } from "lucide-react";
import { format, startOfDay, startOfWeek, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AchievementStats {
  totalUnlocked: number;
  unlockedToday: number;
  unlockedThisWeek: number;
  popularTypes: { type: string; count: number }[];
  dailyData: { date: string; count: number }[];
  recentUnlocks: { user: string; type: string; time: string }[];
}

const ACHIEVEMENT_NAMES: Record<string, string> = {
  first_game: "Bé Chơi Game",
  explorer_3: "Bé Khám Phá",
  adventurer_10: "Nhà Thám Hiểm",
  master_25: "Siêu Sao",
  educational_5: "Bé Học Giỏi",
  creative_5: "Bé Sáng Tạo",
  music_5: "Bé Yêu Nhạc",
  playtime_60: "Bé Chơi Chăm",
  playtime_300: "Bé Siêng Năng",
  streak_3: "Bé Kiên Trì",
  streak_7: "Tuần Vàng",
  champion: "Nhà Vô Địch",
};

const COLORS = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];

const AdminAchievementStats = forwardRef<HTMLDivElement>((_, ref) => {
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }).toISOString();

      // Fetch all unlocked achievements
      const { data: allAchievements, error } = await supabase
        .from("game_achievements")
        .select("user_id, achievement_type, unlocked_at")
        .not("unlocked_at", "is", null);

      if (error) throw error;

      // Total unlocked
      const totalUnlocked = allAchievements?.length || 0;

      // Unlocked today
      const unlockedToday = allAchievements?.filter(a => 
        a.unlocked_at && new Date(a.unlocked_at) >= new Date(todayStart)
      ).length || 0;

      // Unlocked this week
      const unlockedThisWeek = allAchievements?.filter(a => 
        a.unlocked_at && new Date(a.unlocked_at) >= new Date(weekStart)
      ).length || 0;

      // Popular types
      const typeCount = new Map<string, number>();
      allAchievements?.forEach(a => {
        typeCount.set(a.achievement_type, (typeCount.get(a.achievement_type) || 0) + 1);
      });
      const popularTypes = Array.from(typeCount.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Daily data for last 7 days
      const dailyData: { date: string; count: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const day = subDays(now, i);
        const dayStart = startOfDay(day);
        const dayEnd = startOfDay(subDays(now, i - 1));
        
        const count = allAchievements?.filter(a => {
          if (!a.unlocked_at) return false;
          const date = new Date(a.unlocked_at);
          return date >= dayStart && date < dayEnd;
        }).length || 0;

        dailyData.push({
          date: format(day, "dd/MM"),
          count,
        });
      }

      // Recent unlocks
      const recentAchievements = allAchievements
        ?.sort((a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime())
        .slice(0, 5) || [];

      // Get usernames for recent
      const userIds = [...new Set(recentAchievements.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const recentUnlocks = recentAchievements.map(a => ({
        user: profiles?.find(p => p.id === a.user_id)?.username || "Anonymous",
        type: ACHIEVEMENT_NAMES[a.achievement_type] || a.achievement_type,
        time: a.unlocked_at ? format(new Date(a.unlocked_at), "HH:mm dd/MM") : "",
      }));

      setStats({
        totalUnlocked,
        unlockedToday,
        unlockedThisWeek,
        popularTypes,
        dailyData,
        recentUnlocks,
      });
    } catch (error) {
      console.error("Error fetching achievement stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div ref={ref} className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div ref={ref} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Achievement Analytics
        </h3>
        <Button variant="outline" size="sm" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tổng Unlocked</p>
                <p className="text-2xl font-bold">{stats.totalUnlocked}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Hôm nay</p>
                <p className="text-2xl font-bold text-green-500">{stats.unlockedToday}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tuần này</p>
                <p className="text-2xl font-bold text-blue-500">{stats.unlockedThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Daily Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Achievements 7 ngày qua
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#FFD700" 
                  strokeWidth={2}
                  dot={{ fill: "#FFD700" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Types Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4" />
              Achievement phổ biến
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.popularTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="type"
                >
                  {stats.popularTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }}
                  formatter={(value, name) => [value, ACHIEVEMENT_NAMES[name as string] || name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2 justify-center">
              {stats.popularTypes.slice(0, 4).map((item, idx) => (
                <Badge key={item.type} variant="outline" className="text-xs">
                  <span className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: COLORS[idx] }} />
                  {ACHIEVEMENT_NAMES[item.type] || item.type}: {item.count}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Unlocks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            Unlock gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.recentUnlocks.map((unlock, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">{unlock.user}</span>
                </div>
                <Badge variant="secondary">{unlock.type}</Badge>
                <span className="text-xs text-muted-foreground">{unlock.time}</span>
              </div>
            ))}
            {stats.recentUnlocks.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Chưa có unlock nào</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

AdminAchievementStats.displayName = "AdminAchievementStats";

export default AdminAchievementStats;
