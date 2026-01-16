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
      <Card ref={ref} className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin mr-2" />
          <span className="text-slate-400">Đang tải thống kê...</span>
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
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: UserPlus,
      value: `+${stats.newUsersToday}`,
      label: "Today",
      color: "text-green-400",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Gamepad2,
      value: formatNumber(stats.totalGames),
      label: "Games",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Upload,
      value: formatNumber(stats.totalUploads),
      label: "Uploads",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10"
    },
    {
      icon: Wallet,
      value: formatNumber(stats.treasuryBalance),
      label: "Quỹ FP",
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10"
    },
    {
      icon: Coins,
      value: formatNumber(stats.totalCamly),
      label: "System",
      color: "text-pink-400",
      bgColor: "bg-pink-500/10"
    },
    {
      icon: Clock,
      value: formatNumber(stats.pendingCamly),
      label: "Pending",
      color: "text-orange-400",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: CheckCircle,
      value: formatNumber(stats.claimedCamly),
      label: "Claimed",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10"
    }
  ];

  return (
    <Card ref={ref} className="p-4 sm:p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">Thống Kê Hệ Thống</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStats}
          disabled={refreshing}
          className="text-slate-400 hover:text-white hover:bg-slate-700/50"
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
            className={`${item.bgColor} rounded-lg p-2 sm:p-3 text-center border border-white/5 hover:border-white/10 transition-all`}
          >
            <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.color} mx-auto mb-1`} />
            <div className={`text-sm sm:text-lg font-bold ${item.color}`}>
              {item.value}
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 font-medium">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Ban className="w-4 h-4 text-red-400" />
            <span className="text-slate-400">Blocked:</span>
            <span className="text-red-400 font-semibold">{stats.blockedUsers}</span>
          </div>
          {stats.suspiciousCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-semibold">{stats.suspiciousCount} suspicious</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-slate-400">Claims today:</span>
          <span className="text-green-400 font-semibold">{stats.todayClaims}</span>
        </div>
      </div>
    </Card>
  );
});

AdminSystemStats.displayName = "AdminSystemStats";
