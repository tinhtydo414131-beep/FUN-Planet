import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, ShieldAlert, Users, AlertTriangle, Loader2 } from "lucide-react";

interface WalletStats {
  total_wallets: number;
  blacklisted_wallets: number;
  users_with_multiple_changes: number;
  suspicious_patterns: number;
}

export function WalletSecurityStats() {
  const [stats, setStats] = useState<WalletStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_wallet_fraud_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setStats({
          total_wallets: Number(data[0].total_wallets) || 0,
          blacklisted_wallets: Number(data[0].blacklisted_wallets) || 0,
          users_with_multiple_changes: Number(data[0].users_with_multiple_changes) || 0,
          suspicious_patterns: Number(data[0].suspicious_patterns) || 0,
        });
      }
    } catch (error) {
      console.error("Load wallet stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-4 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Wallets</p>
              <p className="text-xl font-bold">{stats?.total_wallets || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Blacklisted</p>
              <p className="text-xl font-bold">{stats?.blacklisted_wallets || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Multiple Changes</p>
              <p className="text-xl font-bold">{stats?.users_with_multiple_changes || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Suspicious</p>
              <p className="text-xl font-bold">{stats?.suspicious_patterns || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
