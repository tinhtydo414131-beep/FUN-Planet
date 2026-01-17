import React, { forwardRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Globe,
  Users,
  AlertTriangle,
  Ban,
  Loader2,
  RefreshCw,
  Coins,
  Shield,
} from "lucide-react";
import { format } from "date-fns";

interface IPFraudRing {
  fraud_ip: string;
  account_count: number;
  user_ids: string[];
  usernames: string[];
  total_balance: number;
  first_seen: string;
  last_seen: string;
}

interface IPStats {
  total_suspicious_ips: number;
  total_affected_accounts: number;
  total_affected_balance: number;
  blacklisted_ips: number;
  recent_fraud_rings: number;
}

interface IPFraudReportProps {
  onStatsUpdate?: () => void;
}

const IPFraudReport = forwardRef<HTMLDivElement, IPFraudReportProps>(
  ({ onStatsUpdate }, ref) => {
  const [fraudRings, setFraudRings] = useState<IPFraudRing[]>([]);
  const [stats, setStats] = useState<IPStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocking, setBlocking] = useState<string | null>(null);
  const [confirmBlockIP, setConfirmBlockIP] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('[IPFraudReport] Loading fraud rings...');
      
      // Load IP fraud rings
      const { data: rings, error: ringsError } = await supabase.rpc(
        "detect_ip_fraud_rings",
        { min_accounts: 2 }
      );

      console.log('[IPFraudReport] Fraud rings result:', { rings, error: ringsError });

      if (ringsError) throw ringsError;
      setFraudRings(rings || []);

      // Load stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_fraud_ip_stats"
      );

      console.log('[IPFraudReport] Stats result:', { statsData, error: statsError });

      if (statsError) throw statsError;
      if (statsData && statsData[0]) {
        setStats(statsData[0]);
      }
    } catch (error) {
      console.error("[IPFraudReport] Load IP fraud data error:", error);
      toast.error("Failed to load IP fraud data");
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async (ipAddress: string) => {
    setBlocking(ipAddress);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc("admin_block_users_by_ip", {
        p_ip_address: ipAddress,
        p_admin_id: user.id,
        p_reason: "Multi-account fraud from same IP",
      });

      if (error) throw error;

      const result = data?.[0];
      if (result) {
        toast.success(
          `Blocked ${result.blocked_count} accounts from IP ${ipAddress}`
        );
        loadData();
        onStatsUpdate?.();
      }
    } catch (error) {
      console.error("Block IP error:", error);
      toast.error("Failed to block IP");
    } finally {
      setBlocking(null);
      setConfirmBlockIP(null);
    }
  };

  const getRiskLevel = (accountCount: number, balance: number) => {
    if (accountCount >= 10 || balance >= 1000000) {
      return { level: "critical", color: "destructive" };
    }
    if (accountCount >= 5 || balance >= 500000) {
      return { level: "high", color: "destructive" };
    }
    if (accountCount >= 3) {
      return { level: "medium", color: "warning" };
    }
    return { level: "low", color: "secondary" };
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(2)}M`;
    }
    if (balance >= 1000) {
      return `${(balance / 1000).toFixed(1)}K`;
    }
    return balance.toFixed(0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Suspicious IPs</p>
                <p className="text-xl font-bold">
                  {stats?.total_suspicious_ips || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Affected Accounts</p>
                <p className="text-xl font-bold">
                  {stats?.total_affected_accounts || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Balance</p>
                <p className="text-xl font-bold">
                  {formatBalance(stats?.total_affected_balance || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Blacklisted IPs</p>
                <p className="text-xl font-bold">
                  {stats?.blacklisted_ips || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Recent (7d)</p>
                <p className="text-xl font-bold">
                  {stats?.recent_fraud_rings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IP Fraud Rings Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 flex-shrink-0" />
              <span className="hidden sm:inline">IP Fraud Rings</span>
              <span className="sm:hidden">Fraud Rings</span>
              {fraudRings.length > 0 && (
                <Badge variant="destructive">{fraudRings.length}</Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadData} className="h-9 sm:h-8 px-3">
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fraudRings.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">
                No IP fraud rings detected
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block sm:hidden space-y-3">
                {fraudRings.map((ring) => {
                  const risk = getRiskLevel(ring.account_count, ring.total_balance);
                  return (
                    <Card key={ring.fraud_ip} className="p-3 border-l-4 border-l-destructive">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-mono text-sm font-medium break-all">{ring.fraud_ip}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {ring.account_count} accounts
                            </Badge>
                          </div>
                        </div>
                        <Badge
                          variant={risk.color as any}
                          className={`text-xs ${risk.level === "medium" ? "bg-amber-500/20 text-amber-500" : ""}`}
                        >
                          {risk.level.toUpperCase()}
                        </Badge>
                      </div>
                      
                      {/* Usernames */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {ring.usernames?.slice(0, 4).map((username, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {username}
                          </Badge>
                        ))}
                        {ring.usernames?.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{ring.usernames.length - 4}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Balance + Dates */}
                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-amber-500 font-semibold">
                          <Coins className="h-3 w-3 inline mr-1" />
                          {formatBalance(ring.total_balance)} CAMLY
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {ring.last_seen ? format(new Date(ring.last_seen), "dd/MM HH:mm") : "-"}
                        </span>
                      </div>
                      
                      {/* Action Button - Full width on mobile */}
                      <Button
                        variant="destructive"
                        size="default"
                        className="w-full h-11"
                        onClick={() => setConfirmBlockIP(ring.fraud_ip)}
                        disabled={blocking === ring.fraud_ip}
                      >
                        {blocking === ring.fraud_ip ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Ban className="h-4 w-4 mr-2" />
                            Block All Accounts
                          </>
                        )}
                      </Button>
                    </Card>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Accounts</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Total Balance</TableHead>
                      <TableHead>First Seen</TableHead>
                      <TableHead>Last Seen</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fraudRings.map((ring) => {
                      const risk = getRiskLevel(ring.account_count, ring.total_balance);
                      return (
                        <TableRow key={ring.fraud_ip}>
                          <TableCell className="font-mono text-sm">
                            {ring.fraud_ip}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{ring.account_count}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {ring.usernames?.slice(0, 3).map((username, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {username}
                                </Badge>
                              ))}
                              {ring.usernames?.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{ring.usernames.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-amber-500">
                            {formatBalance(ring.total_balance)} CAMLY
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {ring.first_seen ? format(new Date(ring.first_seen), "dd/MM/yy") : "-"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {ring.last_seen ? format(new Date(ring.last_seen), "dd/MM/yy HH:mm") : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={risk.color as any}
                              className={risk.level === "medium" ? "bg-amber-500/20 text-amber-500" : ""}
                            >
                              {risk.level.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setConfirmBlockIP(ring.fraud_ip)}
                              disabled={blocking === ring.fraud_ip}
                            >
                              {blocking === ring.fraud_ip ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Block All
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Block Dialog - Mobile Optimized */}
      <AlertDialog
        open={!!confirmBlockIP}
        onOpenChange={() => setConfirmBlockIP(null)}
      >
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span>Confirm Block IP</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm sm:text-base">
              <p className="mb-2">This will:</p>
              <ul className="list-disc ml-4 space-y-1.5">
                <li>
                  Block ALL accounts from IP: 
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs sm:text-sm block mt-1 break-all">
                    {confirmBlockIP}
                  </code>
                </li>
                <li>Reset ALL their balances to 0</li>
                <li>Add the IP to blacklist</li>
                <li>Log the action in fraud logs</li>
              </ul>
              <p className="mt-3 font-medium text-destructive text-sm sm:text-base">
                ⚠️ This action cannot be undone!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto h-11 sm:h-10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto h-11 sm:h-10 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmBlockIP && handleBlockIP(confirmBlockIP)}
            >
              <Ban className="h-4 w-4 mr-2" />
              Block IP & All Accounts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
  }
);

IPFraudReport.displayName = "IPFraudReport";

export { IPFraudReport };
