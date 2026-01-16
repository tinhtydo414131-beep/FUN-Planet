import { useState, useCallback, useEffect, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ethers } from "ethers";
import { CAMLY_CONTRACT_ADDRESS, CAMLY_ABI } from "@/lib/web3";
import { 
  Users, 
  Gamepad2, 
  Wallet, 
  Upload, 
  Gem,
  RefreshCw,
  Loader2 
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
  totalGames: number;
  treasuryBalance: number;
  totalUploads: number;
  totalCamly: number;
}

export const AdminSystemStats = forwardRef<HTMLDivElement>((_, ref) => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalGames: 0,
    treasuryBalance: 0,
    totalUploads: 0,
    totalCamly: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTreasuryBalance = useCallback(async (): Promise<number> => {
    console.log("🏦 [Admin] Fetching treasury balance for:", FUN_PLANET_TREASURY);
    
    for (const rpcUrl of BSC_RPC_URLS) {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, CAMLY_ABI, provider);
        
        const decimals = await contract.decimals();
        const balance = await contract.balanceOf(FUN_PLANET_TREASURY);
        const formattedBalance = ethers.formatUnits(balance, Number(decimals));
        
        return Math.round(parseFloat(formattedBalance));
      } catch (error) {
        console.warn(`⚠️ RPC ${rpcUrl} failed:`, error);
        continue;
      }
    }
    
    console.error("❌ All RPC endpoints failed");
    return 0;
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true);
      
      const [treasuryBalance, statsResult] = await Promise.all([
        fetchTreasuryBalance(),
        supabase.rpc('get_public_stats')
      ]);

      if (statsResult.error) {
        console.error("Error fetching public stats:", statsResult.error);
        return;
      }

      const data = statsResult.data as {
        total_users: number;
        total_games: number;
        total_uploads: number;
        total_camly: number;
      };

      console.log("📊 [Admin] System Stats via RPC:", data);
      console.log("💰 [Admin] Treasury Balance:", treasuryBalance);

      setStats({
        totalUsers: data.total_users || 0,
        totalGames: data.total_games || 0,
        treasuryBalance,
        totalUploads: data.total_uploads || 0,
        totalCamly: data.total_camly || 0,
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

  const statItems = [
    {
      label: "Users",
      value: stats.totalUsers,
      icon: Users,
      gradient: "from-blue-500/20 to-blue-600/10",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-500",
      description: "players"
    },
    {
      label: "Games",
      value: stats.totalGames,
      icon: Gamepad2,
      gradient: "from-purple-500/20 to-purple-600/10",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-500",
      description: "titles"
    },
    {
      label: "Quỹ FP",
      value: stats.treasuryBalance,
      icon: Wallet,
      gradient: "from-yellow-500/20 to-yellow-600/10",
      borderColor: "border-yellow-500/30",
      iconColor: "text-yellow-500",
      description: "💰 treasury"
    },
    {
      label: "Uploads",
      value: stats.totalUploads,
      icon: Upload,
      gradient: "from-green-500/20 to-green-600/10",
      borderColor: "border-green-500/30",
      iconColor: "text-green-500",
      description: "approved"
    },
    {
      label: "Total CAMLY",
      value: stats.totalCamly,
      icon: Gem,
      gradient: "from-pink-500/20 to-pink-600/10",
      borderColor: "border-pink-500/30",
      iconColor: "text-pink-500",
      description: "💎 system"
    }
  ];

  if (loading) {
    return (
      <Card ref={ref}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={ref} className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" />
            Thống Kê Hệ Thống (Honor Board)
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Đồng bộ real-time với Honor Board trên homepage
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statItems.map((item) => (
            <Card 
              key={item.label}
              className={`bg-gradient-to-br ${item.gradient} ${item.borderColor} border`}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <item.icon className={`h-8 w-8 ${item.iconColor}`} />
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatNumber(item.value)}
                    </p>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

AdminSystemStats.displayName = "AdminSystemStats";
