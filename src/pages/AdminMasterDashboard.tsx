import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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
  Bell,
  FileText,
  History,
  Bot,
  Flag
} from "lucide-react";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminRewardsTab } from "@/components/admin/AdminRewardsTab";
import { AdminFraudTab } from "@/components/admin/AdminFraudTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminGamesTab } from "@/components/admin/AdminGamesTab";
import { AdminAnalyticsTab } from "@/components/admin/AdminAnalyticsTab";
import { AdminNotificationsTab } from "@/components/admin/AdminNotificationsTab";
import { AdminAuditLogsTab } from "@/components/admin/AdminAuditLogsTab";
import { AdminReportsTab } from "@/components/admin/AdminReportsTab";
import { AdminAngelAITab } from "@/components/admin/AdminAngelAITab";
import { AdminQuickActionsPanel } from "@/components/admin/AdminQuickActionsPanel";

interface Stats {
  totalUsers: number;
  totalPending: number;
  totalClaimed: number;
  totalEarned: number;
  blockedUsers: number;
  suspiciousCount: number;
  todayClaims: number;
  newUsersToday: number;
  pendingGames: number;
  pendingReports: number;
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
    newUsersToday: 0,
    pendingGames: 0,
    pendingReports: 0
  });
  const [refreshing, setRefreshing] = useState(false);

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

      // Get pending games count
      const { count: pendingGames } = await supabase
        .from("uploaded_games")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Get pending reports count
      const { count: pendingReports } = await supabase
        .from("comment_reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      setStats({
        totalUsers: usersCount || 0,
        totalPending,
        totalClaimed,
        totalEarned,
        blockedUsers: blockedCount || 0,
        suspiciousCount: suspiciousCount || 0,
        todayClaims: todayClaims || 0,
        newUsersToday: newUsersToday || 0,
        pendingGames: pendingGames || 0,
        pendingReports: pendingReports || 0
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

  // Tab configuration with icons and badges
  const tabConfig = [
    { value: "overview", label: "Overview", icon: BarChart3 },
    { value: "users", label: "Users", icon: Users },
    { value: "games", label: "Games", icon: Gamepad2, badge: stats.pendingGames },
    { value: "rewards", label: "Rewards", icon: Coins },
    { value: "analytics", label: "Analytics", icon: TrendingUp },
    { value: "fraud", label: "Fraud", icon: AlertTriangle, badge: stats.suspiciousCount },
    { value: "reports", label: "Reports", icon: Flag, badge: stats.pendingReports },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "audit", label: "Audit Logs", icon: History },
    { value: "angel-ai", label: "Angel AI", icon: Bot },
    { value: "settings", label: "Settings", icon: Settings }
  ];

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
                <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  Admin Dashboard
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Quản lý toàn diện FUN Planet
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="pt-4 pb-3 px-3 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Total Users</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-500">+{stats.newUsersToday} today</p>
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="pt-4 pb-3 px-3 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Pending CAMLY</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{(stats.totalPending / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-muted-foreground">Chờ claim</p>
                </div>
                <Coins className="h-6 w-6 md:h-8 md:w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="pt-4 pb-3 px-3 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Claimed CAMLY</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{(stats.totalClaimed / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-muted-foreground">{stats.todayClaims} claims today</p>
                </div>
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="pt-4 pb-3 px-3 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">Blocked Users</p>
                  <p className="text-xl md:text-2xl font-bold text-foreground">{stats.blockedUsers}</p>
                  {stats.suspiciousCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.suspiciousCount} suspicious
                    </Badge>
                  )}
                </div>
                <AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Panel */}
        <AdminQuickActionsPanel 
          pendingGamesCount={stats.pendingGames}
          pendingReportsCount={stats.pendingReports}
          onRefresh={loadStats}
        />

        {/* Main Tabs - All 11 Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          {/* Scrollable TabsList for mobile */}
          <ScrollArea className="w-full whitespace-nowrap mb-6">
            <TabsList className="inline-flex h-auto p-1 bg-muted/50">
              {tabConfig.map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="flex items-center gap-1.5 px-3 py-2 relative data-[state=active]:bg-background"
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-xs md:text-sm">{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1.5 -right-1.5 h-4 min-w-4 flex items-center justify-center text-[10px] px-1"
                    >
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

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

          <TabsContent value="analytics">
            <AdminAnalyticsTab />
          </TabsContent>

          <TabsContent value="fraud">
            <AdminFraudTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="reports">
            <AdminReportsTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="notifications">
            <AdminNotificationsTab />
          </TabsContent>

          <TabsContent value="audit">
            <AdminAuditLogsTab />
          </TabsContent>

          <TabsContent value="angel-ai">
            <AdminAngelAITab />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
