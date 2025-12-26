import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  useEffect(() => {
    loadStats();
  }, [dateRange]);

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
