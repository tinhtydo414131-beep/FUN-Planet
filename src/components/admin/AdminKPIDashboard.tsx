import React, { forwardRef, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Users,
  Gamepad2,
  Gem,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { format, subDays } from "date-fns";

// Safe wrapper to avoid ref warnings
const SafeCartesianGrid = (props: React.ComponentProps<typeof CartesianGrid>) => (
  <CartesianGrid {...props} />
);

interface KPIData {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  totalCAMLYDistributed: number;
  totalCAMLYClaimed: number;
  pendingCAMLY: number;
  weeklyNewUsers: number;
  weeklyGamesPlayed: number;
  weeklyCAMLYEarned: number;
  lastWeekNewUsers: number;
  lastWeekGamesPlayed: number;
  lastWeekCAMLYEarned: number;
}

interface TopUser {
  user_id: string;
  username: string;
  avatar_url: string | null;
  camly_earned: number;
}

interface UserGrowthPoint {
  date: string;
  users: number;
}

const COLORS = ["#22c55e", "#eab308", "#6366f1"];

const AdminKPIDashboard = forwardRef<HTMLDivElement, object>((props, ref) => {
  const [kpiData, setKpiData] = useState<KPIData>({
    totalUsers: 0,
    activeUsers: 0,
    totalGames: 0,
    totalCAMLYDistributed: 0,
    totalCAMLYClaimed: 0,
    pendingCAMLY: 0,
    weeklyNewUsers: 0,
    weeklyGamesPlayed: 0,
    weeklyCAMLYEarned: 0,
    lastWeekNewUsers: 0,
    lastWeekGamesPlayed: 0,
    lastWeekCAMLYEarned: 0,
  });
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadKPIs(),
        loadTopUsers(),
        loadUserGrowth(),
      ]);
    } catch (error) {
      console.error("Error loading KPI data:", error);
      toast.error("Failed to load KPI data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadKPIs = async () => {
    const now = new Date();
    const weekAgo = subDays(now, 7);
    const twoWeeksAgo = subDays(now, 14);
    const weekAgoStr = weekAgo.toISOString();
    const twoWeeksAgoStr = twoWeeksAgo.toISOString();

    // Total users
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Active users (last 7 days)
    const { count: activeUsers } = await supabase
      .from("user_game_plays")
      .select("user_id", { count: "exact", head: true })
      .gte("played_at", weekAgoStr);

    // Total games
    const { count: totalGames } = await supabase
      .from("uploaded_games")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved");

    // CAMLY distribution - from user_rewards
    const { data: rewardData } = await supabase
      .from("user_rewards")
      .select("total_earned, claimed_amount");

    const totalCAMLYDistributed = rewardData?.reduce((sum, r) => sum + (r.total_earned || 0), 0) || 0;
    const totalCAMLYClaimed = rewardData?.reduce((sum, r) => sum + (r.claimed_amount || 0), 0) || 0;

    // This week's new users
    const { count: weeklyNewUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgoStr);

    // Last week's new users
    const { count: lastWeekNewUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", twoWeeksAgoStr)
      .lt("created_at", weekAgoStr);

    // This week's games played
    const { count: weeklyGamesPlayed } = await supabase
      .from("user_game_plays")
      .select("*", { count: "exact", head: true })
      .gte("played_at", weekAgoStr);

    // Last week's games played
    const { count: lastWeekGamesPlayed } = await supabase
      .from("user_game_plays")
      .select("*", { count: "exact", head: true })
      .gte("played_at", twoWeeksAgoStr)
      .lt("played_at", weekAgoStr);

    // This week's CAMLY earned
    const { data: thisWeekRewards } = await supabase
      .from("daily_play_rewards")
      .select("time_rewards_earned, new_game_rewards_earned")
      .gte("reward_date", weekAgo.toISOString().split("T")[0]);

    const weeklyCAMLYEarned = thisWeekRewards?.reduce(
      (sum, r) => sum + (r.time_rewards_earned || 0) + (r.new_game_rewards_earned || 0), 0
    ) || 0;

    // Last week's CAMLY earned
    const { data: lastWeekRewards } = await supabase
      .from("daily_play_rewards")
      .select("time_rewards_earned, new_game_rewards_earned")
      .gte("reward_date", twoWeeksAgo.toISOString().split("T")[0])
      .lt("reward_date", weekAgo.toISOString().split("T")[0]);

    const lastWeekCAMLYEarned = lastWeekRewards?.reduce(
      (sum, r) => sum + (r.time_rewards_earned || 0) + (r.new_game_rewards_earned || 0), 0
    ) || 0;

    setKpiData({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      totalGames: totalGames || 0,
      totalCAMLYDistributed,
      totalCAMLYClaimed,
      pendingCAMLY: totalCAMLYDistributed - totalCAMLYClaimed,
      weeklyNewUsers: weeklyNewUsers || 0,
      weeklyGamesPlayed: weeklyGamesPlayed || 0,
      weeklyCAMLYEarned,
      lastWeekNewUsers: lastWeekNewUsers || 0,
      lastWeekGamesPlayed: lastWeekGamesPlayed || 0,
      lastWeekCAMLYEarned,
    });
  };

  const loadTopUsers = async () => {
    const weekAgo = subDays(new Date(), 7);
    
    const { data } = await supabase
      .from("daily_play_rewards")
      .select(`
        user_id,
        time_rewards_earned,
        new_game_rewards_earned,
        profiles:user_id (username, avatar_url)
      `)
      .gte("reward_date", weekAgo.toISOString().split("T")[0]);

    if (data) {
      const userMap: Record<string, TopUser> = {};
      
      data.forEach((row: any) => {
        const userId = row.user_id;
        if (!userMap[userId]) {
          userMap[userId] = {
            user_id: userId,
            username: row.profiles?.username || "Unknown",
            avatar_url: row.profiles?.avatar_url,
            camly_earned: 0,
          };
        }
        userMap[userId].camly_earned += (row.time_rewards_earned || 0) + (row.new_game_rewards_earned || 0);
      });

      const topUsersList = Object.values(userMap)
        .sort((a, b) => b.camly_earned - a.camly_earned)
        .slice(0, 5);

      setTopUsers(topUsersList);
    }
  };

  const loadUserGrowth = async () => {
    const days = 14;
    const dates: UserGrowthPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = date.toISOString().split("T")[0];
      
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .lte("created_at", date.toISOString());

      dates.push({
        date: format(date, "MMM d"),
        users: count || 0,
      });
    }

    setUserGrowth(dates);
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatChange = (percent: number) => {
    const isPositive = percent >= 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-500" : "text-red-500"}`}>
        {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
        {Math.abs(percent).toFixed(1)}%
      </span>
    );
  };

  const camlyDistributionData = [
    { name: "Claimed", value: kpiData.totalCAMLYClaimed },
    { name: "Pending", value: kpiData.pendingCAMLY },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">KPI Dashboard</h2>
          <p className="text-muted-foreground">Key performance indicators at a glance</p>
        </div>
        <Button variant="outline" onClick={loadAllData} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{kpiData.totalUsers.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">+{kpiData.weeklyNewUsers} this week</Badge>
                  {formatChange(getChangePercent(kpiData.weeklyNewUsers, kpiData.lastWeekNewUsers))}
                </div>
              </div>
              <Users className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users (7d)</p>
                <p className="text-3xl font-bold">{kpiData.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((kpiData.activeUsers / kpiData.totalUsers) * 100).toFixed(1)}% of total
                </p>
              </div>
              <Activity className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-3xl font-bold">{kpiData.totalGames.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Approved games</p>
              </div>
              <Gamepad2 className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total CAMLY</p>
                <p className="text-3xl font-bold">{(kpiData.totalCAMLYDistributed / 1_000_000).toFixed(2)}M</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((kpiData.totalCAMLYClaimed / kpiData.totalCAMLYDistributed) * 100).toFixed(1)}% claimed
                </p>
              </div>
              <Gem className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Comparison */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Games Played (This Week)</p>
                <p className="text-2xl font-bold">{kpiData.weeklyGamesPlayed.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">vs {kpiData.lastWeekGamesPlayed.toLocaleString()} last week</span>
                  {formatChange(getChangePercent(kpiData.weeklyGamesPlayed, kpiData.lastWeekGamesPlayed))}
                </div>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CAMLY Earned (This Week)</p>
                <p className="text-2xl font-bold">{kpiData.weeklyCAMLYEarned.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">vs {kpiData.lastWeekCAMLYEarned.toLocaleString()} last week</span>
                  {formatChange(getChangePercent(kpiData.weeklyCAMLYEarned, kpiData.lastWeekCAMLYEarned))}
                </div>
              </div>
              <Gem className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New Users (This Week)</p>
                <p className="text-2xl font-bold">{kpiData.weeklyNewUsers.toLocaleString()}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">vs {kpiData.lastWeekNewUsers.toLocaleString()} last week</span>
                  {formatChange(getChangePercent(kpiData.weeklyNewUsers, kpiData.lastWeekNewUsers))}
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              User Growth (14 Days)
            </CardTitle>
            <CardDescription>Total registered users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userGrowth}>
                <SafeCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CAMLY Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-amber-500" />
              CAMLY Distribution
            </CardTitle>
            <CardDescription>Claimed vs Pending CAMLY</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={camlyDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {camlyDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-amber-500" />
            Top Earners This Week
          </CardTitle>
          <CardDescription>Users with highest CAMLY earnings in the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>User</TableHead>
                <TableHead className="text-right">CAMLY Earned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUsers.map((user, index) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>{user.username?.[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-500">
                      {user.camly_earned.toLocaleString()} CAMLY
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {topUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No data available for this week
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
});

AdminKPIDashboard.displayName = "AdminKPIDashboard";

export { AdminKPIDashboard };
