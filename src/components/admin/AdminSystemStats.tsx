import { useState, useCallback, useEffect, forwardRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { CAMLY_CONTRACT_ADDRESS, CAMLY_ABI } from "@/lib/web3";
import { 
  Users, 
  Gamepad2, 
  Wallet, 
  Upload, 
  Coins,
  RefreshCw,
  Loader2,
  UserPlus,
  Clock,
  CheckCircle,
  Ban,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

// Treasury wallet address and BSC RPC (with backup URLs)
const FUN_PLANET_TREASURY = "0xDb792AF6a426E1c2AbF4A2A1F8716775b7145C69";
const BSC_RPC_URLS = [
  "https://bsc-dataseed.binance.org",
  "https://bsc-dataseed1.binance.org",
  "https://bsc-dataseed2.binance.org"
];

interface SystemStats {
  totalUsers: number;
  newUsersToday: number;
  totalGames: number;
  totalUploads: number;
  treasuryBalance: number;
  totalCamly: number;
  pendingCamly: number;
  claimedCamly: number;
  blockedUsers: number;
  suspiciousCount: number;
  todayClaims: number;
}

export const AdminSystemStats = forwardRef<HTMLDivElement>((_, ref) => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTreasuryBalance = useCallback(async (): Promise<number> => {
    for (const rpcUrl of BSC_RPC_URLS) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, CAMLY_ABI, provider);
        const decimals = await contract.decimals();
        const balance = await contract.balanceOf(FUN_PLANET_TREASURY);
        return Math.round(parseFloat(ethers.formatUnits(balance, Number(decimals))));
      } catch (error) {
        console.warn(`RPC ${rpcUrl} failed, trying next...`);
      }
    }
    return 0;
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      const today = new Date().toISOString().split('T')[0];

      // Parallel fetch all data
      const [
        treasuryBalance,
        publicStatsResult,
        rewardsResult,
        blockedResult,
        suspiciousResult,
        newUsersResult,
        todayClaimsResult
      ] = await Promise.all([
        fetchTreasuryBalance(),
        supabase.rpc('get_public_stats'),
        supabase.from("user_rewards").select("pending_amount, claimed_amount"),
        supabase.from("admin_blocked_users")
          .select("*", { count: "exact", head: true })
          .eq("status", "blocked"),
        supabase.from("suspicious_activity_logs")
          .select("*", { count: "exact", head: true })
          .eq("reviewed", false),
        supabase.from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", `${today}T00:00:00`),
        supabase.from("daily_claim_logs")
          .select("*", { count: "exact", head: true })
          .gte("claim_date", today)
      ]);

      // Calculate totals from rewards data
      const rewards = rewardsResult.data || [];
      const pendingCamly = rewards.reduce((sum, r) => sum + (r.pending_amount || 0), 0);
      const claimedCamly = rewards.reduce((sum, r) => sum + (r.claimed_amount || 0), 0);

      // Extract public stats - handle array response from RPC with type assertion
      const publicStatsData = publicStatsResult.data as any;
      const publicStats = Array.isArray(publicStatsData) ? publicStatsData[0] : publicStatsData;

      setStats({
        totalUsers: publicStats?.total_users || 0,
        newUsersToday: newUsersResult.count || 0,
        totalGames: publicStats?.total_games || 0,
        totalUploads: publicStats?.total_uploads || 0,
        treasuryBalance,
        totalCamly: publicStats?.total_camly || 0,
        pendingCamly,
        claimedCamly,
        blockedUsers: blockedResult.count || 0,
        suspiciousCount: suspiciousResult.count || 0,
        todayClaims: todayClaimsResult.count || 0
      });
    } catch (error) {
      console.error("Error fetching system stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchTreasuryBalance]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <Card ref={ref} className="p-6 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-500 animate-spin mr-2" />
          <span className="text-gray-500">Đang tải thống kê...</span>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const statItems = [
    {
      icon: Users,
      value: formatNumber(stats.totalUsers),
      label: "Users",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      icon: UserPlus,
      value: `+${stats.newUsersToday}`,
      label: "Today",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      icon: Gamepad2,
      value: formatNumber(stats.totalGames),
      label: "Games",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      icon: Upload,
      value: formatNumber(stats.totalUploads),
      label: "Uploads",
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200"
    },
    {
      icon: Wallet,
      value: formatNumber(stats.treasuryBalance),
      label: "Quỹ FP",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      icon: Coins,
      value: formatNumber(stats.totalCamly),
      label: "System",
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200"
    },
    {
      icon: Clock,
      value: formatNumber(stats.pendingCamly),
      label: "Pending",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    },
    {
      icon: CheckCircle,
      value: formatNumber(stats.claimedCamly),
      label: "Claimed",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200"
    }
  ];

  return (
    <Card ref={ref} className="p-4 sm:p-6 bg-white/90 backdrop-blur-sm border border-gray-200 shadow-lg rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-800">Thống Kê Hệ Thống</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStats}
          disabled={refreshing}
          className="text-gray-500 hover:text-gray-800 hover:bg-gray-100"
        >
          <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats Grid - 8 columns */}
      <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3 mb-4">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} rounded-lg p-2 sm:p-3 text-center border ${item.borderColor} hover:shadow-md transition-all`}
          >
            <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color} mx-auto mb-1`} />
            <div className={`text-sm sm:text-lg font-bold ${item.color}`}>
              {item.value}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 font-medium">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Ban className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">Blocked:</span>
            <span className="text-red-500 font-semibold">{stats.blockedUsers}</span>
          </div>
          {stats.suspiciousCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-amber-500 font-semibold">{stats.suspiciousCount} suspicious</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-gray-600">Claims today:</span>
          <span className="text-green-500 font-semibold">{stats.todayClaims}</span>
        </div>
      </div>
    </Card>
  );
});

AdminSystemStats.displayName = "AdminSystemStats";
