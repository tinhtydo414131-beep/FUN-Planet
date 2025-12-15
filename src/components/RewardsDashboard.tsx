import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Diamond, TrendingUp, Heart, Calendar, Gamepad2, Users, Gift, Upload, Wallet, Zap, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Bell, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface RewardTransaction {
  id: string;
  amount: number;
  reward_type: string;
  description: string | null;
  created_at: string;
  transaction_hash?: string;
  claimed_to_wallet?: boolean;
}

interface RewardStats {
  totalEarned: number;
  charityTotal: number;
  todayEarned: number;
  weeklyEarned: number;
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

const TYPE_CONFIG: Record<string, { name: string; nameEn: string; color: string; icon: typeof Gift }> = {
  daily_checkin: { name: 'Điểm danh', nameEn: 'Check-in', color: '#8B5CF6', icon: Calendar },
  first_game_play: { name: 'Chơi game', nameEn: 'Game Play', color: '#06B6D4', icon: Gamepad2 },
  game_play: { name: 'Chơi game', nameEn: 'Game Play', color: '#06B6D4', icon: Gamepad2 },
  referral_bonus: { name: 'Mời bạn', nameEn: 'Referral', color: '#10B981', icon: Users },
  upload_reward: { name: 'Upload', nameEn: 'Upload', color: '#F59E0B', icon: Upload },
  upload_game_approved: { name: 'Upload', nameEn: 'Upload', color: '#F59E0B', icon: Upload },
  game_upload: { name: 'Upload', nameEn: 'Upload', color: '#F59E0B', icon: Upload },
  first_wallet_connect: { name: 'Kết nối ví', nameEn: 'Wallet', color: '#EC4899', icon: Wallet },
  airdrop_claim: { name: 'Airdrop', nameEn: 'Airdrop', color: '#FFD700', icon: Gift },
  wallet_withdrawal: { name: 'Rút tiền', nameEn: 'Withdraw', color: '#EF4444', icon: ArrowUpRight },
  charity_donation: { name: 'Từ thiện', nameEn: 'Charity', color: '#F472B6', icon: Heart },
};

const CHARITY_PERCENTAGE = 0.11;

export const RewardsDashboard = () => {
  const { t, i18n } = useTranslation();
  const isVN = i18n.language === 'vi';
  const { user } = useAuth();
  const [stats, setStats] = useState<RewardStats>({
    totalEarned: 0,
    charityTotal: 0,
    todayEarned: 0,
    weeklyEarned: 0,
    byType: [],
    history: []
  });
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTxId, setNewTxId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('web3_reward_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        setTransactions(data);

        // Calculate totals
        const typeTotals: Record<string, number> = {};
        let total = 0;
        let todayTotal = 0;
        let weeklyTotal = 0;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);

        data.forEach(tx => {
          const amount = Math.abs(tx.amount);
          const txDate = new Date(tx.created_at);
          
          // Skip negative amounts (withdrawals)
          if (tx.amount > 0) {
            total += amount;
            
            if (txDate >= today) {
              todayTotal += amount;
            }
            if (txDate >= weekStart) {
              weeklyTotal += amount;
            }
          }
          
          const type = tx.reward_type || 'other';
          if (tx.amount > 0) {
            typeTotals[type] = (typeTotals[type] || 0) + amount;
          }
        });

        const charityTotal = Math.floor(total * CHARITY_PERCENTAGE);

        const byType = Object.entries(typeTotals)
          .filter(([_, value]) => value > 0)
          .map(([type, value]) => ({
            name: isVN ? (TYPE_CONFIG[type]?.name || type) : (TYPE_CONFIG[type]?.nameEn || type),
            value,
            color: TYPE_CONFIG[type]?.color || '#6B7280'
          }))
          .sort((a, b) => b.value - a.value);

        // Build history data (last 7 days)
        const last7Days: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const key = format(date, 'yyyy-MM-dd');
          last7Days[key] = 0;
        }

        data.forEach(tx => {
          if (tx.amount > 0) {
            const dateKey = tx.created_at.split('T')[0];
            if (last7Days.hasOwnProperty(dateKey)) {
              last7Days[dateKey] += Math.abs(tx.amount);
            }
          }
        });

        const history = Object.entries(last7Days).map(([date, amount]) => ({
          date: format(new Date(date), 'dd/MM', { locale: vi }),
          amount
        }));

        setStats({
          totalEarned: total,
          charityTotal,
          todayEarned: todayTotal,
          weeklyEarned: weeklyTotal,
          byType,
          history
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isVN]);

  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('rewards-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'web3_reward_transactions',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newTx = payload.new as RewardTransaction;
            setNewTxId(newTx.id);
            setTransactions(prev => [newTx, ...prev]);
            fetchStats();
            
            // Clear highlight after 3s
            setTimeout(() => setNewTxId(null), 3000);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchStats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
  };

  const getTypeIcon = (type: string) => {
    const Icon = TYPE_CONFIG[type]?.icon || Gift;
    return <Icon className="w-4 h-4" />;
  };

  const getTypeName = (type: string) => {
    return isVN ? (TYPE_CONFIG[type]?.name || type) : (TYPE_CONFIG[type]?.nameEn || type);
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
      {/* Summary Cards - 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <CardContent className="p-3 text-center">
              <Diamond className="w-6 h-6 mx-auto mb-1 text-yellow-500" />
              <p className="text-[10px] text-muted-foreground">{isVN ? 'Tổng đã kiếm' : 'Total Earned'}</p>
              <p className="text-lg font-bold text-yellow-500">
                {stats.totalEarned.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30">
            <CardContent className="p-3 text-center">
              <Zap className="w-6 h-6 mx-auto mb-1 text-green-500" />
              <p className="text-[10px] text-muted-foreground">{isVN ? 'Hôm nay' : 'Today'}</p>
              <p className="text-lg font-bold text-green-500">
                +{stats.todayEarned.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/30">
            <CardContent className="p-3 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-1 text-cyan-500" />
              <p className="text-[10px] text-muted-foreground">{isVN ? '7 ngày' : '7 Days'}</p>
              <p className="text-lg font-bold text-cyan-500">
                {stats.weeklyEarned.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-gradient-to-br from-pink-500/10 to-red-500/10 border-pink-500/30">
            <CardContent className="p-3 text-center">
              <Heart className="w-6 h-6 mx-auto mb-1 text-pink-500" />
              <p className="text-[10px] text-muted-foreground">{isVN ? 'Từ thiện 11%' : 'Charity 11%'}</p>
              <p className="text-lg font-bold text-pink-500">
                {stats.charityTotal.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie Chart - Sources */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {isVN ? 'Nguồn thu nhập' : 'Income Sources'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.byType.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stats.byType}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
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
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px' }}
                      formatter={(value) => <span className="text-foreground text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-muted-foreground text-sm">
                  {isVN ? 'Chưa có dữ liệu' : 'No data yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Area Chart - History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {isVN ? 'Thu nhập 7 ngày' : '7-Day Earnings'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={stats.history}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
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
                    formatter={(value: number) => [`${value.toLocaleString()} CAMLY`, isVN ? 'Thu nhập' : 'Earned']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Realtime Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {isVN ? 'Lịch sử giao dịch' : 'Transaction History'}
                <Badge variant="outline" className="ml-2 text-[10px]">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                  LIVE
                </Badge>
              </CardTitle>
              <button
                onClick={handleRefresh}
                className="p-1.5 rounded-full hover:bg-muted transition-colors"
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[300px]">
              <div className="p-4 space-y-2">
                <AnimatePresence>
                  {transactions.slice(0, 20).map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={tx.id === newTxId ? { opacity: 0, x: -20, scale: 0.95 } : false}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all",
                        tx.id === newTxId 
                          ? "bg-primary/10 border-primary/50 ring-2 ring-primary/20" 
                          : "bg-muted/30 border-transparent hover:bg-muted/50"
                      )}
                    >
                      {/* Icon */}
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ 
                          backgroundColor: `${TYPE_CONFIG[tx.reward_type]?.color || '#6B7280'}20`,
                          color: TYPE_CONFIG[tx.reward_type]?.color || '#6B7280'
                        }}
                      >
                        {getTypeIcon(tx.reward_type)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {getTypeName(tx.reward_type)}
                          </span>
                          {tx.id === newTxId && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full"
                            >
                              NEW
                            </motion.span>
                          )}
                          {tx.claimed_to_wallet && (
                            <Wallet className="w-3 h-3 text-green-500" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {tx.description || formatDistanceToNow(new Date(tx.created_at), { 
                            addSuffix: true, 
                            locale: isVN ? vi : undefined 
                          })}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className={cn(
                          "font-bold text-sm flex items-center gap-1",
                          tx.amount >= 0 ? "text-green-500" : "text-red-500"
                        )}>
                          {tx.amount >= 0 ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(tx.created_at), 'HH:mm')}
                        </p>
                      </div>

                      {/* New transaction sparkle */}
                      {tx.id === newTxId && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: 2 }}
                          className="absolute -right-1 -top-1"
                        >
                          <Sparkles className="w-4 h-4 text-yellow-500" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {transactions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{isVN ? 'Chưa có giao dịch' : 'No transactions yet'}</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default RewardsDashboard;
