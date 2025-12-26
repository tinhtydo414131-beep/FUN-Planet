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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  MessageSquare,
  User,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: string;
  comment_id: string;
  reporter_id: string;
  reporter_username: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  comment_content?: string;
  comment_author?: string;
}

interface AdminReportsTabProps {
  onStatsUpdate: () => void;
}

export function AdminReportsTab({ onStatsUpdate }: AdminReportsTabProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { data: reportsData } = await supabase
        .from("comment_reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (reportsData) {
        // Get reporter usernames
        const reporterIds = [...new Set(reportsData.map((r) => r.reporter_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", reporterIds);

        // Get comment details
        const commentIds = [...new Set(reportsData.map((r) => r.comment_id))];
        const { data: comments } = await supabase
          .from("uploaded_game_comments")
          .select("id, content, user_id")
          .in("id", commentIds);

        // Get comment author usernames
        const commentAuthorIds = comments?.map((c) => c.user_id) || [];
        const { data: commentAuthors } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", commentAuthorIds);

        const reportsWithDetails = reportsData.map((report) => {
          const comment = comments?.find((c) => c.id === report.comment_id);
          return {
            ...report,
            reporter_username:
              profiles?.find((p) => p.id === report.reporter_id)?.username ||
              "Unknown",
            comment_content: comment?.content || "[Deleted]",
            comment_author:
              commentAuthors?.find((p) => p.id === comment?.user_id)?.username ||
              "Unknown",
          };
        });

        setReports(reportsWithDetails);
      }
    } catch (error) {
      console.error("Load reports error:", error);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (report: Report, action: "approved" | "dismissed") => {
    setProcessingId(report.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from("comment_reports")
        .update({
          status: action,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq("id", report.id);

      // If approved, delete the comment
      if (action === "approved") {
        await supabase
          .from("uploaded_game_comments")
          .delete()
          .eq("id", report.comment_id);

        // Log action
        await supabase.from("admin_audit_logs").insert({
          admin_id: user?.id,
          action: "comment_deleted",
          target_type: "comment",
          target_id: report.comment_id,
          details: { reason: report.reason, report_id: report.id },
        });
      }

      // Log review action
      await supabase.from("admin_audit_logs").insert({
        admin_id: user?.id,
        action: `report_${action}`,
        target_type: "report",
        target_id: report.id,
        details: { action },
      });

      toast.success(
        action === "approved"
          ? "Report approved and comment deleted"
          : "Report dismissed"
      );
      loadReports();
      onStatsUpdate();
      setSelectedReport(null);
    } catch (error) {
      console.error("Handle review error:", error);
      toast.error("Failed to process report");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-500/20 text-amber-500">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500/20 text-green-500">Approved</Badge>;
      case "dismissed":
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      spam: "bg-yellow-500/20 text-yellow-500",
      harassment: "bg-red-500/20 text-red-500",
      inappropriate: "bg-orange-500/20 text-orange-500",
      hate_speech: "bg-red-500/20 text-red-500",
      other: "bg-gray-500/20 text-gray-500",
    };
    return (
      <Badge className={colors[reason] || colors.other}>
        {reason.replace("_", " ")}
      </Badge>
    );
  };

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    approved: reports.filter((r) => r.status === "approved").length,
    dismissed: reports.filter((r) => r.status === "dismissed").length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-xl font-bold">{stats.pending}</p>
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
                <p className="text-xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Dismissed</p>
                <p className="text-xl font-bold">{stats.dismissed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Content Reports
              {stats.pending > 0 && (
                <Badge variant="destructive">{stats.pending} pending</Badge>
              )}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadReports}>
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
          ) : reports.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">No reports to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow
                      key={report.id}
                      className={report.status !== "pending" ? "opacity-50" : ""}
                    >
                      <TableCell className="font-medium">
                        {report.reporter_username}
                      </TableCell>
                      <TableCell>{getReasonBadge(report.reason)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {report.comment_content}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {report.comment_author}
                      </TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(report.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {report.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReview(report, "approved")}
                              disabled={processingId === report.id}
                              className="text-green-500 hover:text-green-600"
                            >
                              {processingId === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReview(report, "dismissed")}
                              disabled={processingId === report.id}
                              className="text-gray-500 hover:text-gray-600"
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

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Report Details
            </DialogTitle>
          </DialogHeader>
          {selectedReport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Reporter</p>
                  <p className="font-medium">{selectedReport.reporter_username}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason</p>
                  <p>{getReasonBadge(selectedReport.reason)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Comment Author</p>
                  <p className="font-medium">{selectedReport.comment_author}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reported At</p>
                  <p>{format(new Date(selectedReport.created_at), "dd/MM/yyyy HH:mm")}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Comment Content</p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{selectedReport.comment_content}</p>
                </div>
              </div>

              {selectedReport.details && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Additional Details</p>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">{selectedReport.details}</p>
                  </div>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedReport(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleReview(selectedReport, "dismissed")}
                  disabled={processingId === selectedReport.id}
                >
                  Dismiss
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReview(selectedReport, "approved")}
                  disabled={processingId === selectedReport.id}
                >
                  {processingId === selectedReport.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Comment
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
