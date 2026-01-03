import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Users, 
  Coins, 
  Shield, 
  AlertTriangle, 
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Settings,
  Loader2,
  Gamepad2,
  FileText,
  ScrollText,
  Sparkles,
  Bell,
  Wallet
} from "lucide-react";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminRewardsTab } from "@/components/admin/AdminRewardsTab";
import { AdminFraudTab } from "@/components/admin/AdminFraudTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminGamesTab } from "@/components/admin/AdminGamesTab";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminAuditLogsTab } from "@/components/admin/AdminAuditLogsTab";
import { AdminAngelAITab } from "@/components/admin/AdminAngelAITab";
import { AdminNotificationsTab } from "@/components/admin/AdminNotificationsTab";
import { AdminRealtimeBell } from "@/components/admin/AdminRealtimeBell";
import { AdminWithdrawalsTab } from "@/components/admin/AdminWithdrawalsTab";

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

export default function AdminMasterDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdminRole();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPending: 0,
    totalClaimed: 0,
    totalEarned: 0,
    blockedUsers: 0,
    suspiciousCount: 0,
    todayClaims: 0,
    newUsersToday: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const tabsRef = useRef<HTMLDivElement>(null);

  // Navigate to specific tab (called from realtime bell)
  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
    // Scroll tabs into view
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Redirect non-admin users
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      toast.error("Bạn không có quyền truy cập trang này");
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  // Load data when admin access is confirmed
  useEffect(() => {
    if (isAdmin && !adminLoading) {
      loadStats();
    }
  }, [isAdmin, adminLoading]);

  const loadStats = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      // Get total users
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get reward stats from user_rewards
      const { data: rewardsData } = await supabase
        .from("user_rewards")
        .select("pending_amount, claimed_amount, total_earned");

      const totalPending = rewardsData?.reduce((sum, r) => sum + Number(r.pending_amount || 0), 0) || 0;
      const totalClaimed = rewardsData?.reduce((sum, r) => sum + Number(r.claimed_amount || 0), 0) || 0;
      const totalEarned = rewardsData?.reduce((sum, r) => sum + Number(r.total_earned || 0), 0) || 0;

      // Get blocked users count
      const { count: blockedCount } = await supabase
        .from("admin_blocked_users")
        .select("*", { count: "exact", head: true })
        .eq("status", "blocked");

      // Get suspicious activity count (unreviewed)
      const { count: suspiciousCount } = await supabase
        .from("suspicious_activity_logs")
        .select("*", { count: "exact", head: true })
        .eq("reviewed", false);

      // Get today's claims
      const today = new Date().toISOString().split("T")[0];
      const { count: todayClaims } = await supabase
        .from("daily_claim_logs")
        .select("*", { count: "exact", head: true })
        .gte("claim_date", today);

      // Get new users today
      const { count: newUsersToday } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today);

      setStats({
        totalUsers: usersCount || 0,
        totalPending,
        totalClaimed,
        totalEarned,
        blockedUsers: blockedCount || 0,
        suspiciousCount: suspiciousCount || 0,
        todayClaims: todayClaims || 0,
        newUsersToday: newUsersToday || 0
      });
    } catch (error) {
      console.error("Load stats error:", error);
      toast.error("Failed to load statistics");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Show loading state
  if (adminLoading || (loading && isAdmin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render anything if not admin (redirect will happen via useEffect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Admin Master Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Quản lý toàn diện FUN Planet
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AdminRealtimeBell 
                onNavigateToTab={handleNavigateToTab}
                onRefreshStats={loadStats}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={loadStats}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-500">+{stats.newUsersToday} today</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending CAMLY</p>
                  <p className="text-2xl font-bold text-foreground">{(stats.totalPending / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-muted-foreground">Chờ claim</p>
                </div>
                <Coins className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Claimed CAMLY</p>
                  <p className="text-2xl font-bold text-foreground">{(stats.totalClaimed / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-muted-foreground">{stats.todayClaims} claims today</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked Users</p>
                  <p className="text-2xl font-bold text-foreground">{stats.blockedUsers}</p>
                  {stats.suspiciousCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.suspiciousCount} suspicious
                    </Badge>
                  )}
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs - Responsive Grid */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" ref={tabsRef}>
          <TabsList className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 w-full mb-6 h-auto gap-1">
            <TabsTrigger value="overview" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <Gamepad2 className="h-4 w-4" />
              <span>Games</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <Coins className="h-4 w-4" />
              <span>Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <Wallet className="h-4 w-4" />
              <span>Withdrawals</span>
            </TabsTrigger>
            <TabsTrigger value="fraud" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs relative">
              <AlertTriangle className="h-4 w-4" />
              <span>Fraud</span>
              {stats.suspiciousCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {stats.suspiciousCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <TrendingUp className="h-4 w-4" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <ScrollText className="h-4 w-4" />
              <span>Audit</span>
            </TabsTrigger>
            <TabsTrigger value="angelai" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <Sparkles className="h-4 w-4" />
              <span>Angel AI</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <Bell className="h-4 w-4" />
              <span>Notify</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab stats={stats} onRefresh={loadStats} />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="games">
            <AdminGamesTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="rewards">
            <AdminRewardsTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="withdrawals">
            <AdminWithdrawalsTab />
          </TabsContent>

          <TabsContent value="fraud">
            <AdminFraudTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="reports">
            <AdminReportsTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="analytics">
            <AdminAnalyticsTab />
          </TabsContent>

          <TabsContent value="audit">
            <AdminAuditLogsTab />
          </TabsContent>

          <TabsContent value="angelai">
            <AdminAngelAITab />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotificationsTab />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
