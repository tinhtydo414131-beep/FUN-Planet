import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import {
  TrendingUp,
  Users,
  Gamepad2,
  Share2,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
} from "lucide-react";

interface UserGrowthData {
  date: string;
  users: number;
  cumulative: number;
}

interface GameAnalyticsData {
  name: string;
  plays: number;
  likes: number;
}

interface ReferralData {
  date: string;
  referrals: number;
  rewards: number;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function AdminAnalyticsTab() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("30");
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [gameAnalytics, setGameAnalytics] = useState<GameAnalyticsData[]>([]);
  const [referralData, setReferralData] = useState<ReferralData[]>([]);
  const [retentionData, setRetentionData] = useState<{ name: string; value: number }[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalUsers: 0,
    newUsersThisPeriod: 0,
    growthRate: 0,
    totalReferrals: 0,
    activeUsers: 0,
    retentionRate: 0,
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const fromDate = subDays(new Date(), days);

      // Load user growth data
      const { data: allUsers } = await supabase
        .from("profiles")
        .select("id, created_at")
        .order("created_at", { ascending: true });

      if (allUsers) {
        // Create daily user growth data
        const dateRange = eachDayOfInterval({
          start: fromDate,
          end: new Date(),
        });

        let cumulative = allUsers.filter(
          (u) => new Date(u.created_at) < fromDate
        ).length;

        const growthData: UserGrowthData[] = dateRange.map((date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          const newUsers = allUsers.filter(
            (u) => format(new Date(u.created_at), "yyyy-MM-dd") === dateStr
          ).length;
          cumulative += newUsers;
          return {
            date: format(date, "dd/MM"),
            users: newUsers,
            cumulative,
          };
        });

        setUserGrowth(growthData);

        // Calculate summary stats
        const usersThisPeriod = allUsers.filter(
          (u) => new Date(u.created_at) >= fromDate
        ).length;
        const usersPreviousPeriod = allUsers.filter(
          (u) =>
            new Date(u.created_at) >= subDays(fromDate, days) &&
            new Date(u.created_at) < fromDate
        ).length;

        const growthRate =
          usersPreviousPeriod > 0
            ? ((usersThisPeriod - usersPreviousPeriod) / usersPreviousPeriod) * 100
            : 100;

        setSummaryStats((prev) => ({
          ...prev,
          totalUsers: allUsers.length,
          newUsersThisPeriod: usersThisPeriod,
          growthRate,
        }));
      }

      // Load top games analytics
      const { data: games } = await supabase
        .from("uploaded_games")
        .select("id, title, play_count, rating_count")
        .eq("status", "approved")
        .order("play_count", { ascending: false })
        .limit(10);

      if (games) {
        setGameAnalytics(
          games.map((g) => ({
            name: g.title.length > 15 ? g.title.slice(0, 15) + "..." : g.title,
            plays: g.play_count || 0,
            likes: g.rating_count || 0,
          }))
        );
      }

      // Load referral data
      const { data: referrals } = await supabase
        .from("referrals")
        .select("id, created_at, reward_amount, reward_paid")
        .gte("created_at", fromDate.toISOString());

      if (referrals) {
        const referralByDate = new Map<string, { referrals: number; rewards: number }>();
        
        referrals.forEach((ref) => {
          const dateStr = format(new Date(ref.created_at), "dd/MM");
          const existing = referralByDate.get(dateStr) || { referrals: 0, rewards: 0 };
          existing.referrals++;
          if (ref.reward_paid) {
            existing.rewards += Number(ref.reward_amount) / 1000;
          }
          referralByDate.set(dateStr, existing);
        });

        setReferralData(
          Array.from(referralByDate.entries()).map(([date, data]) => ({
            date,
            ...data,
          }))
        );

        setSummaryStats((prev) => ({
          ...prev,
          totalReferrals: referrals.length,
        }));
      }

      // Calculate retention data (simplified)
      const { data: activeSessions } = await supabase
        .from("game_sessions")
        .select("user_id, created_at")
        .gte("created_at", subDays(new Date(), 7).toISOString());

      if (activeSessions && allUsers) {
        const activeUserIds = new Set(activeSessions.map((s) => s.user_id));
        const retentionRate = (activeUserIds.size / allUsers.length) * 100;

        setRetentionData([
          { name: "Active (7d)", value: activeUserIds.size },
          { name: "Inactive", value: allUsers.length - activeUserIds.size },
        ]);

        setSummaryStats((prev) => ({
          ...prev,
          activeUsers: activeUserIds.size,
          retentionRate,
        }));
      }
    } catch (error) {
      console.error("Load analytics error:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Advanced Analytics
        </h2>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{summaryStats.totalUsers.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-green-500">+{summaryStats.newUsersThisPeriod}</span>
                  <span className="text-muted-foreground">this period</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold">{summaryStats.growthRate.toFixed(1)}%</p>
                <div className="flex items-center gap-1 text-xs">
                  {summaryStats.growthRate >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={summaryStats.growthRate >= 0 ? "text-green-500" : "text-red-500"}>
                    vs previous period
                  </span>
                </div>
              </div>
              <TrendingUp className={`h-8 w-8 ${summaryStats.growthRate >= 0 ? "text-green-500" : "text-red-500"}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
                <p className="text-2xl font-bold">{summaryStats.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">this period</p>
              </div>
              <Share2 className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Retention (7d)</p>
                <p className="text-2xl font-bold">{summaryStats.retentionRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">{summaryStats.activeUsers} active users</p>
              </div>
              <Gamepad2 className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                    name="Total Users"
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.2}
                    name="New Users"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Retention Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">User Retention (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={retentionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {retentionData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Games Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Games (by Plays)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gameAnalytics} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="plays" fill="#3b82f6" name="Plays" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="likes" fill="#10b981" name="Likes" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Referral Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referral Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={referralData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="referrals"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Referrals"
                    dot={{ fill: "#8b5cf6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rewards"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="Rewards (K)"
                    dot={{ fill: "#f59e0b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
