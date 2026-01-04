import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
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
  LineChart,
  Line
} from "recharts";
import { format, subDays } from "date-fns";

interface Stats {
  totalUsers: number;
  totalPending: number;
  totalClaimed: number;
  totalEarned: number;
  blockedUsers: number;
  suspiciousCount: number;
  todayClaims: number;
  newUsersToday: number;
}

interface AdminOverviewTabProps {
  stats: Stats;
  onRefresh: () => void;
}

interface TopUser {
  username: string;
  total_earned: number;
  claimed_amount: number;
}

interface DailyClaimData {
  date: string;
  claims: number;
  amount: number;
}

const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'];

// Wrapper to avoid ref forwarding warning in recharts
const SafeCartesianGrid = (props: React.ComponentProps<typeof CartesianGrid>) => (
  <CartesianGrid {...props} />
);

export function AdminOverviewTab({ stats, onRefresh }: AdminOverviewTabProps) {
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [dailyClaims, setDailyClaims] = useState<DailyClaimData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  const loadChartData = async () => {
    try {
      // Get top 10 users by total earned
      const { data: rewardsData } = await supabase
        .from("user_rewards")
        .select(`
          user_id,
          total_earned,
          claimed_amount
        `)
        .order("total_earned", { ascending: false })
        .limit(10);

      if (rewardsData) {
        // Fetch usernames for top users
        const userIds = rewardsData.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        const topUsersData = rewardsData.map(r => ({
          username: profiles?.find(p => p.id === r.user_id)?.username || "Unknown",
          total_earned: Number(r.total_earned) / 1000, // Convert to K
          claimed_amount: Number(r.claimed_amount) / 1000
        }));
        setTopUsers(topUsersData);
      }

      // Get daily claims for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, "yyyy-MM-dd");
      });

      const { data: claimsData } = await supabase
        .from("daily_claim_logs")
        .select("claim_date, amount_claimed")
        .gte("claim_date", last7Days[0])
        .lte("claim_date", last7Days[6]);

      const dailyClaimsMap = new Map<string, { claims: number; amount: number }>();
      last7Days.forEach(date => {
        dailyClaimsMap.set(date, { claims: 0, amount: 0 });
      });

      claimsData?.forEach(claim => {
        const existing = dailyClaimsMap.get(claim.claim_date);
        if (existing) {
          existing.claims++;
          existing.amount += Number(claim.amount_claimed) || 0;
        }
      });

      const dailyClaimsArray = last7Days.map(date => ({
        date: format(new Date(date), "dd/MM"),
        claims: dailyClaimsMap.get(date)?.claims || 0,
        amount: (dailyClaimsMap.get(date)?.amount || 0) / 1000000 // Convert to M
      }));
      setDailyClaims(dailyClaimsArray);

    } catch (error) {
      console.error("Load chart data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: "Claimed", value: stats.totalClaimed },
    { name: "Pending", value: stats.totalPending }
  ];

  return (
    <div className="space-y-6">
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Claims Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Claims (7 ngày qua)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyClaims}>
                  <SafeCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phân bố CAMLY</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${(value / 1000000).toFixed(2)}M CAMLY`}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Claimed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm text-muted-foreground">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top 10 Users (theo CAMLY earned)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topUsers} layout="vertical">
                <SafeCartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}K`}
                />
                <YAxis 
                  type="category"
                  dataKey="username"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => `${value.toLocaleString()}K CAMLY`}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="total_earned" fill="#3b82f6" name="Total Earned" radius={[0, 4, 4, 0]} />
                <Bar dataKey="claimed_amount" fill="#10b981" name="Claimed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total CAMLY Earned</p>
            <p className="text-xl font-bold text-foreground">
              {(stats.totalEarned / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Avg per User</p>
            <p className="text-xl font-bold text-foreground">
              {stats.totalUsers > 0 
                ? (stats.totalEarned / stats.totalUsers / 1000).toFixed(1) + "K"
                : "0"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Claim Rate</p>
            <p className="text-xl font-bold text-foreground">
              {stats.totalEarned > 0 
                ? ((stats.totalClaimed / stats.totalEarned) * 100).toFixed(1) + "%"
                : "0%"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Block Rate</p>
            <p className="text-xl font-bold text-foreground">
              {stats.totalUsers > 0 
                ? ((stats.blockedUsers / stats.totalUsers) * 100).toFixed(2) + "%"
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
