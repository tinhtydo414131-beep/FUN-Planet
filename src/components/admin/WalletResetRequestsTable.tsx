import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  RefreshCw, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Key,
  MessageCircle
} from "lucide-react";
import { format } from "date-fns";

interface WalletResetRequest {
  id: string;
  user_id: string;
  username: string;
  current_wallet: string | null;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface WalletResetRequestsTableProps {
  onStatsUpdate?: () => void;
}

export function WalletResetRequestsTable({ onStatsUpdate }: WalletResetRequestsTableProps) {
  const [requests, setRequests] = useState<WalletResetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<WalletResetRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">("approve");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wallet_reset_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        // Get usernames
        const userIds = [...new Set(data.map((d) => d.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        const requestsWithUsernames = data.map((item) => ({
          ...item,
          username: profiles?.find((p) => p.id === item.user_id)?.username || "Unknown",
        }));

        setRequests(requestsWithUsernames);
      }
    } catch (error) {
      console.error("Load wallet reset requests error:", error);
      toast.error("Failed to load wallet reset requests");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (request: WalletResetRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setDialogAction(action);
    setAdminNotes("");
    setDialogOpen(true);
  };

  const handleProcessRequest = async () => {
    if (!selectedRequest) return;

    setProcessing(selectedRequest.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const newStatus = dialogAction === "approve" ? "approved" : "rejected";
      
      const { error } = await supabase
        .from("wallet_reset_requests")
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      // If approved, reset wallet change count and unlink wallet
      if (dialogAction === "approve") {
        // Delete old wallet history entries for this user to reset their count
        // Using rpc to avoid type issues
        await supabase.rpc('log_wallet_connection', {
          p_user_id: selectedRequest.user_id,
          p_wallet_address: 'RESET_BY_ADMIN',
          p_previous_wallet: selectedRequest.current_wallet
        });

        // Clear wallet address from profiles so they can link a new one
        await supabase
          .from("profiles")
          .update({ wallet_address: null })
          .eq("id", selectedRequest.user_id);

        // Also clear from other tables
        await supabase
          .from("web3_rewards")
          .update({ wallet_address: null })
          .eq("user_id", selectedRequest.user_id);
          
        await supabase
          .from("user_rewards")
          .update({ wallet_address: null })
          .eq("user_id", selectedRequest.user_id);

        toast.success("Request approved! User can now link a new wallet.");
      } else {
        toast.success("Request rejected.");
      }

      setDialogOpen(false);
      loadRequests();
      onStatsUpdate?.();
    } catch (error) {
      console.error("Process wallet reset request error:", error);
      toast.error("Failed to process request");
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-500">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const shortenAddress = (address: string | null) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Wallet Reset Requests
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadRequests}>
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
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No wallet reset requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Wallet</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.username}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {shortenAddress(request.current_wallet)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {request.reason}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(request.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell className="text-right">
                      {request.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(request, "approve")}
                            className="text-green-500 hover:text-green-600"
                            disabled={processing === request.id}
                          >
                            {processing === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(request, "reject")}
                            className="text-red-500 hover:text-red-600"
                            disabled={processing === request.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {request.status !== "pending" && request.admin_notes && (
                        <span className="text-xs text-muted-foreground">
                          {request.admin_notes.slice(0, 30)}...
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Confirm Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? "Approve" : "Reject"} Wallet Reset Request
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm">
                    <strong>User:</strong> {selectedRequest.username}
                  </p>
                  <p className="text-sm">
                    <strong>Current Wallet:</strong>{" "}
                    {shortenAddress(selectedRequest.current_wallet)}
                  </p>
                  <p className="text-sm">
                    <strong>Reason:</strong> {selectedRequest.reason}
                  </p>
                </div>
                {dialogAction === "approve" && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      ⚠️ Approving will reset the user's wallet change count and unlink their
                      current wallet, allowing them to connect a new one.
                    </p>
                  </div>
                )}
                <Textarea
                  placeholder="Add notes (optional)..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={dialogAction === "approve" ? "default" : "destructive"}
              onClick={handleProcessRequest}
              disabled={!!processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : dialogAction === "approve" ? (
                <CheckCircle className="h-4 w-4 mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {dialogAction === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
