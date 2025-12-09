import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield, Users, Gamepad2, Flag, CheckCircle, XCircle,
  Eye, Ban, Star, TrendingUp, AlertTriangle, Search,
  Filter, MoreVertical, ChevronRight, Clock, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface UploadedGame {
  id: string;
  title: string;
  description: string;
  status: string;
  user_id: string;
  created_at: string;
  image_url?: string | null;
  play_count?: number;
  is_featured?: boolean;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ReportData {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  comment_id: string;
  reporter_id: string;
  reporter?: {
    username: string;
  };
}

interface UserData {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  wallet_balance: number;
  created_at: string;
  total_plays: number;
  role?: string;
}

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isVN = i18n.language === 'vi';

  const [games, setGames] = useState<UploadedGame[]>([]);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedGame, setSelectedGame] = useState<UploadedGame | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [stats, setStats] = useState({
    totalGames: 0,
    pendingReview: 0,
    totalUsers: 0,
    pendingReports: 0,
    featuredGames: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch uploaded games
      const { data: gamesData, error: gamesError } = await supabase
        .from('uploaded_games')
        .select('*')
        .order('created_at', { ascending: false });

      if (gamesError) throw gamesError;

      // Fetch profiles for games
      if (gamesData && gamesData.length > 0) {
        const userIds = [...new Set(gamesData.map(g => g.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        const gamesWithProfiles = gamesData.map(game => ({
          ...game,
          profile: profiles?.find(p => p.id === game.user_id)
        })) as UploadedGame[];
        setGames(gamesWithProfiles);
      }

      // Fetch reports
      const { data: reportsData } = await supabase
        .from('comment_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (reportsData && reportsData.length > 0) {
        const reporterIds = [...new Set(reportsData.map(r => r.reporter_id))];
        const { data: reporters } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', reporterIds);

        const reportsWithProfiles = reportsData.map(report => ({
          ...report,
          reporter: reporters?.find(r => r.id === report.reporter_id)
        }));
        setReports(reportsWithProfiles);
      }

      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, wallet_balance, created_at, total_plays')
        .order('created_at', { ascending: false })
        .limit(100);

      if (usersData) {
        setUsers(usersData);
      }

      // Calculate stats
      setStats({
        totalGames: gamesData?.length || 0,
        pendingReview: gamesData?.filter(g => g.status === 'pending').length || 0,
        totalUsers: usersData?.length || 0,
        pendingReports: reportsData?.filter(r => r.status === 'pending').length || 0,
        featuredGames: 0
      });

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(isVN ? 'Lỗi tải dữ liệu!' : 'Error loading data!');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('uploaded_games')
        .update({ status: 'approved' })
        .eq('id', gameId);

      if (error) throw error;

      setGames(games.map(g => g.id === gameId ? { ...g, status: 'approved' } : g));
      toast.success(isVN ? 'Game đã được duyệt!' : 'Game approved!');
    } catch (error) {
      console.error('Error approving game:', error);
      toast.error(isVN ? 'Lỗi khi duyệt game!' : 'Error approving game!');
    }
  };

  const handleRejectGame = async (gameId: string) => {
    try {
      const { error } = await supabase
        .from('uploaded_games')
        .update({ status: 'rejected' })
        .eq('id', gameId);

      if (error) throw error;

      setGames(games.map(g => g.id === gameId ? { ...g, status: 'rejected' } : g));
      toast.success(isVN ? 'Game đã bị từ chối!' : 'Game rejected!');
    } catch (error) {
      console.error('Error rejecting game:', error);
      toast.error(isVN ? 'Lỗi khi từ chối game!' : 'Error rejecting game!');
    }
  };

  const handleToggleFeatured = async (gameId: string, isFeatured: boolean) => {
    // Featured functionality - placeholder for future implementation
    toast.info(isVN ? 'Tính năng đang phát triển!' : 'Feature coming soon!');
  };

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const { error } = await supabase
        .from('comment_reports')
        .update({ 
          status, 
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id 
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.map(r => r.id === reportId ? { ...r, status } : r));
      toast.success(isVN ? 'Đã xử lý báo cáo!' : 'Report resolved!');
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.profile?.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || game.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="pt-20 pb-8 bg-gradient-to-br from-primary/10 via-purple-500/5 to-pink-500/10">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-6"
          >
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-500">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {isVN ? 'Admin Dashboard' : 'Admin Dashboard'}
              </h1>
              <p className="text-muted-foreground">
                {isVN ? 'Quản lý nội dung và người dùng' : 'Manage content and users'}
              </p>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: isVN ? 'Tổng Games' : 'Total Games', value: stats.totalGames, icon: Gamepad2, color: 'text-blue-500' },
              { label: isVN ? 'Chờ duyệt' : 'Pending', value: stats.pendingReview, icon: Clock, color: 'text-yellow-500' },
              { label: isVN ? 'Nổi bật' : 'Featured', value: stats.featuredGames, icon: Star, color: 'text-orange-500' },
              { label: isVN ? 'Người dùng' : 'Users', value: stats.totalUsers, icon: Users, color: 'text-green-500' },
              { label: isVN ? 'Báo cáo' : 'Reports', value: stats.pendingReports, icon: Flag, color: 'text-red-500' }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="p-4">
                    <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="games" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="games" className="gap-2">
                <Gamepad2 className="w-4 h-4" />
                {isVN ? 'Games' : 'Games'}
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                {isVN ? 'Người dùng' : 'Users'}
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <Flag className="w-4 h-4" />
                {isVN ? 'Báo cáo' : 'Reports'}
              </TabsTrigger>
            </TabsList>

            {/* Games Tab */}
            <TabsContent value="games">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div>
                      <CardTitle>{isVN ? 'Quản lý Games' : 'Game Management'}</CardTitle>
                      <CardDescription>
                        {isVN ? 'Duyệt và curation games do người dùng tải lên' : 'Review and curate user-uploaded games'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder={isVN ? 'Tìm kiếm...' : 'Search...'}
                          className="pl-9 w-[200px]"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{isVN ? 'Tất cả' : 'All'}</SelectItem>
                          <SelectItem value="pending">{isVN ? 'Chờ duyệt' : 'Pending'}</SelectItem>
                          <SelectItem value="approved">{isVN ? 'Đã duyệt' : 'Approved'}</SelectItem>
                          <SelectItem value="rejected">{isVN ? 'Từ chối' : 'Rejected'}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isVN ? 'Game' : 'Game'}</TableHead>
                          <TableHead>{isVN ? 'Tác giả' : 'Author'}</TableHead>
                          <TableHead>{isVN ? 'Trạng thái' : 'Status'}</TableHead>
                          <TableHead>{isVN ? 'Lượt chơi' : 'Plays'}</TableHead>
                          <TableHead>{isVN ? 'Nổi bật' : 'Featured'}</TableHead>
                          <TableHead>{isVN ? 'Hành động' : 'Actions'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGames.slice(0, 20).map((game) => (
                          <TableRow key={game.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                                  {game.image_url ? (
                                    <img src={game.image_url} alt={game.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Gamepad2 className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{game.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(game.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={game.profile?.avatar_url || ''} />
                                  <AvatarFallback>{game.profile?.username?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{game.profile?.username || 'Unknown'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getStatusColor(game.status)} text-white`}>
                                {game.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{game.play_count || 0}</TableCell>
                            <TableCell>
                              <Switch
                                checked={game.is_featured || false}
                                onCheckedChange={() => handleToggleFeatured(game.id, game.is_featured || false)}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {game.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-500 border-green-500 hover:bg-green-50"
                                      onClick={() => handleApproveGame(game.id)}
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-500 border-red-500 hover:bg-red-50"
                                      onClick={() => handleRejectGame(game.id)}
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>{isVN ? 'Quản lý Người dùng' : 'User Management'}</CardTitle>
                  <CardDescription>
                    {isVN ? 'Xem và quản lý tài khoản người dùng' : 'View and manage user accounts'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isVN ? 'Người dùng' : 'User'}</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>{isVN ? 'Số dư CAMLY' : 'CAMLY Balance'}</TableHead>
                        <TableHead>{isVN ? 'Lượt chơi' : 'Total Plays'}</TableHead>
                        <TableHead>{isVN ? 'Ngày tham gia' : 'Joined'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.slice(0, 20).map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={userData.avatar_url || ''} />
                                <AvatarFallback>{userData.username?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{userData.username}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{userData.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              💰 {(userData.wallet_balance || 0).toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>{userData.total_plays || 0}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(userData.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>{isVN ? 'Báo cáo vi phạm' : 'Violation Reports'}</CardTitle>
                  <CardDescription>
                    {isVN ? 'Xử lý các báo cáo từ người dùng' : 'Handle user reports'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                      <p>{isVN ? 'Không có báo cáo nào cần xử lý!' : 'No reports to review!'}</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{isVN ? 'Người báo cáo' : 'Reporter'}</TableHead>
                          <TableHead>{isVN ? 'Lý do' : 'Reason'}</TableHead>
                          <TableHead>{isVN ? 'Chi tiết' : 'Details'}</TableHead>
                          <TableHead>{isVN ? 'Trạng thái' : 'Status'}</TableHead>
                          <TableHead>{isVN ? 'Hành động' : 'Actions'}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reports.map((report) => (
                          <TableRow key={report.id}>
                            <TableCell>{report.reporter?.username || 'Unknown'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{report.reason}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {report.details || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${
                                report.status === 'pending' ? 'bg-yellow-500' :
                                report.status === 'resolved' ? 'bg-green-500' : 'bg-gray-500'
                              } text-white`}>
                                {report.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {report.status === 'pending' && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-green-500"
                                    onClick={() => handleResolveReport(report.id, 'resolved')}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-gray-500"
                                    onClick={() => handleResolveReport(report.id, 'dismissed')}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
