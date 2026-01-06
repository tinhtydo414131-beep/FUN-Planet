import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bot,
  MessageSquare,
  Users,
  TrendingUp,
  RefreshCw,
  Loader2,
  Calendar,
  Clock,
  Sparkles,
  Gamepad2,
  CheckCircle,
  AlertCircle,
  Play,
} from "lucide-react";
import { format, subDays } from "date-fns";
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
} from "recharts";

interface ChatStats {
  totalConversations: number;
  totalMessages: number;
  uniqueUsers: number;
  avgMessagesPerUser: number;
  todayMessages: number;
}

interface DailyActivity {
  date: string;
  messages: number;
  users: number;
}

interface TopUser {
  username: string;
  messageCount: number;
  lastActive: string;
}

interface GameReviewStats {
  totalGames: number;
  reviewedGames: number;
  missingReviews: number;
  autoRejected: number;
}

interface UnreviewedGame {
  id: string;
  title: string;
  created_at: string;
  status: string;
}

export function AdminAngelAITab() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>("7");
  const [stats, setStats] = useState<ChatStats>({
    totalConversations: 0,
    totalMessages: 0,
    uniqueUsers: 0,
    avgMessagesPerUser: 0,
    todayMessages: 0,
  });
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  
  // Game evaluation stats
  const [gameStats, setGameStats] = useState<GameReviewStats>({
    totalGames: 0,
    reviewedGames: 0,
    missingReviews: 0,
    autoRejected: 0,
  });
  const [unreviewedGames, setUnreviewedGames] = useState<UnreviewedGame[]>([]);
  const [batchEvaluating, setBatchEvaluating] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    loadStats();
    loadGameStats();
  }, [dateRange]);

  // Load game evaluation statistics
  const loadGameStats = async () => {
    try {
      // Get all approved games
      const { data: allGames, count: totalCount } = await supabase
        .from("uploaded_games")
        .select("id, title, created_at, status", { count: "exact" })
        .is("deleted_at", null);

      // Get all AI reviews
      const { data: reviews } = await supabase
        .from("game_ai_reviews")
        .select("game_id, auto_rejected");

      const reviewedGameIds = new Set(reviews?.map(r => r.game_id) || []);
      const autoRejectedCount = reviews?.filter(r => r.auto_rejected).length || 0;

      // Find unreviewed games (approved but no AI review)
      const unreviewed = allGames?.filter(g => 
        g.status === 'approved' && !reviewedGameIds.has(g.id)
      ) || [];

      setGameStats({
        totalGames: totalCount || 0,
        reviewedGames: reviews?.length || 0,
        missingReviews: unreviewed.length,
        autoRejected: autoRejectedCount,
      });

      setUnreviewedGames(unreviewed.slice(0, 10).map(g => ({
        id: g.id,
        title: g.title,
        created_at: g.created_at,
        status: g.status,
      })));
    } catch (error) {
      console.error("Load game stats error:", error);
    }
  };

  // Convert relative path to absolute URL for Edge Function
  const getAbsoluteThumbnailUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Batch evaluate all missing games
  const evaluateAllMissing = async () => {
    if (unreviewedGames.length === 0) {
      toast.info("Tất cả game approved đã có AI review!");
      return;
    }

    // Fetch full game data for unreviewed games
    const { data: fullGames } = await supabase
      .from("uploaded_games")
      .select("id, title, description, thumbnail_path")
      .in("id", unreviewedGames.map(g => g.id));

    if (!fullGames || fullGames.length === 0) {
      toast.error("Không tìm thấy game để đánh giá");
      return;
    }

    setBatchEvaluating(true);
    setBatchProgress({ current: 0, total: fullGames.length });
    let successCount = 0;
    let failCount = 0;
    let currentDelay = 800;

    toast.info(`🔮 Bắt đầu đánh giá ${fullGames.length} game...`);

    for (let i = 0; i < fullGames.length; i++) {
      const game = fullGames[i];
      setBatchProgress({ current: i + 1, total: fullGames.length });

      try {
        const absoluteThumbnailUrl = getAbsoluteThumbnailUrl(game.thumbnail_path);
        console.log(`[Angel AI Batch ${i + 1}/${fullGames.length}] Evaluating "${game.title}"`);

        const { error } = await supabase.functions.invoke('angel-evaluate-game', {
          body: {
            game_id: game.id,
            title: game.title,
            description: game.description,
            categories: [],
            thumbnail_url: absoluteThumbnailUrl
          }
        });

        if (error) {
          failCount++;
          if (error.message?.includes('429')) {
            currentDelay = Math.min(currentDelay * 2, 5000);
            toast.warning("⏳ Rate limited, slowing down...");
          } else if (error.message?.includes('402')) {
            toast.error("💳 Hết credits! Vui lòng nạp thêm.");
            break;
          }
        } else {
          successCount++;
          currentDelay = Math.max(currentDelay * 0.9, 800);
        }

        await new Promise(r => setTimeout(r, currentDelay));
      } catch (err: any) {
        failCount++;
        if (err.status === 429) {
          currentDelay = Math.min(currentDelay * 2, 5000);
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }

    setBatchEvaluating(false);
    setBatchProgress(null);
    loadGameStats();

    toast.success(
      <div className="flex flex-col gap-1">
        <span className="font-bold">🔮 Đánh giá batch hoàn tất!</span>
        <span className="text-sm">Thành công: {successCount} | Lỗi: {failCount}</span>
      </div>
    );
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const days = parseInt(dateRange);
      const fromDate = subDays(new Date(), days);

      // Get all chat history
      const { data: allMessages } = await supabase
        .from("angel_ai_chat_history")
        .select("id, user_id, role, content, created_at")
        .gte("created_at", fromDate.toISOString())
        .order("created_at", { ascending: false });

      if (allMessages) {
        // Calculate stats
        const uniqueUserIds = [...new Set(allMessages.map((m) => m.user_id))];
        const userMessages = allMessages.filter((m) => m.role === "user");
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayMessages = allMessages.filter(
          (m) => new Date(m.created_at) >= todayStart
        ).length;

        setStats({
          totalConversations: uniqueUserIds.length,
          totalMessages: allMessages.length,
          uniqueUsers: uniqueUserIds.length,
          avgMessagesPerUser:
            uniqueUserIds.length > 0
              ? Math.round(userMessages.length / uniqueUserIds.length)
              : 0,
          todayMessages,
        });

        // Daily activity chart
        const dailyMap = new Map<string, { messages: number; users: Set<string> }>();
        allMessages.forEach((msg) => {
          const date = format(new Date(msg.created_at), "dd/MM");
          const existing = dailyMap.get(date) || { messages: 0, users: new Set() };
          existing.messages++;
          existing.users.add(msg.user_id);
          dailyMap.set(date, existing);
        });

        setDailyActivity(
          Array.from(dailyMap.entries())
            .map(([date, data]) => ({
              date,
              messages: data.messages,
              users: data.users.size,
            }))
            .reverse()
        );

        // Top users
        const userMessageCounts = new Map<string, { count: number; lastActive: string }>();
        userMessages.forEach((msg) => {
          const existing = userMessageCounts.get(msg.user_id) || {
            count: 0,
            lastActive: msg.created_at,
          };
          existing.count++;
          if (new Date(msg.created_at) > new Date(existing.lastActive)) {
            existing.lastActive = msg.created_at;
          }
          userMessageCounts.set(msg.user_id, existing);
        });

        // Get usernames
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", Array.from(userMessageCounts.keys()));

        const topUsersData = Array.from(userMessageCounts.entries())
          .map(([userId, data]) => ({
            username:
              profiles?.find((p) => p.id === userId)?.username || "Unknown",
            messageCount: data.count,
            lastActive: data.lastActive,
          }))
          .sort((a, b) => b.messageCount - a.messageCount)
          .slice(0, 10);

        setTopUsers(topUsersData);

        // Recent messages (last 20)
        const recentUserMsgs = userMessages.slice(0, 20);
        const recentWithProfiles = recentUserMsgs.map((msg) => ({
          ...msg,
          username:
            profiles?.find((p) => p.id === msg.user_id)?.username || "Unknown",
        }));
        setRecentMessages(recentWithProfiles);
      }
    } catch (error) {
      console.error("Load Angel AI stats error:", error);
      toast.error("Failed to load Angel AI stats");
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Angel AI Management
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
          <Button variant="outline" size="icon" onClick={loadStats}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-xl font-bold">{stats.totalMessages.toLocaleString()}</p>
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
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg/User</p>
                <p className="text-xl font-bold">{stats.avgMessagesPerUser}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-xl font-bold">{stats.todayMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-xl font-bold">{stats.totalConversations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Evaluation Health Panel */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gamepad2 className="h-5 w-5 text-primary" />
            Game AI Evaluation Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Total Games</p>
                <p className="text-lg font-bold">{gameStats.totalGames}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Reviewed</p>
                <p className="text-lg font-bold text-green-600">{gameStats.reviewedGames}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Missing Review</p>
                <p className="text-lg font-bold text-amber-600">{gameStats.missingReviews}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Auto-Rejected</p>
                <p className="text-lg font-bold text-red-600">{gameStats.autoRejected}</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {gameStats.totalGames > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Review Coverage</span>
                <span className="font-medium">
                  {Math.round((gameStats.reviewedGames / gameStats.totalGames) * 100)}%
                </span>
              </div>
              <Progress 
                value={(gameStats.reviewedGames / gameStats.totalGames) * 100} 
                className="h-2"
              />
            </div>
          )}

          {/* Batch Evaluate Button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={evaluateAllMissing}
              disabled={batchEvaluating || gameStats.missingReviews === 0}
              className="gap-2"
            >
              {batchEvaluating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang đánh giá {batchProgress?.current}/{batchProgress?.total}...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Đánh giá {gameStats.missingReviews} game còn thiếu
                </>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={loadGameStats} disabled={batchEvaluating}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Batch Progress */}
          {batchProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Batch Progress</span>
                <span className="font-medium">
                  {batchProgress.current}/{batchProgress.total}
                </span>
              </div>
              <Progress 
                value={(batchProgress.current / batchProgress.total) * 100} 
                className="h-2"
              />
            </div>
          )}

          {/* Unreviewed Games List */}
          {unreviewedGames.length > 0 && !batchEvaluating && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Games chưa có AI review (top 10):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {unreviewedGames.map(game => (
                  <div 
                    key={game.id} 
                    className="flex items-center justify-between p-2 rounded bg-background/50 text-sm"
                  >
                    <span className="truncate flex-1">{game.title}</span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {format(new Date(game.created_at), "dd/MM")}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyActivity}>
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
                    dataKey="messages"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Messages"
                    dot={{ fill: "#8b5cf6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Active Users"
                    dot={{ fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top 10 Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topUsers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="username"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="messageCount"
                    fill="#8b5cf6"
                    name="Messages"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Messages from Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentMessages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No messages yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMessages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="font-medium">{msg.username}</TableCell>
                      <TableCell className="max-w-[400px]">
                        <p className="truncate text-sm">{msg.content}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(msg.created_at), "dd/MM HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
