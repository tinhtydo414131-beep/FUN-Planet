import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Shield,
  Search,
  Download,
  ExternalLink,
  Users,
  Coins,
  TrendingUp,
  Clock,
  Loader2,
  ChevronUp,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

interface UserRewardData {
  user_id: string;
  wallet_address: string | null;
  pending_amount: number;
  claimed_amount: number;
  total_earned: number;
  daily_claimed: number;
  last_claim_date: string | null;
  last_claim_amount: number | null;
  last_claim_at: string | null;
  profile: {
    username: string;
    avatar_url: string | null;
    email: string;
  } | null;
}

// Admin wallet addresses (add your admin wallets here)
const ADMIN_WALLETS = [
  '0x0910320181889fefde0bb1ca63962b0a8882e413', // Example admin wallet
  // Add more admin wallets as needed
];

type SortField = 'claimed_amount' | 'pending_amount' | 'last_claim_at' | 'total_earned';
type SortDirection = 'asc' | 'desc';

export default function AdminRewardsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userRewards, setUserRewards] = useState<UserRewardData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('claimed_amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClaimed: 0,
    totalPending: 0,
    claimsToday: 0
  });

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) return;

      // Check if user has admin role in database
      const { data: hasAdminRole } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      // Also check profile wallet address against admin wallets
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single();

      const isWalletAdmin = profile?.wallet_address && 
        ADMIN_WALLETS.some(addr => addr.toLowerCase() === profile.wallet_address?.toLowerCase());

      setIsAdmin(hasAdminRole || isWalletAdmin);
    };

    checkAdmin();
  }, [user]);

  // Load user rewards data
  const loadData = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    try {
      // Fetch user rewards with profiles
      const { data: rewards, error } = await supabase
        .from('user_rewards')
        .select(`
          user_id,
          wallet_address,
          pending_amount,
          claimed_amount,
          total_earned,
          daily_claimed,
          last_claim_date,
          last_claim_amount,
          last_claim_at
        `);

      if (error) throw error;

      // Fetch profiles for each user
      const userIds = rewards?.map(r => r.user_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, email')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const combinedData: UserRewardData[] = (rewards || []).map(reward => ({
        ...reward,
        profile: profileMap.get(reward.user_id) || null
      }));

      setUserRewards(combinedData);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayClaims = combinedData.filter(r => r.last_claim_date === today);
      
      setStats({
        totalUsers: combinedData.length,
        totalClaimed: combinedData.reduce((sum, r) => sum + (r.claimed_amount || 0), 0),
        totalPending: combinedData.reduce((sum, r) => sum + (r.pending_amount || 0), 0),
        claimsToday: todayClaims.length
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Không thể tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = userRewards;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.wallet_address?.toLowerCase().includes(query) ||
        r.profile?.username?.toLowerCase().includes(query) ||
        r.profile?.email?.toLowerCase().includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'last_claim_at') {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return filtered;
  }, [userRewards, searchQuery, sortField, sortDirection]);

  // Export CSV
  const exportCSV = () => {
    const headers = [
      'Username',
      'Email',
      'Wallet Address',
      'Pending Amount',
      'Claimed Amount',
      'Total Earned',
      'Last Claim Date',
      'Last Claim Amount'
    ];

    const rows = filteredAndSortedData.map(r => [
      r.profile?.username || 'N/A',
      r.profile?.email || 'N/A',
      r.wallet_address || 'N/A',
      r.pending_amount,
      r.claimed_amount,
      r.total_earned,
      r.last_claim_at ? format(new Date(r.last_claim_at), 'dd/MM/yyyy HH:mm') : 'N/A',
      r.last_claim_amount || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rewards_export_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();

    toast.success('Đã xuất file CSV!');
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  // Redirect if not logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto max-w-4xl pt-24 px-4">
          <Card className="border-destructive">
            <CardContent className="pt-6 text-center">
              <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-destructive mb-2">Truy cập bị từ chối</h1>
              <p className="text-muted-foreground">Bạn không có quyền truy cập trang này.</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Quay về trang chủ
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Admin Rewards Dashboard</h1>
            </div>
            <p className="text-muted-foreground">Quản lý và theo dõi phần thưởng người dùng</p>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng người dùng</p>
                    <p className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Coins className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng đã claim</p>
                    <p className="text-2xl font-bold">{stats.totalClaimed.toLocaleString()} $C</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Tổng pending</p>
                    <p className="text-2xl font-bold">{stats.totalPending.toLocaleString()} $C</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Claims hôm nay</p>
                    <p className="text-2xl font-bold">{stats.claimsToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm theo wallet, username, email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sắp xếp theo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="claimed_amount">Đã claim</SelectItem>
                      <SelectItem value="pending_amount">Pending</SelectItem>
                      <SelectItem value="total_earned">Tổng nhận</SelectItem>
                      <SelectItem value="last_claim_at">Thời gian claim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={loadData} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                  </Button>
                  <Button onClick={exportCSV}>
                    <Download className="w-4 h-4 mr-2" />
                    Xuất CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Table */}
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Wallet</TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSort('pending_amount')}
                        >
                          Pending <SortIcon field="pending_amount" />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSort('claimed_amount')}
                        >
                          Đã Claim <SortIcon field="claimed_amount" />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSort('total_earned')}
                        >
                          Tổng <SortIcon field="total_earned" />
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleSort('last_claim_at')}
                        >
                          Claim cuối <SortIcon field="last_claim_at" />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedData.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Không có dữ liệu
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedData.map((reward) => (
                          <TableRow key={reward.user_id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={reward.profile?.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {reward.profile?.username?.[0]?.toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{reward.profile?.username || 'Unknown'}</p>
                                  <p className="text-xs text-muted-foreground">{reward.profile?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {reward.wallet_address ? (
                                <a
                                  href={`https://bscscan.com/address/${reward.wallet_address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline font-mono text-sm"
                                >
                                  {reward.wallet_address.slice(0, 6)}...{reward.wallet_address.slice(-4)}
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-600">
                                {reward.pending_amount.toLocaleString()} $C
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                                {reward.claimed_amount.toLocaleString()} $C
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">
                                {reward.total_earned.toLocaleString()} $C
                              </span>
                            </TableCell>
                            <TableCell>
                              {reward.last_claim_at ? (
                                <div className="text-sm">
                                  <p>{format(new Date(reward.last_claim_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {reward.last_claim_amount?.toLocaleString()} $C
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Hiển thị {filteredAndSortedData.length} / {userRewards.length} người dùng
          </p>
        </div>
      </section>
    </div>
  );
}
