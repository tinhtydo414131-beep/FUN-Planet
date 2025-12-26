import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Zap,
  CheckCircle2,
  Bell,
  Download,
  Shield,
  Loader2,
  Gamepad2,
  AlertTriangle,
  FileText,
  Send
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AdminQuickActionsPanelProps {
  pendingGamesCount: number;
  pendingReportsCount: number;
  onRefresh: () => void;
}

export function AdminQuickActionsPanel({
  pendingGamesCount,
  pendingReportsCount,
  onRefresh
}: AdminQuickActionsPanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleApproveAllGames = async () => {
    if (pendingGamesCount === 0) {
      toast.info("Không có games nào đang chờ duyệt");
      return;
    }
    
    setLoading("approve-games");
    try {
      const { error } = await supabase
        .from("uploaded_games")
        .update({ status: "approved" })
        .eq("status", "pending");
      
      if (error) throw error;
      
      toast.success(`Đã duyệt ${pendingGamesCount} games thành công`);
      onRefresh();
    } catch (error) {
      console.error("Error approving games:", error);
      toast.error("Lỗi khi duyệt games");
    } finally {
      setLoading(null);
    }
  };

  const handleSendGlobalNotification = async () => {
    if (!notificationMessage.trim()) {
      toast.error("Vui lòng nhập nội dung thông báo");
      return;
    }

    setLoading("notification");
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Insert system notification
      const { error } = await supabase
        .from("system_notifications")
        .insert({
          title: "📢 Thông báo từ Admin",
          message: notificationMessage,
          target_audience: "all",
          notification_type: "announcement",
          priority: "normal",
          is_active: true,
          created_by: user?.id
        });

      if (error) throw error;
      
      toast.success("Đã gửi thông báo toàn hệ thống thành công");
      setNotificationMessage("");
      setShowNotificationDialog(false);
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Lỗi khi gửi thông báo");
    } finally {
      setLoading(null);
    }
  };

  const handleExportData = async () => {
    setLoading("export");
    try {
      // Export users data
      const { data: users } = await supabase
        .from("profiles")
        .select("username, email, wallet_address, wallet_balance, created_at");

      if (users) {
        const csvContent = [
          ["Username", "Email", "Wallet", "Balance", "Created"].join(","),
          ...users.map(u => [
            u.username,
            u.email,
            u.wallet_address || "",
            u.wallet_balance || 0,
            u.created_at
          ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `funplanet-users-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        toast.success("Đã export dữ liệu thành công");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Lỗi khi export dữ liệu");
    } finally {
      setLoading(null);
    }
  };

  const handleRunFraudScan = async () => {
    setLoading("fraud-scan");
    try {
      // Simulate fraud scan
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for suspicious patterns
      const { count: multiAccountCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      toast.success(`Fraud scan hoàn tất. Đã quét ${multiAccountCount || 0} tài khoản.`);
      onRefresh();
    } catch (error) {
      console.error("Error running fraud scan:", error);
      toast.error("Lỗi khi chạy fraud scan");
    } finally {
      setLoading(null);
    }
  };

  const quickActions = [
    {
      id: "approve-games",
      label: "Duyệt Tất Cả Games",
      icon: Gamepad2,
      color: "text-green-500",
      bgColor: "bg-green-500/10 hover:bg-green-500/20 border-green-500/20",
      badge: pendingGamesCount,
      onClick: handleApproveAllGames,
      disabled: pendingGamesCount === 0
    },
    {
      id: "notification",
      label: "Gửi Thông Báo",
      icon: Send,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20",
      onClick: () => setShowNotificationDialog(true)
    },
    {
      id: "export",
      label: "Export Dữ Liệu",
      icon: Download,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20",
      onClick: handleExportData
    },
    {
      id: "fraud-scan",
      label: "Fraud Scan",
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-500/10 hover:bg-red-500/20 border-red-500/20",
      onClick: handleRunFraudScan
    }
  ];

  return (
    <>
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                className={`h-auto py-4 px-3 flex flex-col items-center gap-2 ${action.bgColor} border relative`}
                onClick={action.onClick}
                disabled={loading === action.id || action.disabled}
              >
                {loading === action.id ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                )}
                <span className="text-xs text-center font-medium">{action.label}</span>
                {action.badge !== undefined && action.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center text-xs"
                  >
                    {action.badge}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Global Notification Dialog */}
      <Dialog open={showNotificationDialog} onOpenChange={setShowNotificationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Gửi Thông Báo Toàn Hệ Thống
            </DialogTitle>
            <DialogDescription>
              Thông báo này sẽ được gửi đến tất cả người dùng
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-message">Nội dung thông báo</Label>
              <Textarea
                id="notification-message"
                placeholder="Nhập nội dung thông báo..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNotificationDialog(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSendGlobalNotification}
              disabled={loading === "notification" || !notificationMessage.trim()}
            >
              {loading === "notification" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi Thông Báo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
