import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Settings
} from "lucide-react";
import { AdminOverviewTab } from "@/components/admin/AdminOverviewTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { AdminRewardsTab } from "@/components/admin/AdminRewardsTab";
import { AdminFraudTab } from "@/components/admin/AdminFraudTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";

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
  const [isAdmin, setIsAdmin] = useState(false);
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

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  const checkAdminAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Check admin role from user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        toast.error("Access denied. Admin only.");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      await loadStats();
    } catch (error) {
      console.error("Admin check error:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setRefreshing(true);
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
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
            <TabsTrigger value="fraud" className="flex items-center gap-2 relative">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Fraud</span>
              {stats.suspiciousCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {stats.suspiciousCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab stats={stats} onRefresh={loadStats} />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsersTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="rewards">
            <AdminRewardsTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="fraud">
            <AdminFraudTab onStatsUpdate={loadStats} />
          </TabsContent>

          <TabsContent value="settings">
            <AdminSettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
