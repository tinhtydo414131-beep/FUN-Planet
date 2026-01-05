import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Calendar,
  RefreshCw,
  Loader2,
  TrendingUp,
  Users,
  Gamepad2,
  Gem,
  Trophy,
  Download,
  Scale,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  LineChart,
  PieChart as PieChartIcon,
  Layers,
} from "lucide-react";
import { format } from "date-fns";

// Safe wrapper to avoid ref warnings
const SafeCartesianGrid = (props: React.ComponentProps<typeof CartesianGrid>) => (
  <CartesianGrid {...props} />
);

interface WeeklySummaryLog {
  id: string;
  user_id: string;
  week_start: string;
  games_played: number;
  camly_earned: number;
  new_achievements: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

interface SummaryStats {
  totalSummaries: number;
  totalGamesPlayed: number;
  totalCamlyDistributed: number;
  totalAchievements: number;
  uniqueUsers: number;
}

interface TrendDataPoint {
  week: string;
  weekFull: string;
  games: number;
  camly: number;
  achievements: number;
  users: number;
}

export function AdminWeeklySummaryStats() {
  const [logs, setLogs] = useState<WeeklySummaryLog[]>([]);
  const [stats, setStats] = useState<SummaryStats>({
    totalSummaries: 0,
    totalGamesPlayed: 0,
    totalCamlyDistributed: 0,
    totalAchievements: 0,
    uniqueUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string>("all");
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [chartType, setChartType] = useState<"area" | "bar" | "stacked" | "donut">("area");

  // Colors for charts
  const COLORS = ["#22c55e", "#eab308", "#a855f7", "#3b82f6"];

  // Comparison states
  const [compareMode, setCompareMode] = useState(false);
  const [compareWeek1, setCompareWeek1] = useState<string>("");
  const [compareWeek2, setCompareWeek2] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<{
    week1Stats: SummaryStats | null;
    week2Stats: SummaryStats | null;
  } | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadAvailableWeeks();
    loadTrendData();
  }, []);

  useEffect(() => {
    loadSummaryLogs();
  }, [selectedWeek]);

  const loadAvailableWeeks = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_summary_logs")
        .select("week_start")
        .order("week_start", { ascending: false });

      if (error) throw error;

      const uniqueWeeks = [...new Set((data || []).map((w) => w.week_start))];
      setAvailableWeeks(uniqueWeeks);
    } catch (error) {
      console.error("Load available weeks error:", error);
    }
  };

  const loadTrendData = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_summary_logs")
        .select("week_start, games_played, camly_earned, new_achievements, user_id")
        .order("week_start", { ascending: true });

      if (error) throw error;

      if (data) {
        const grouped: Record<string, {
          week: string;
          weekFull: string;
          games: number;
          camly: number;
          achievements: number;
          users: Set<string>;
        }> = {};

        data.forEach((log) => {
          const week = log.week_start;
          if (!grouped[week]) {
            grouped[week] = {
              week: format(new Date(week), "MMM d"),
              weekFull: format(new Date(week), "MMM d, yyyy"),
              games: 0,
              camly: 0,
              achievements: 0,
              users: new Set(),
            };
          }
          grouped[week].games += log.games_played || 0;
          grouped[week].camly += log.camly_earned || 0;
          grouped[week].achievements += log.new_achievements || 0;
          grouped[week].users.add(log.user_id);
        });

        const trendArray: TrendDataPoint[] = Object.values(grouped).map((g) => ({
          week: g.week,
          weekFull: g.weekFull,
          games: g.games,
          camly: g.camly,
          achievements: g.achievements,
          users: g.users.size,
        }));

        setTrendData(trendArray);
      }
    } catch (error) {
      console.error("Load trend data error:", error);
    }
  };

  const loadSummaryLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("weekly_summary_logs")
        .select(`
          *,
          profiles:user_id (username, avatar_url)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (selectedWeek !== "all") {
        query = query.eq("week_start", selectedWeek);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as WeeklySummaryLog[];
      setLogs(typedData);

      // Calculate stats
      const uniqueUserIds = new Set(typedData.map((l) => l.user_id));
      setStats({
        totalSummaries: typedData.length,
        totalGamesPlayed: typedData.reduce((sum, l) => sum + (l.games_played || 0), 0),
        totalCamlyDistributed: typedData.reduce((sum, l) => sum + (l.camly_earned || 0), 0),
        totalAchievements: typedData.reduce((sum, l) => sum + (l.new_achievements || 0), 0),
        uniqueUsers: uniqueUserIds.size,
      });
    } catch (error) {
      console.error("Load summary logs error:", error);
      toast.error("Failed to load weekly summary logs");
    } finally {
      setLoading(false);
    }
  };

  const calculateWeekStats = async (week: string): Promise<SummaryStats | null> => {
    const { data, error } = await supabase
      .from("weekly_summary_logs")
      .select("*")
      .eq("week_start", week);

    if (error || !data) return null;

    const uniqueUsers = new Set(data.map((d) => d.user_id));
    return {
      totalSummaries: data.length,
      totalGamesPlayed: data.reduce((sum, d) => sum + (d.games_played || 0), 0),
      totalCamlyDistributed: data.reduce((sum, d) => sum + (d.camly_earned || 0), 0),
      totalAchievements: data.reduce((sum, d) => sum + (d.new_achievements || 0), 0),
      uniqueUsers: uniqueUsers.size,
    };
  };

  const loadComparison = async () => {
    if (!compareWeek1 || !compareWeek2) {
      toast.error("Please select two weeks to compare");
      return;
    }

    setComparing(true);
    try {
      const [week1Stats, week2Stats] = await Promise.all([
        calculateWeekStats(compareWeek1),
        calculateWeekStats(compareWeek2),
      ]);

      setComparisonData({ week1Stats, week2Stats });
    } catch (error) {
      console.error("Load comparison error:", error);
      toast.error("Failed to load comparison data");
    } finally {
      setComparing(false);
    }
  };

  const getDiffBadge = (val1: number, val2: number) => {
    if (val1 === 0) return null;
    const diff = ((val2 - val1) / val1) * 100;
    const isPositive = diff >= 0;
    return (
      <Badge
        variant="outline"
        className={`ml-2 ${
          isPositive
            ? "border-green-500/50 text-green-500"
            : "border-red-500/50 text-red-500"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDownRight className="h-3 w-3 mr-1" />
        )}
        {Math.abs(diff).toFixed(1)}%
      </Badge>
    );
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      toast.error("No data to export");
      return;
    }

    setExporting(true);
    try {
      const headers = ["Username", "Week Start", "Games Played", "CAMLY Earned", "New Achievements", "Sent At"];
      const rows = logs.map((log) => [
        log.profiles?.username || "Unknown",
        format(new Date(log.week_start), "yyyy-MM-dd"),
        log.games_played.toString(),
        log.camly_earned.toString(),
        log.new_achievements.toString(),
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm"),
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `weekly-summaries-${selectedWeek === "all" ? "all" : selectedWeek}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${logs.length} records to CSV`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter & Actions Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Filter by week:</span>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📅 All Weeks</SelectItem>
              {availableWeeks.map((week) => (
                <SelectItem key={week} value={week}>
                  {format(new Date(week), "MMM d, yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedWeek !== "all" && (
            <Badge variant="secondary">
              Showing: {format(new Date(selectedWeek), "MMM d, yyyy")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={exporting || logs.length === 0}>
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => { loadSummaryLogs(); loadTrendData(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Summaries</p>
                <p className="text-xl font-bold">{stats.totalSummaries}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unique Users</p>
                <p className="text-xl font-bold">{stats.uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Games Played</p>
                <p className="text-xl font-bold">{stats.totalGamesPlayed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">CAMLY Earned</p>
                <p className="text-xl font-bold">{stats.totalCamlyDistributed.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-xl font-bold">{stats.totalAchievements}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Weekly Trend
                </CardTitle>
                <CardDescription>Games played and CAMLY earned over time</CardDescription>
              </div>
              <div className="flex gap-1 flex-wrap">
                <Button
                  variant={chartType === "area" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("area")}
                  className="gap-1"
                >
                  <LineChart className="h-4 w-4" />
                  Area
                </Button>
                <Button
                  variant={chartType === "bar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("bar")}
                  className="gap-1"
                >
                  <BarChart3 className="h-4 w-4" />
                  Bar
                </Button>
                <Button
                  variant={chartType === "stacked" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("stacked")}
                  className="gap-1"
                >
                  <Layers className="h-4 w-4" />
                  Stacked
                </Button>
                <Button
                  variant={chartType === "donut" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType("donut")}
                  className="gap-1"
                >
                  <PieChartIcon className="h-4 w-4" />
                  Donut
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              {chartType === "donut" ? (
                <PieChart>
                  <Pie
                    data={[
                      { name: "Games Played", value: stats.totalGamesPlayed, color: "#22c55e" },
                      { name: "CAMLY Earned", value: stats.totalCamlyDistributed, color: "#eab308" },
                      { name: "Achievements", value: stats.totalAchievements, color: "#a855f7" },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))" }}
                  >
                    {[
                      { name: "Games Played", value: stats.totalGamesPlayed, color: "#22c55e" },
                      { name: "CAMLY Earned", value: stats.totalCamlyDistributed, color: "#eab308" },
                      { name: "Achievements", value: stats.totalAchievements, color: "#a855f7" },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend />
                </PieChart>
              ) : chartType === "stacked" ? (
                <BarChart data={trendData}>
                  <SafeCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.weekFull;
                      }
                      return "";
                    }}
                  />
                  <Legend />
                  <Bar dataKey="games" stackId="a" fill="#22c55e" name="Games Played" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="achievements" stackId="a" fill="#a855f7" name="Achievements" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : chartType === "bar" ? (
                <BarChart data={trendData}>
                  <SafeCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.weekFull;
                      }
                      return "";
                    }}
                  />
                  <Legend />
                  <Bar dataKey="games" fill="#22c55e" name="Games Played" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="camly" fill="#eab308" name="CAMLY Earned" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorGames" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCamly" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <SafeCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(_, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.weekFull;
                      }
                      return "";
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="games" stroke="#22c55e" fill="url(#colorGames)" name="Games Played" strokeWidth={2} />
                  <Area type="monotone" dataKey="camly" stroke="#eab308" fill="url(#colorCamly)" name="CAMLY Earned" strokeWidth={2} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Week Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Week Comparison
            </div>
            <Switch checked={compareMode} onCheckedChange={setCompareMode} />
          </CardTitle>
          <CardDescription>Compare metrics between two different weeks</CardDescription>
        </CardHeader>
        {compareMode && (
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <Select value={compareWeek1} onValueChange={setCompareWeek1}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Week 1" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map((week) => (
                    <SelectItem key={week} value={week}>
                      {format(new Date(week), "MMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-muted-foreground font-medium">vs</span>

              <Select value={compareWeek2} onValueChange={setCompareWeek2}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Week 2" />
                </SelectTrigger>
                <SelectContent>
                  {availableWeeks.map((week) => (
                    <SelectItem key={week} value={week}>
                      {format(new Date(week), "MMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={loadComparison} disabled={comparing}>
                {comparing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Scale className="h-4 w-4 mr-2" />}
                Compare
              </Button>
            </div>

            {comparisonData && comparisonData.week1Stats && comparisonData.week2Stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Week 1 Stats */}
                <Card className="border-blue-500/30 bg-blue-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-blue-500">
                      {format(new Date(compareWeek1), "MMM d, yyyy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Summaries:</span><span className="font-bold">{comparisonData.week1Stats.totalSummaries}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Games:</span><span className="font-bold text-green-500">{comparisonData.week1Stats.totalGamesPlayed.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">CAMLY:</span><span className="font-bold text-yellow-500">{comparisonData.week1Stats.totalCamlyDistributed.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Achievements:</span><span className="font-bold text-purple-500">{comparisonData.week1Stats.totalAchievements}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Users:</span><span className="font-bold">{comparisonData.week1Stats.uniqueUsers}</span></div>
                  </CardContent>
                </Card>

                {/* Week 2 Stats with Diff */}
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-500">
                      {format(new Date(compareWeek2), "MMM d, yyyy")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Summaries:</span><span className="font-bold flex items-center">{comparisonData.week2Stats.totalSummaries}{getDiffBadge(comparisonData.week1Stats.totalSummaries, comparisonData.week2Stats.totalSummaries)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Games:</span><span className="font-bold text-green-500 flex items-center">{comparisonData.week2Stats.totalGamesPlayed.toLocaleString()}{getDiffBadge(comparisonData.week1Stats.totalGamesPlayed, comparisonData.week2Stats.totalGamesPlayed)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">CAMLY:</span><span className="font-bold text-yellow-500 flex items-center">{comparisonData.week2Stats.totalCamlyDistributed.toLocaleString()}{getDiffBadge(comparisonData.week1Stats.totalCamlyDistributed, comparisonData.week2Stats.totalCamlyDistributed)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Achievements:</span><span className="font-bold text-purple-500 flex items-center">{comparisonData.week2Stats.totalAchievements}{getDiffBadge(comparisonData.week1Stats.totalAchievements, comparisonData.week2Stats.totalAchievements)}</span></div>
                    <div className="flex justify-between items-center"><span className="text-muted-foreground">Users:</span><span className="font-bold flex items-center">{comparisonData.week2Stats.uniqueUsers}{getDiffBadge(comparisonData.week1Stats.uniqueUsers, comparisonData.week2Stats.uniqueUsers)}</span></div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Weekly Summary History
            {logs.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {logs.length} records
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No weekly summaries found</p>
              <p className="text-sm">
                {selectedWeek !== "all" 
                  ? "Try selecting a different week or 'All Weeks'" 
                  : "Summaries will appear here after the first send"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Week Start</TableHead>
                  <TableHead className="text-center">Games</TableHead>
                  <TableHead className="text-center">CAMLY</TableHead>
                  <TableHead className="text-center">Achievements</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.profiles?.avatar_url || undefined} />
                          <AvatarFallback>
                            {log.profiles?.username?.charAt(0).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{log.profiles?.username || "Unknown"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {format(new Date(log.week_start), "MMM d, yyyy")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-500/20 text-green-600">
                        🎮 {log.games_played}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-yellow-500/20 text-yellow-600">
                        💎 {log.camly_earned.toLocaleString()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-purple-500/20 text-purple-600">
                        🏆 {log.new_achievements}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(log.created_at), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
