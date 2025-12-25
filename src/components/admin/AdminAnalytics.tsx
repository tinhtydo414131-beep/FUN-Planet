import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Users, Gamepad2, Coins, Calendar, TrendingUp } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DailyStats {
  date: string;
  logins: number;
  uploads: number;
  claims: number;
}

interface CategoryStats {
  name: string;
  value: number;
}

export function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    totalClaims: 0,
    avgDailyLogins: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Get daily login stats for last 14 days
      const days = 14;
      const statsPromises = [];
      
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        statsPromises.push(
          Promise.all([
            // Daily logins
            supabase
              .from('daily_login_rewards')
              .select('*', { count: 'exact', head: true })
              .eq('claim_date', dateStr),
            // Uploads
            supabase
              .from('uploaded_games')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', startOfDay(date).toISOString())
              .lte('created_at', endOfDay(date).toISOString()),
            // Claims
            supabase
              .from('camly_claims')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', startOfDay(date).toISOString())
              .lte('created_at', endOfDay(date).toISOString())
          ]).then(([logins, uploads, claims]) => ({
            date: format(date, 'dd/MM'),
            logins: logins.count || 0,
            uploads: uploads.count || 0,
            claims: claims.count || 0
          }))
        );
      }

      const dailyData = await Promise.all(statsPromises);
      setDailyStats(dailyData.reverse());

      // Calculate averages
      const avgLogins = dailyData.reduce((sum, d) => sum + d.logins, 0) / days;

      // Get game category stats
      const { data: gamesData } = await supabase
        .from('uploaded_games')
        .select('category')
        .eq('status', 'approved');

      if (gamesData) {
        const categoryCounts: Record<string, number> = {};
        gamesData.forEach(game => {
          const cat = game.category || 'other';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        setCategoryStats(
          Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))
        );
      }

      // Get totals
      const [usersCount, gamesCount, claimsCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('uploaded_games').select('*', { count: 'exact', head: true }),
        supabase.from('camly_claims').select('*', { count: 'exact', head: true })
      ]);

      setTotalStats({
        totalUsers: usersCount.count || 0,
        totalGames: gamesCount.count || 0,
        totalClaims: claimsCount.count || 0,
        avgDailyLogins: Math.round(avgLogins)
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#f59e0b', '#8b5cf6', '#10b981', '#3b82f6', '#ef4444', '#ec4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-amber-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{totalStats.totalUsers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Games</p>
                <p className="text-2xl font-bold">{totalStats.totalGames.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Coins className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold">{totalStats.totalClaims.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Daily Logins</p>
                <p className="text-2xl font-bold">{totalStats.avgDailyLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Chart */}
        <Card className="border-amber-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Daily Activity (Last 14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255,255,255,0.95)', 
                      border: '1px solid #f59e0b',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="logins" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    name="Daily Logins"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uploads" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Uploads"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="claims" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Claims"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Game Categories Pie Chart */}
        <Card className="border-amber-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-amber-500" />
              Games by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Bar Chart */}
      <Card className="border-amber-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Daily Comparison
          </CardTitle>
          <CardDescription>Compare activity metrics across days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    border: '1px solid #f59e0b',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="logins" fill="#f59e0b" name="Logins" radius={[4, 4, 0, 0]} />
                <Bar dataKey="uploads" fill="#8b5cf6" name="Uploads" radius={[4, 4, 0, 0]} />
                <Bar dataKey="claims" fill="#10b981" name="Claims" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
