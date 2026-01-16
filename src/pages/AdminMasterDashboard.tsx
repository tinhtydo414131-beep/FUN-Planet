import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminRole } from "@/hooks/useAdminRole";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  Wallet,
  HeartHandshake,
  Target,
  MessageSquare,
  Music2,
  LayoutDashboard,
  UserCog,
  ShieldCheck,
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
import { AdminDonationsTab } from "@/components/admin/AdminDonationsTab";
import { AdminWeeklySummaryStats } from "@/components/admin/AdminWeeklySummaryStats";
import { AdminKPIDashboard } from "@/components/admin/AdminKPIDashboard";
import { AdminAppealsTab } from "@/components/admin/AdminAppealsTab";
import { AdminMusicTab } from "@/components/admin/AdminMusicTab";

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
  const [activeTab, setActiveTab] = useState("dashboard");
  const [pendingMusicCount, setPendingMusicCount] = useState(0);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Sub-tab states
  const [dashboardSubTab, setDashboardSubTab] = useState("overview");
  const [managementSubTab, setManagementSubTab] = useState("users");
  const [financeSubTab, setFinanceSubTab] = useState("rewards");

  // Navigate to specific tab (called from realtime bell)
  const handleNavigateToTab = (tab: string) => {
    // Map old tab names to new structure
    const tabMapping: Record<string, { main: string; sub: string }> = {
      overview: { main: "dashboard", sub: "overview" },
      kpi: { main: "dashboard", sub: "kpi" },
      analytics: { main: "dashboard", sub: "analytics" },
      reports: { main: "dashboard", sub: "reports" },
      users: { main: "management", sub: "users" },
      games: { main: "management", sub: "games" },
      music: { main: "management", sub: "music" },
      angelai: { main: "management", sub: "angelai" },
      appeals: { main: "management", sub: "appeals" },
      donations: { main: "management", sub: "donations" },
      settings: { main: "management", sub: "settings" },
      rewards: { main: "finance", sub: "rewards" },
      withdrawals: { main: "finance", sub: "withdrawals" },
      fraud: { main: "finance", sub: "fraud" },
      audit: { main: "finance", sub: "audit" },
      notifications: { main: "finance", sub: "notifications" },
    };

    const mapping = tabMapping[tab];
    if (mapping) {
      setActiveTab(mapping.main);
      if (mapping.main === "dashboard") setDashboardSubTab(mapping.sub);
      if (mapping.main === "management") setManagementSubTab(mapping.sub);
      if (mapping.main === "finance") setFinanceSubTab(mapping.sub);
    }
    
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

      // Get pending music count
      const { count: pendingMusic } = await supabase
        .from("user_music")
        .select("*", { count: "exact", head: true })
        .eq("pending_approval", true);

      setPendingMusicCount(pendingMusic || 0);

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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">

        {/* 3 Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" ref={tabsRef}>
          <TabsList className="grid grid-cols-3 w-full mb-6 h-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 py-3 px-4 text-sm font-medium">
              <LayoutDashboard className="h-5 w-5" />
              <span className="hidden sm:inline">📊 Tổng Quan</span>
              <span className="sm:hidden">Tổng Quan</span>
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2 py-3 px-4 text-sm font-medium relative">
              <UserCog className="h-5 w-5" />
              <span className="hidden sm:inline">👥 Quản Lý</span>
              <span className="sm:hidden">Quản Lý</span>
              {pendingMusicCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {pendingMusicCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2 py-3 px-4 text-sm font-medium relative">
              <ShieldCheck className="h-5 w-5" />
              <span className="hidden sm:inline">💰 Tài Chính & Bảo Mật</span>
              <span className="sm:hidden">Tài Chính</span>
              {stats.suspiciousCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {stats.suspiciousCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Tổng Quan (Dashboard) */}
          <TabsContent value="dashboard" className="space-y-4">
            <Tabs value={dashboardSubTab} onValueChange={setDashboardSubTab}>
              <TabsList className="w-full justify-start bg-muted/50 p-1">
                <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="kpi" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Target className="h-4 w-4" />
                  KPI
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <TrendingUp className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <FileText className="h-4 w-4" />
                  Reports
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4">
                <AdminOverviewTab stats={stats} onRefresh={loadStats} />
              </TabsContent>
              <TabsContent value="kpi" className="mt-4">
                <AdminKPIDashboard />
              </TabsContent>
              <TabsContent value="analytics" className="mt-4">
                <AdminAnalyticsTab />
              </TabsContent>
              <TabsContent value="reports" className="mt-4">
                <AdminReportsTab onStatsUpdate={loadStats} />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Tab 2: Quản Lý (Management) */}
          <TabsContent value="management" className="space-y-4">
            <Tabs value={managementSubTab} onValueChange={setManagementSubTab}>
              <TabsList className="w-full justify-start bg-muted/50 p-1 flex-wrap h-auto gap-1">
                <TabsTrigger value="users" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Users className="h-4 w-4" />
                  Users
                </TabsTrigger>
                <TabsTrigger value="games" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Gamepad2 className="h-4 w-4" />
                  Games
                </TabsTrigger>
                <TabsTrigger value="music" className="flex items-center gap-1.5 text-xs sm:text-sm relative">
                  <Music2 className="h-4 w-4" />
                  Music
                  {pendingMusicCount > 0 && (
                    <span className="ml-1 bg-pink-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                      {pendingMusicCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="angelai" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="h-4 w-4" />
                  Angel AI
                </TabsTrigger>
                <TabsTrigger value="appeals" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <MessageSquare className="h-4 w-4" />
                  Appeals
                </TabsTrigger>
                <TabsTrigger value="donations" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <HeartHandshake className="h-4 w-4" />
                  Donations
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-4">
                <AdminUsersTab onStatsUpdate={loadStats} />
              </TabsContent>
              <TabsContent value="games" className="mt-4">
                <AdminGamesTab onStatsUpdate={loadStats} />
              </TabsContent>
              <TabsContent value="music" className="mt-4">
                <AdminMusicTab onStatsUpdate={loadStats} />
              </TabsContent>
              <TabsContent value="angelai" className="mt-4">
                <AdminAngelAITab />
              </TabsContent>
              <TabsContent value="appeals" className="mt-4">
                <AdminAppealsTab />
              </TabsContent>
              <TabsContent value="donations" className="mt-4">
                <AdminDonationsTab />
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <AdminSettingsTab />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* Tab 3: Tài Chính & Bảo Mật (Finance & Security) */}
          <TabsContent value="finance" className="space-y-4">
            <Tabs value={financeSubTab} onValueChange={setFinanceSubTab}>
              <TabsList className="w-full justify-start bg-muted/50 p-1 flex-wrap h-auto gap-1">
                <TabsTrigger value="rewards" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Coins className="h-4 w-4" />
                  Rewards
                </TabsTrigger>
                <TabsTrigger value="withdrawals" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Wallet className="h-4 w-4" />
                  Withdrawals
                </TabsTrigger>
                <TabsTrigger value="fraud" className="flex items-center gap-1.5 text-xs sm:text-sm relative">
                  <AlertTriangle className="h-4 w-4" />
                  Fraud
                  {stats.suspiciousCount > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                      {stats.suspiciousCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <ScrollText className="h-4 w-4" />
                  Audit
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Bell className="h-4 w-4" />
                  Notify
                </TabsTrigger>
              </TabsList>

              <TabsContent value="rewards" className="mt-4">
                <AdminRewardsTab onStatsUpdate={loadStats} />
              </TabsContent>
              <TabsContent value="withdrawals" className="mt-4">
                <AdminWithdrawalsTab />
              </TabsContent>
              <TabsContent value="fraud" className="mt-4">
                <AdminFraudTab onStatsUpdate={loadStats} />
              </TabsContent>
              <TabsContent value="audit" className="mt-4">
                <AdminAuditLogsTab />
              </TabsContent>
              <TabsContent value="notifications" className="mt-4">
                <div className="space-y-6">
                  <AdminNotificationsTab />
                  <AdminWeeklySummaryStats />
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
