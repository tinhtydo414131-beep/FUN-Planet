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

interface FraudLog {
  id: string;
  user_id: string;
  username: string;
  fraud_type: string;
  description: string;
  amount_affected: number;
  action_taken: string;
  resolved_at: string;
}

export function ViolationAuditTable() {
  const [violations, setViolations] = useState<FraudLog[]>([]);
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
        // Get usernames
        const userIds = [...new Set(fraudLogs.map(f => f.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        const withUsernames = fraudLogs.map(log => ({
          ...log,
          username: profiles?.find(p => p.id === log.user_id)?.username || "Unknown"
        }));

        setViolations(withUsernames);
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Violation Audit Log
            {violations.length > 0 && (
              <Badge variant="destructive">{violations.length} corrected</Badge>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Amount Deducted</TableHead>
                  <TableHead>Previous Balance</TableHead>
                  <TableHead>New Balance</TableHead>
                  <TableHead>Corrected At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((violation) => {
                  const balances = parseBalances(violation.action_taken || "");
                  return (
                    <TableRow key={violation.id}>
                      <TableCell className="font-medium">{violation.username}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          Duplicate Claim
                        </Badge>
                      </TableCell>
                      <TableCell className="text-red-500 font-bold">
                        -{Number(violation.amount_affected || 0).toLocaleString()} CAMLY
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {balances.previous !== null ? balances.previous.toLocaleString() : "N/A"}
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {balances.new !== null ? balances.new.toLocaleString() : "N/A"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {violation.resolved_at 
                          ? format(new Date(violation.resolved_at), "dd/MM/yyyy HH:mm")
                          : "N/A"
                        }
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                <p className="text-2xl font-bold">{violations.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total CAMLY Deducted</p>
                <p className="text-2xl font-bold text-red-500">
                  -{violations.reduce((sum, v) => sum + Number(v.amount_affected || 0), 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Correction</p>
                <p className="text-lg font-medium">
                  {violations[0]?.resolved_at 
                    ? format(new Date(violations[0].resolved_at), "dd/MM/yyyy")
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
