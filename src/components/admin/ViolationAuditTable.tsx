import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { RefreshCw, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ViolationSummary {
  user_id: string;
  username: string;
  total_deducted: number;
  web3_previous: number | null;
  web3_new: number | null;
  profile_previous: number | null;
  profile_new: number | null;
  corrections_count: number;
  last_corrected: string;
}

export function ViolationAuditTable() {
  const [violations, setViolations] = useState<ViolationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadViolations();
  }, []);

  const loadViolations = async () => {
    setLoading(true);
    try {
      // Get fraud logs for duplicate ranking claims
      const { data: fraudLogs } = await supabase
        .from("fraud_logs")
        .select("*")
        .eq("fraud_type", "duplicate_ranking_claim")
        .order("resolved_at", { ascending: false });

      if (fraudLogs && fraudLogs.length > 0) {
        // Get unique user IDs
        const userIds = [...new Set(fraudLogs.map(f => f.user_id))];
        
        // Get profiles with usernames and current wallet_balance
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, wallet_balance")
          .in("id", userIds);

        // Get current web3_rewards balances
        const { data: web3Rewards } = await supabase
          .from("web3_rewards")
          .select("user_id, camly_balance")
          .in("user_id", userIds);

        // Group by user and aggregate
        const userMap = new Map<string, ViolationSummary>();
        
        for (const log of fraudLogs) {
          const existing = userMap.get(log.user_id);
          const balances = parseBalances(log.action_taken || "");
          const isProfileCorrection = log.description?.includes("profiles.wallet_balance");
          
          if (!existing) {
            userMap.set(log.user_id, {
              user_id: log.user_id,
              username: profiles?.find(p => p.id === log.user_id)?.username || "Unknown",
              total_deducted: Number(log.amount_affected || 0),
              web3_previous: isProfileCorrection ? null : balances.previous,
              web3_new: isProfileCorrection ? null : balances.new,
              profile_previous: isProfileCorrection ? balances.previous : null,
              profile_new: isProfileCorrection ? balances.new : null,
              corrections_count: 1,
              last_corrected: log.resolved_at || log.detected_at || ""
            });
          } else {
            // Update with the latest correction info
            if (isProfileCorrection) {
              existing.profile_previous = balances.previous;
              existing.profile_new = balances.new;
            } else {
              existing.web3_previous = balances.previous;
              existing.web3_new = balances.new;
            }
            existing.corrections_count++;
            // Keep the most recent date
            const existingDate = new Date(existing.last_corrected);
            const newDate = new Date(log.resolved_at || log.detected_at || "");
            if (newDate > existingDate) {
              existing.last_corrected = log.resolved_at || log.detected_at || "";
            }
          }
        }

        // Calculate total deducted per user (use first log's amount since it's the same)
        const summaries = Array.from(userMap.values()).map(summary => {
          // Get current balances for verification
          const profile = profiles?.find(p => p.id === summary.user_id);
          const web3 = web3Rewards?.find(w => w.user_id === summary.user_id);
          
          return {
            ...summary,
            // Use actual current balances if available
            profile_new: profile?.wallet_balance ?? summary.profile_new,
            web3_new: web3?.camly_balance ?? summary.web3_new
          };
        });

        setViolations(summaries);
      } else {
        setViolations([]);
      }
    } catch (error) {
      console.error("Error loading violations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Parse action_taken to get before/after balances
  const parseBalances = (actionTaken: string) => {
    const previousMatch = actionTaken?.match(/Previous:\s*([\d.]+)/);
    const newMatch = actionTaken?.match(/New:\s*([\d.]+)/);
    return {
      previous: previousMatch ? Number(previousMatch[1]) : null,
      new: newMatch ? Number(newMatch[1]) : null
    };
  };

  const uniqueUsers = violations.length;
  const totalDeducted = violations.reduce((sum, v) => sum + v.total_deducted, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Violation Audit Log
            {uniqueUsers > 0 && (
              <Badge variant="destructive">{uniqueUsers} users corrected</Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadViolations}>
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
        ) : violations.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No violations found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Amount Deducted</TableHead>
                  <TableHead className="text-center">
                    <div className="flex flex-col">
                      <span>Web3 Balance</span>
                      <span className="text-xs text-muted-foreground">(Before → After)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex flex-col">
                      <span>Profile Balance</span>
                      <span className="text-xs text-muted-foreground">(Before → After)</span>
                    </div>
                  </TableHead>
                  <TableHead>Corrected At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((violation) => (
                  <TableRow key={violation.user_id}>
                    <TableCell className="font-medium">{violation.username}</TableCell>
                    <TableCell className="text-red-500 font-bold">
                      -{violation.total_deducted.toLocaleString()} CAMLY
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-muted-foreground">
                          {violation.web3_previous !== null 
                            ? violation.web3_previous.toLocaleString() 
                            : "N/A"}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-bold text-green-600">
                          {violation.web3_new !== null 
                            ? violation.web3_new.toLocaleString() 
                            : "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-muted-foreground">
                          {violation.profile_previous !== null 
                            ? violation.profile_previous.toLocaleString() 
                            : "N/A"}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-bold text-green-600">
                          {violation.profile_new !== null 
                            ? violation.profile_new.toLocaleString() 
                            : "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {violation.last_corrected 
                        ? format(new Date(violation.last_corrected), "dd/MM/yyyy HH:mm")
                        : "N/A"
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {violations.length > 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Users Corrected</p>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total CAMLY Deducted</p>
                <p className="text-2xl font-bold text-red-500">
                  -{totalDeducted.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Correction</p>
                <p className="text-lg font-medium">
                  {violations[0]?.last_corrected 
                    ? format(new Date(violations[0].last_corrected), "dd/MM/yyyy HH:mm")
                    : "N/A"
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
