import { useEffect, useState } from "react";
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
  CheckCircle, 
  XCircle, 
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface ApprovalItem {
  id: string;
  user_id: string;
  username: string;
  amount: number;
  reward_type: string;
  status: string;
  created_at: string;
}

interface AdminRewardsTabProps {
  onStatsUpdate: () => void;
}

export function AdminRewardsTab({ onStatsUpdate }: AdminRewardsTabProps) {
  const [approvalQueue, setApprovalQueue] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadApprovalQueue();
  }, []);

  const loadApprovalQueue = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("reward_approval_queue")
        .select(`
          id,
          user_id,
          amount,
          reward_type,
          status,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) {
        // Get usernames
        const userIds = data.map(d => d.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);

        const queueWithUsernames = data.map(item => ({
          ...item,
          username: profiles?.find(p => p.id === item.user_id)?.username || "Unknown"
        }));

        setApprovalQueue(queueWithUsernames);
      }
    } catch (error) {
      console.error("Load approval queue error:", error);
      toast.error("Failed to load approval queue");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    setProcessingId(item.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("reward_approval_queue")
        .update({
          status: "approved",
          approved_by: user?.id,
          processed_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;

      // Add to user's pending rewards
      const { error: rewardError } = await supabase.rpc("add_user_pending_reward", {
        p_user_id: item.user_id,
        p_amount: item.amount,
        p_source: `approved_${item.reward_type}`
      });

      if (rewardError) throw rewardError;

      toast.success(`Approved ${item.amount.toLocaleString()} CAMLY for ${item.username}`);
      loadApprovalQueue();
      onStatsUpdate();
    } catch (error) {
      console.error("Approve error:", error);
      toast.error("Failed to approve reward");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (item: ApprovalItem) => {
    setProcessingId(item.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("reward_approval_queue")
        .update({
          status: "rejected",
          approved_by: user?.id,
          rejection_reason: "Rejected by admin",
          processed_at: new Date().toISOString()
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success(`Rejected reward for ${item.username}`);
      loadApprovalQueue();
      onStatsUpdate();
    } catch (error) {
      console.error("Reject error:", error);
      toast.error("Failed to reject reward");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const pendingCount = approvalQueue.filter(i => i.status === "pending").length;

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-xl font-bold">
                  {approvalQueue.filter(i => i.status === "approved").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-xl font-bold">
                  {approvalQueue.filter(i => i.status === "rejected").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Reward Approval Queue
            {pendingCount > 0 && (
              <Badge variant="destructive">{pendingCount} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : approvalQueue.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No items in approval queue</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalQueue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.username}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.reward_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {item.amount.toLocaleString()} CAMLY
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        {item.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleApprove(item)}
                              disabled={processingId === item.id}
                              className="text-green-500 hover:text-green-600"
                            >
                              {processingId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReject(item)}
                              disabled={processingId === item.id}
                              className="text-red-500 hover:text-red-600"
                            >
                              <XCircle className="h-4 w-4" />
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
    </div>
  );
}
