import { useEffect, useState, forwardRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  Shield,
  Ban,
  CheckCircle,
  Loader2,
  Search,
  RefreshCw,
  Wallet,
  FileWarning,
  Globe,
  UserX
} from "lucide-react";
import { format } from "date-fns";
import { UserBlockModal } from "./UserBlockModal";
import { WalletBlacklistTable } from "./WalletBlacklistTable";
import { ViolationAuditTable } from "./ViolationAuditTable";
import { IPFraudReport } from "./IPFraudReport";
import { IPBlacklistTable } from "./IPBlacklistTable";
import { FraudSuspectsTable } from "./FraudSuspectsTable";

interface SuspiciousActivity {
  id: string;
  user_id: string;
  username: string;
  activity_type: string;
  details: Record<string, any>;
  risk_score: number;
  reviewed: boolean;
  action_taken: string | null;
  created_at: string;
}

interface AdminFraudTabProps {
  onStatsUpdate: () => void;
}

const AdminFraudTab = forwardRef<HTMLDivElement, AdminFraudTabProps>(
  ({ onStatsUpdate }, ref) => {
    const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
    const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  useEffect(() => {
    loadSuspiciousActivities();
  }, []);

  const loadSuspiciousActivities = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("suspicious_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        // Get usernames
        const userIds = [...new Set(data.map(d => d.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        const activitiesWithUsernames = data.map(item => ({
          ...item,
          username: profiles?.find(p => p.id === item.user_id)?.username || "Unknown",
          details: item.details as Record<string, any>
        }));

        setActivities(activitiesWithUsernames);
      }
    } catch (error) {
      console.error("Load suspicious activities error:", error);
      toast.error("Failed to load suspicious activities");
    } finally {
      setLoading(false);
    }
  };

  const runFraudScan = async () => {
    setScanning(true);
    try {
      // Get all users with rewards
      const { data: rewardsData } = await supabase
        .from("user_rewards")
        .select(`
          user_id,
          total_earned,
          pending_amount,
          claimed_amount,
          wallet_address
        `);

      if (!rewardsData) return;

      // Get profiles for wallet comparison
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, wallet_address, email");

      if (!profiles) return;

      const suspiciousUsers: Array<{
        user_id: string;
        activity_type: string;
        details: Record<string, any>;
        risk_score: number;
      }> = [];

      // Check for similar wallet addresses (case variations)
      const walletMap = new Map<string, string[]>();
      profiles.forEach(p => {
        if (p.wallet_address) {
          const lowerWallet = p.wallet_address.toLowerCase();
          if (!walletMap.has(lowerWallet)) {
            walletMap.set(lowerWallet, []);
          }
          walletMap.get(lowerWallet)?.push(p.id);
        }
      });

      // Flag users with same wallet (case-insensitive)
      walletMap.forEach((userIds, wallet) => {
        if (userIds.length > 1) {
          userIds.forEach(userId => {
            suspiciousUsers.push({
              user_id: userId,
              activity_type: "multiple_wallets",
              details: {
                wallet: wallet,
                shared_with: userIds.filter(id => id !== userId)
              },
              risk_score: 80
            });
          });
        }
      });

      // Check for users with unusually high claims
      const avgEarned = rewardsData.reduce((sum, r) => sum + Number(r.total_earned || 0), 0) / rewardsData.length;
      rewardsData.forEach(r => {
        if (Number(r.total_earned) > avgEarned * 5) {
          suspiciousUsers.push({
            user_id: r.user_id,
            activity_type: "high_earnings",
            details: {
              total_earned: r.total_earned,
              average: avgEarned
            },
            risk_score: 60
          });
        }
      });

      // Check for similar email patterns
      const emailPatterns = new Map<string, string[]>();
      profiles.forEach(p => {
        if (p.email) {
          // Get base pattern (remove numbers from username part)
          const basePart = p.email.split("@")[0].replace(/\d+/g, "");
          const domain = p.email.split("@")[1];
          const pattern = `${basePart}@${domain}`;
          if (!emailPatterns.has(pattern)) {
            emailPatterns.set(pattern, []);
          }
          emailPatterns.get(pattern)?.push(p.id);
        }
      });

      emailPatterns.forEach((userIds, pattern) => {
        if (userIds.length >= 3) {
          userIds.forEach(userId => {
            suspiciousUsers.push({
              user_id: userId,
              activity_type: "similar_email",
              details: {
                pattern: pattern,
                count: userIds.length
              },
              risk_score: 50
            });
          });
        }
      });

      // Insert new suspicious activities
      if (suspiciousUsers.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        
        for (const suspicious of suspiciousUsers) {
          // Check if already exists
          const { data: existing } = await supabase
            .from("suspicious_activity_logs")
            .select("id")
            .eq("user_id", suspicious.user_id)
            .eq("activity_type", suspicious.activity_type)
            .eq("reviewed", false)
            .single();

          if (!existing) {
            await supabase
              .from("suspicious_activity_logs")
              .insert({
                user_id: suspicious.user_id,
                activity_type: suspicious.activity_type,
                details: suspicious.details,
                risk_score: suspicious.risk_score
              });
          }
        }
      }

      toast.success(`Scan complete. Found ${suspiciousUsers.length} suspicious activities.`);
      loadSuspiciousActivities();
      onStatsUpdate();
    } catch (error) {
      console.error("Fraud scan error:", error);
      toast.error("Failed to run fraud scan");
    } finally {
      setScanning(false);
    }
  };

  const markAsReviewed = async (activity: SuspiciousActivity, action: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from("suspicious_activity_logs")
        .update({
          reviewed: true,
          reviewed_by: user?.id,
          action_taken: action
        })
        .eq("id", activity.id);

      toast.success("Marked as reviewed");
      loadSuspiciousActivities();
      onStatsUpdate();
    } catch (error) {
      console.error("Mark as reviewed error:", error);
      toast.error("Failed to update");
    }
  };

  const handleBlockFromFraud = async (activity: SuspiciousActivity) => {
    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", activity.user_id)
      .single();

    if (profile) {
      setSelectedUser({
        id: profile.id,
        username: profile.username,
        email: profile.email,
        wallet_address: profile.wallet_address,
        isBlocked: false
      });
      setBlockModalOpen(true);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return <Badge variant="destructive">High Risk</Badge>;
    if (score >= 40) return <Badge className="bg-amber-500/20 text-amber-500">Medium Risk</Badge>;
    return <Badge variant="secondary">Low Risk</Badge>;
  };

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case "multiple_wallets":
        return <Badge variant="destructive">Multiple Wallets</Badge>;
      case "high_earnings":
        return <Badge className="bg-amber-500/20 text-amber-500">High Earnings</Badge>;
      case "similar_email":
        return <Badge className="bg-blue-500/20 text-blue-500">Similar Email</Badge>;
      case "rapid_claims":
        return <Badge className="bg-purple-500/20 text-purple-500">Rapid Claims</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const unreviewedCount = activities.filter(a => !a.reviewed).length;

    return (
      <div ref={ref} className="space-y-4">
        {/* Scan Control */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Fraud Detection System
              </h3>
              <p className="text-sm text-muted-foreground">
                Scan for suspicious activities and multiple wallet abuse
              </p>
            </div>
            <Button onClick={runFraudScan} disabled={scanning}>
              {scanning ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Run Scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different sections */}
      <Tabs defaultValue="suspects" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="suspects" className="flex items-center gap-2">
            <UserX className="h-4 w-4" />
            Suspects
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Activities
            {unreviewedCount > 0 && (
              <Badge variant="destructive" className="ml-1">{unreviewedCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ip-analysis" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            IP Analysis
          </TabsTrigger>
          <TabsTrigger value="violations" className="flex items-center gap-2">
            <FileWarning className="h-4 w-4" />
            Violations
          </TabsTrigger>
          <TabsTrigger value="blacklist" className="flex items-center gap-2">
            <Ban className="h-4 w-4" />
            Blacklist
          </TabsTrigger>
        </TabsList>

        {/* Fraud Suspects Tab */}
        <TabsContent value="suspects" className="space-y-4">
          <FraudSuspectsTable onStatsUpdate={onStatsUpdate} />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Unreviewed</p>
                    <p className="text-xl font-bold">{unreviewedCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Reviewed</p>
                    <p className="text-xl font-bold">
                      {activities.filter(a => a.reviewed).length}
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
                    <p className="text-sm text-muted-foreground">Blocked</p>
                    <p className="text-xl font-bold">
                      {activities.filter(a => a.action_taken === "blocked").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Suspicious Activities Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  Suspicious Activities
                  {unreviewedCount > 0 && (
                    <Badge variant="destructive">{unreviewedCount} new</Badge>
                  )}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={loadSuspiciousActivities}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-muted-foreground">No suspicious activities detected</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Risk</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activities.map((activity) => (
                        <TableRow key={activity.id} className={activity.reviewed ? "opacity-50" : ""}>
                          <TableCell className="font-medium">{activity.username}</TableCell>
                          <TableCell>{getActivityTypeBadge(activity.activity_type)}</TableCell>
                          <TableCell>{getRiskBadge(activity.risk_score)}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {JSON.stringify(activity.details).slice(0, 50)}...
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(activity.created_at), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            {activity.reviewed ? (
                              <Badge variant="secondary">{activity.action_taken || "Reviewed"}</Badge>
                            ) : (
                              <Badge className="bg-amber-500/20 text-amber-500">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!activity.reviewed && (
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleBlockFromFraud(activity)}
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsReviewed(activity, "false_positive")}
                                  className="text-green-500 hover:text-green-600"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IP Analysis Tab */}
        <TabsContent value="ip-analysis" className="space-y-4">
          <IPFraudReport onStatsUpdate={onStatsUpdate} />
          <IPBlacklistTable />
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-4">
          <ViolationAuditTable />
        </TabsContent>

        {/* Blacklist Tab */}
        <TabsContent value="blacklist" className="space-y-4">
          <WalletBlacklistTable />
        </TabsContent>
      </Tabs>

      {/* Block Modal */}
      {selectedUser && (
        <UserBlockModal
          user={selectedUser}
          open={blockModalOpen}
          onClose={() => setBlockModalOpen(false)}
          onSuccess={() => {
            loadSuspiciousActivities();
            onStatsUpdate();
          }}
        />
      )}
    </div>
  );
});

AdminFraudTab.displayName = "AdminFraudTab";

export { AdminFraudTab };
