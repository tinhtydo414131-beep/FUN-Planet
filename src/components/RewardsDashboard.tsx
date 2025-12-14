import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Diamond, TrendingUp, Heart, Calendar, Gamepad2, Users, Gift, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface RewardStats {
  totalEarned: number;
  charityTotal: number;
  byType: {
    name: string;
    value: number;
    color: string;
  }[];
  history: {
    date: string;
    amount: number;
  }[];
}

const TYPE_CONFIG: Record<string, { name: string; color: string; icon: typeof Gift }> = {
  daily_checkin: { name: 'Điểm danh', color: '#8B5CF6', icon: Calendar },
  first_game_play: { name: 'Chơi game', color: '#06B6D4', icon: Gamepad2 },
  game_play: { name: 'Chơi game', color: '#06B6D4', icon: Gamepad2 },
  referral_bonus: { name: 'Mời bạn', color: '#10B981', icon: Users },
  upload_reward: { name: 'Upload', color: '#F59E0B', icon: Upload },
  upload_game_approved: { name: 'Upload', color: '#F59E0B', icon: Upload },
  game_upload: { name: 'Upload', color: '#F59E0B', icon: Upload },
  first_wallet_connect: { name: 'Kết nối ví', color: '#EC4899', icon: Gift },
  airdrop_claim: { name: 'Airdrop', color: '#FFD700', icon: Gift },
};

const CHARITY_PERCENTAGE = 0.11;

export const RewardsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RewardStats>({
    totalEarned: 0,
    charityTotal: 0,
    byType: [],
    history: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('rewards-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'web3_reward_transactions',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('web3_reward_transactions')
        .select('amount, reward_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        // Calculate totals by type
        const typeTotals: Record<string, number> = {};
        let total = 0;

        data.forEach(tx => {
          const amount = Math.abs(tx.amount);
          total += amount;
          
          const type = tx.reward_type || 'other';
          typeTotals[type] = (typeTotals[type] || 0) + amount;
        });

        // Calculate charity (11% of total)
        const charityTotal = Math.floor(total * CHARITY_PERCENTAGE);

        // Build chart data
        const byType = Object.entries(typeTotals)
          .filter(([_, value]) => value > 0)
          .map(([type, value]) => ({
            name: TYPE_CONFIG[type]?.name || type,
            value,
            color: TYPE_CONFIG[type]?.color || '#6B7280'
          }))
          .sort((a, b) => b.value - a.value);

        // Build history data (last 7 days)
        const last7Days: Record<string, number> = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const key = format(date, 'yyyy-MM-dd');
          last7Days[key] = 0;
        }

        data.forEach(tx => {
          const dateKey = tx.created_at.split('T')[0];
          if (last7Days.hasOwnProperty(dateKey)) {
            last7Days[dateKey] += Math.abs(tx.amount);
          }
        });

        const history = Object.entries(last7Days).map(([date, amount]) => ({
          date: format(new Date(date), 'dd/MM', { locale: vi }),
          amount
        }));

        setStats({
          totalEarned: total,
          charityTotal,
          byType,
          history
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <CardContent className="p-4 text-center">
              <Diamond className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-xs text-muted-foreground">Tổng đã kiếm</p>
              <p className="text-xl font-bold text-yellow-500">
                {stats.totalEarned.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-pink-500/10 to-red-500/10 border-pink-500/30">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-pink-500" />
              <p className="text-xs text-muted-foreground">Từ thiện 11%</p>
              <p className="text-xl font-bold text-pink-500">
                {stats.charityTotal.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Pie Chart - Sources */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Nguồn thu nhập
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byType.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.byType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toLocaleString()} CAMLY`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value) => <span className="text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                Chưa có dữ liệu
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Line Chart - History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Thu nhập 7 ngày
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={stats.history}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => value >= 1000 ? `${value/1000}K` : value}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} CAMLY`, 'Thu nhập']}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RewardsDashboard;
