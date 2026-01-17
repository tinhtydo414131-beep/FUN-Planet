import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  UserX,
  Wallet,
  Clock,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { UserBlockModal } from "./UserBlockModal";

interface FraudSuspect {
  user_id: string;
  username: string;
  email: string;
  wallet_address: string;
  wallet_balance: number;
  is_fraud_suspect: boolean;
  fraud_suspect_reason: string | null;
  fraud_detected_at: string | null;
  created_at: string;
}

interface FraudSuspectsTableProps {
  onStatsUpdate?: () => void;
}

export const FraudSuspectsTable = React.forwardRef<HTMLDivElement, FraudSuspectsTableProps>(
  ({ onStatsUpdate }, ref) => {
    const [suspects, setSuspects] = useState<FraudSuspect[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    useEffect(() => {
      loadFraudSuspects();
    }, []);

    const loadFraudSuspects = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("get_fraud_suspects");

        if (error) throw error;

        setSuspects(data || []);
      } catch (error) {
        console.error("Load fraud suspects error:", error);
        toast.error("Failed to load fraud suspects");
      } finally {
        setLoading(false);
      }
    };

    const scanAllUsers = async () => {
      setScanning(true);
      try {
        // Get all users
        const { data: users, error } = await supabase
          .from("profiles")
          .select("id")
          .order("created_at", { ascending: false });

        if (error) throw error;

        let markedCount = 0;
        for (const user of users || []) {
          const { data: isFraud } = await supabase.rpc("check_and_mark_fraud_suspect", {
            p_user_id: user.id
          });
          if (isFraud) markedCount++;
        }

        toast.success(`Scan complete. Marked ${markedCount} fraud suspects.`);
        loadFraudSuspects();
        onStatsUpdate?.();
      } catch (error) {
        console.error("Scan error:", error);
        toast.error("Failed to scan users");
      } finally {
        setScanning(false);
      }
    };

    const clearFraudFlag = async (userId: string) => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            is_fraud_suspect: false,
            fraud_suspect_reason: null,
            fraud_detected_at: null
          })
          .eq("id", userId);

        if (error) throw error;

        toast.success("Fraud flag cleared");
        loadFraudSuspects();
        onStatsUpdate?.();
      } catch (error) {
        console.error("Clear fraud flag error:", error);
        toast.error("Failed to clear fraud flag");
      }
    };

    const handleBlockUser = (suspect: FraudSuspect) => {
      setSelectedUser({
        id: suspect.user_id,
        username: suspect.username,
        email: suspect.email,
        wallet_address: suspect.wallet_address,
        isBlocked: false
      });
      setBlockModalOpen(true);
    };

    const formatBalance = (balance: number) => {
      return new Intl.NumberFormat("vi-VN").format(balance);
    };

    const getReasonBadges = (reason: string | null) => {
      if (!reason) return null;
      
      const reasons = reason.split(";").filter(r => r.trim());
      return reasons.map((r, i) => {
        const trimmed = r.trim();
        let variant: "destructive" | "secondary" | "outline" = "secondary";
        if (trimmed.includes("Blocked")) variant = "destructive";
        else if (trimmed.includes("blacklist")) variant = "destructive";
        
        return (
          <Badge key={i} variant={variant} className="mr-1 mb-1 text-xs">
            {trimmed}
          </Badge>
        );
      });
    };

    return (
      <Card ref={ref}>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              Fraud Suspects
              {suspects.length > 0 && (
                <Badge variant="destructive">{suspects.length}</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadFraudSuspects} 
                disabled={loading}
                className="h-10 sm:h-9 px-3 sm:px-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                size="sm" 
                onClick={scanAllUsers} 
                disabled={scanning}
                className="h-10 sm:h-9 px-3 sm:px-4"
              >
                {scanning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Scan All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : suspects.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No fraud suspects detected</p>
              <p className="text-sm text-muted-foreground mt-1">
                Run a scan to check for suspicious users
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block sm:hidden space-y-3">
                {suspects.map((suspect) => (
                  <Card key={suspect.user_id} className="bg-red-50/50 dark:bg-red-900/10 border-red-200/50">
                    <CardContent className="p-4">
                      {/* User Info */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{suspect.username || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground truncate">{suspect.email}</p>
                        </div>
                      </div>

                      {/* Wallet & Balance */}
                      <div className="flex items-center gap-2 mb-3">
                        <Wallet className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs font-mono truncate">
                          {suspect.wallet_address 
                            ? `${suspect.wallet_address.slice(0, 8)}...${suspect.wallet_address.slice(-6)}`
                            : "Not connected"}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-amber-600 text-sm">
                          {formatBalance(suspect.wallet_balance)} CAMLY
                        </span>
                        {suspect.fraud_detected_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(suspect.fraud_detected_at), "dd/MM HH:mm")}
                          </div>
                        )}
                      </div>

                      {/* Reasons */}
                      {suspect.fraud_suspect_reason && (
                        <div className="flex flex-wrap mb-3">
                          {getReasonBadges(suspect.fraud_suspect_reason)}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleBlockUser(suspect)}
                          className="flex-1 h-10"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearFraudFlag(suspect.user_id)}
                          className="flex-1 h-10 text-green-600 border-green-300 hover:bg-green-50"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Detected At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suspects.map((suspect) => (
                      <TableRow key={suspect.user_id} className="bg-red-50/50 dark:bg-red-900/10">
                        <TableCell>
                          <div>
                            <p className="font-medium">{suspect.username || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{suspect.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Wallet className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-mono">
                              {suspect.wallet_address 
                                ? `${suspect.wallet_address.slice(0, 6)}...${suspect.wallet_address.slice(-4)}`
                                : "Not connected"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-amber-600">
                            {formatBalance(suspect.wallet_balance)} CAMLY
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="flex flex-wrap">
                            {getReasonBadges(suspect.fraud_suspect_reason)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {suspect.fraud_detected_at ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(suspect.fraud_detected_at), "dd/MM/yyyy HH:mm")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBlockUser(suspect)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-100"
                              title="Block User"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearFraudFlag(suspect.user_id)}
                              className="text-green-500 hover:text-green-600 hover:bg-green-100"
                              title="Clear Fraud Flag"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>

        {/* Block Modal */}
        {selectedUser && (
          <UserBlockModal
            user={selectedUser}
            open={blockModalOpen}
            onClose={() => setBlockModalOpen(false)}
            onSuccess={() => {
              loadFraudSuspects();
              onStatsUpdate?.();
            }}
          />
        )}
      </Card>
    );
  }
);

FraudSuspectsTable.displayName = "FraudSuspectsTable";
