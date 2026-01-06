import { useEffect, useState } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  RefreshCw,
  MessageSquare,
  Clock,
  Gamepad2,
} from "lucide-react";
import { format } from "date-fns";

interface Appeal {
  id: string;
  game_id: string;
  user_id: string;
  reason: string;
  status: string;
  admin_response: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  game_title?: string;
  username?: string;
  rejection_note?: string;
}

export function AdminAppealsTab() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);

  useEffect(() => {
    loadAppeals();
  }, [statusFilter]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("game_appeals")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: appealsData, error } = await query;

      if (error) throw error;

      if (appealsData && appealsData.length > 0) {
        // Get game and user info
        const gameIds = [...new Set(appealsData.map((a) => a.game_id))];
        const userIds = [...new Set(appealsData.map((a) => a.user_id))];

        const [gamesResult, profilesResult] = await Promise.all([
          supabase.from("uploaded_games").select("id, title, rejection_note").in("id", gameIds),
          supabase.from("profiles").select("id, username").in("id", userIds),
        ]);

        const enrichedAppeals = appealsData.map((appeal) => ({
          ...appeal,
          game_title: gamesResult.data?.find((g) => g.id === appeal.game_id)?.title || "Unknown",
          username: profilesResult.data?.find((p) => p.id === appeal.user_id)?.username || "Unknown",
          rejection_note: gamesResult.data?.find((g) => g.id === appeal.game_id)?.rejection_note,
        }));

        setAppeals(enrichedAppeals);
      } else {
        setAppeals([]);
      }
    } catch (error) {
      console.error("Load appeals error:", error);
      toast.error("Failed to load appeals");
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (appeal: Appeal, action: "approved" | "rejected") => {
    setSelectedAppeal(appeal);
    setReviewAction(action);
    setAdminResponse("");
    setReviewModalOpen(true);
  };

  const handleReview = async () => {
    if (!selectedAppeal || !reviewAction) return;

    setProcessingId(selectedAppeal.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update appeal status
      const { error: appealError } = await supabase
        .from("game_appeals")
        .update({
          status: reviewAction,
          admin_response: adminResponse || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", selectedAppeal.id);

      if (appealError) throw appealError;

      // If approved, also update game status back to pending for re-review
      if (reviewAction === "approved") {
        await supabase
          .from("uploaded_games")
          .update({ 
            status: "pending",
            rejection_note: null 
          })
          .eq("id", selectedAppeal.game_id);

        toast.success("Appeal approved! Game set back to pending for re-review.");
      } else {
        toast.success("Appeal rejected.");
      }

      // Notify user
      await supabase.from("user_notifications").insert({
        user_id: selectedAppeal.user_id,
        notification_type: reviewAction === "approved" ? "appeal_approved" : "appeal_rejected",
        title: reviewAction === "approved" ? "Khiếu nại được chấp nhận" : "Khiếu nại bị từ chối",
        message: reviewAction === "approved"
          ? `Game "${selectedAppeal.game_title}" của bạn đã được đưa vào danh sách chờ duyệt lại.`
          : `Khiếu nại cho game "${selectedAppeal.game_title}" đã bị từ chối. ${adminResponse ? `Lý do: ${adminResponse}` : ""}`,
      });

      setReviewModalOpen(false);
      loadAppeals();
    } catch (error) {
      console.error("Review appeal error:", error);
      toast.error("Failed to process appeal");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = appeals.filter((a) => a.status === "pending").length;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          Game Appeals Management
          {pendingCount > 0 && (
            <Badge variant="destructive">{pendingCount} pending</Badge>
          )}
        </h2>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Appeals</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadAppeals}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{appeals.filter((a) => a.status === "pending").length}</p>
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
                <p className="text-xl font-bold">{appeals.filter((a) => a.status === "approved").length}</p>
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
                <p className="text-xl font-bold">{appeals.filter((a) => a.status === "rejected").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appeals Table */}
      <Card>
        <CardContent className="pt-4">
          {appeals.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No appeals found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Game</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appeals.map((appeal) => (
                    <TableRow key={appeal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Gamepad2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[150px]">
                            {appeal.game_title}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{appeal.username}</TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[200px]">{appeal.reason}</p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            appeal.status === "pending"
                              ? "secondary"
                              : appeal.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {appeal.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                          {appeal.status === "approved" && <CheckCircle className="h-3 w-3 mr-1" />}
                          {appeal.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                          {appeal.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(appeal.created_at), "dd/MM HH:mm")}
                      </TableCell>
                      <TableCell>
                        {appeal.status === "pending" ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-green-600 border-green-600/50 hover:bg-green-600/10"
                              onClick={() => openReviewModal(appeal, "approved")}
                              disabled={processingId === appeal.id}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-red-600 border-red-600/50 hover:bg-red-600/10"
                              onClick={() => openReviewModal(appeal, "rejected")}
                              disabled={processingId === appeal.id}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {appeal.reviewed_at && format(new Date(appeal.reviewed_at), "dd/MM")}
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
      </Card>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === "approved" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              {reviewAction === "approved" ? "Approve Appeal" : "Reject Appeal"}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === "approved"
                ? "Game will be set back to pending for manual re-review."
                : "User will be notified that their appeal was rejected."}
            </DialogDescription>
          </DialogHeader>

          {selectedAppeal && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <p className="text-sm font-medium">Game: {selectedAppeal.game_title}</p>
                <p className="text-sm font-medium">User: {selectedAppeal.username}</p>
                {selectedAppeal.rejection_note && (
                  <div className="p-2 bg-destructive/10 rounded">
                    <p className="text-xs text-destructive">
                      <strong>Original rejection:</strong> {selectedAppeal.rejection_note}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium mb-1">User's appeal reason:</p>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {selectedAppeal.reason}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Admin response (optional):</p>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Add a response to the user..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={!!processingId}
              className={reviewAction === "approved" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processingId ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {reviewAction === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
