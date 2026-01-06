import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { 
  Mail, 
  Eye, 
  MousePointerClick, 
  TrendingUp, 
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, subDays } from "date-fns";
import { vi } from "date-fns/locale";

interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
}

interface EmailByType {
  email_type: string;
  count: number;
  opened: number;
  clicked: number;
}

interface DailyStats {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#8b5cf6"];

const EMAIL_TYPE_LABELS: Record<string, string> = {
  weekly_summary: "Tổng kết tuần",
  achievement: "Achievement",
  daily_reminder: "Nhắc nhở hàng ngày",
  announcement: "Thông báo game mới",
};

export const AdminEmailAnalytics = () => {
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    openRate: 0,
    clickRate: 0,
  });
  const [byType, setByType] = useState<EmailByType[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState("7");
  const [chartType, setChartType] = useState<"bar" | "pie">("bar");

  const loadStats = async () => {
    try {
      const days = parseInt(dateRange);
      const startDate = subDays(new Date(), days).toISOString();

      // Get all email analytics
      const { data: emails, error } = await supabase
        .from("email_analytics")
        .select("*")
        .gte("sent_at", startDate)
        .order("sent_at", { ascending: false });

      if (error) throw error;

      const emailList = emails || [];

      // Calculate overall stats
      const totalSent = emailList.length;
      const totalOpened = emailList.filter(e => e.opened_at).length;
      const totalClicked = emailList.filter(e => e.clicked_at).length;

      setStats({
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        clickRate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0,
      });

      // Group by type
      const typeMap = new Map<string, EmailByType>();
      emailList.forEach(email => {
        const type = email.email_type;
        const existing = typeMap.get(type) || { email_type: type, count: 0, opened: 0, clicked: 0 };
        existing.count++;
        if (email.opened_at) existing.opened++;
        if (email.clicked_at) existing.clicked++;
        typeMap.set(type, existing);
      });
      setByType(Array.from(typeMap.values()));

      // Group by day
      const dayMap = new Map<string, DailyStats>();
      for (let i = 0; i < days; i++) {
        const date = format(subDays(new Date(), i), "yyyy-MM-dd");
        dayMap.set(date, { date, sent: 0, opened: 0, clicked: 0 });
      }

      emailList.forEach(email => {
        const date = format(new Date(email.sent_at), "yyyy-MM-dd");
        const existing = dayMap.get(date);
        if (existing) {
          existing.sent++;
          if (email.opened_at) existing.opened++;
          if (email.clicked_at) existing.clicked++;
        }
      });

      setDailyStats(
        Array.from(dayMap.values())
          .sort((a, b) => a.date.localeCompare(b.date))
          .map(d => ({
            ...d,
            date: format(new Date(d.date), "dd/MM", { locale: vi }),
          }))
      );

    } catch (error) {
      console.error("Error loading email stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [dateRange]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Email Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Theo dõi hiệu quả các chiến dịch email
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 ngày qua</SelectItem>
              <SelectItem value="14">14 ngày qua</SelectItem>
              <SelectItem value="30">30 ngày qua</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Đã gửi</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalSent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Đã mở</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalOpened}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Đã click</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.totalClicked}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Open Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.openRate}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Click Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.clickRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Stats Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thống kê theo ngày</CardTitle>
            <CardDescription>Số lượng email gửi, mở, click theo ngày</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
                <Bar dataKey="sent" name="Đã gửi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opened" name="Đã mở" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicked" name="Đã click" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Type Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Theo loại email</CardTitle>
              <CardDescription>Phân bố email theo từng loại</CardDescription>
            </div>
            <div className="flex gap-1">
              <Button
                variant={chartType === "bar" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("bar")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={chartType === "pie" ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType("pie")}
              >
                <PieChartIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {chartType === "bar" ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={byType.map(t => ({
                    ...t,
                    name: EMAIL_TYPE_LABELS[t.email_type] || t.email_type,
                  }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    width={120}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Bar dataKey="count" name="Đã gửi" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byType.map((t, i) => ({
                      name: EMAIL_TYPE_LABELS[t.email_type] || t.email_type,
                      value: t.count,
                      fill: COLORS[i % COLORS.length],
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {byType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Type Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết theo loại email</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Loại email</th>
                  <th className="text-right py-2 px-4">Đã gửi</th>
                  <th className="text-right py-2 px-4">Đã mở</th>
                  <th className="text-right py-2 px-4">Đã click</th>
                  <th className="text-right py-2 px-4">Open Rate</th>
                  <th className="text-right py-2 px-4">Click Rate</th>
                </tr>
              </thead>
              <tbody>
                {byType.map((type, index) => {
                  const openRate = type.count > 0 ? Math.round((type.opened / type.count) * 100) : 0;
                  const clickRate = type.opened > 0 ? Math.round((type.clicked / type.opened) * 100) : 0;
                  
                  return (
                    <tr key={type.email_type} className="border-b last:border-0">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{EMAIL_TYPE_LABELS[type.email_type] || type.email_type}</span>
                        </div>
                      </td>
                      <td className="text-right py-2 px-4">{type.count}</td>
                      <td className="text-right py-2 px-4">{type.opened}</td>
                      <td className="text-right py-2 px-4">{type.clicked}</td>
                      <td className="text-right py-2 px-4">
                        <Badge variant={openRate >= 50 ? "default" : openRate >= 25 ? "secondary" : "outline"}>
                          {openRate}%
                        </Badge>
                      </td>
                      <td className="text-right py-2 px-4">
                        <Badge variant={clickRate >= 20 ? "default" : clickRate >= 10 ? "secondary" : "outline"}>
                          {clickRate}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {byType.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Chưa có dữ liệu email
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminEmailAnalytics;
