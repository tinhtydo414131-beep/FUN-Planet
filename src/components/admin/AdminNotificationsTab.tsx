import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bell,
  Send,
  Plus,
  Trash2,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
  Users,
  AlertCircle,
  Info,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  target_audience: string;
  notification_type: string;
  priority: string;
  scheduled_at: string | null;
  sent_at: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

export function AdminNotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingWeekly, setSendingWeekly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    target_audience: "all",
    notification_type: "info",
    priority: "normal",
  });

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("system_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      setNotifications(data || []);
    } catch (error) {
      console.error("Load notifications error:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast.error("Title and message are required");
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("system_notifications").insert({
        title: formData.title,
        message: formData.message,
        target_audience: formData.target_audience,
        notification_type: formData.notification_type,
        priority: formData.priority,
        sent_at: new Date().toISOString(),
        created_by: user?.id,
      });

      if (error) throw error;

      // Log action
      await supabase.from("admin_audit_logs").insert({
        admin_id: user?.id,
        action: "notification_sent",
        target_type: "notification",
        details: {
          title: formData.title,
          target: formData.target_audience,
        },
      });

      toast.success("Notification sent successfully!");
      setFormData({
        title: "",
        message: "",
        target_audience: "all",
        notification_type: "info",
        priority: "normal",
      });
      setDialogOpen(false);
      loadNotifications();
    } catch (error) {
      console.error("Send notification error:", error);
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thông báo này?")) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from("system_notifications")
        .update({ is_active: false })
        .eq("id", id);

      await supabase.from("admin_audit_logs").insert({
        admin_id: user?.id,
        action: "notification_deleted",
        target_type: "notification",
        target_id: id,
      });

      toast.success("Notification deleted");
      loadNotifications();
    } catch (error) {
      console.error("Delete notification error:", error);
      toast.error("Failed to delete notification");
    }
  };

  const sendWeeklySummary = async () => {
    if (!confirm("Gửi Weekly Summary cho tất cả users có hoạt động tuần qua?")) return;
    
    setSendingWeekly(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-weekly-summary");
      
      if (error) throw error;
      
      toast.success(`Đã gửi ${data?.summaries?.length || 0} weekly summaries!`);
    } catch (error) {
      console.error("Send weekly summary error:", error);
      toast.error("Failed to send weekly summaries");
    } finally {
      setSendingWeekly(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const icons = {
      info: <Info className="h-3 w-3" />,
      warning: <AlertTriangle className="h-3 w-3" />,
      success: <CheckCircle className="h-3 w-3" />,
      maintenance: <AlertCircle className="h-3 w-3" />,
    };
    const colors = {
      info: "bg-blue-500/20 text-blue-500",
      warning: "bg-amber-500/20 text-amber-500",
      success: "bg-green-500/20 text-green-500",
      maintenance: "bg-red-500/20 text-red-500",
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || "bg-gray-500/20"}>
        {icons[type as keyof typeof icons]}
        <span className="ml-1 capitalize">{type}</span>
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: "bg-gray-500/20 text-gray-500",
      normal: "bg-blue-500/20 text-blue-500",
      high: "bg-amber-500/20 text-amber-500",
      urgent: "bg-red-500/20 text-red-500",
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.normal}>
        {priority}
      </Badge>
    );
  };

  const getAudienceBadge = (audience: string) => {
    const labels = {
      all: "Everyone",
      new_users: "New Users",
      active_users: "Active Users",
      parents: "Parents",
      children: "Children",
    };
    return <Badge variant="outline">{labels[audience as keyof typeof labels] || audience}</Badge>;
  };

  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.sent_at).length,
    scheduled: notifications.filter((n) => n.scheduled_at && !n.sent_at).length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-xl font-bold">{stats.sent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Scheduled</p>
                <p className="text-xl font-bold">{stats.scheduled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-2">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={sendWeeklySummary}
              disabled={sendingWeekly}
            >
              {sendingWeekly ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Weekly Summary
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  New Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Create Notification
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Notification title..."
                    />
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                      placeholder="Notification message..."
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Target</Label>
                      <Select
                        value={formData.target_audience}
                        onValueChange={(v) =>
                          setFormData({ ...formData, target_audience: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Everyone</SelectItem>
                          <SelectItem value="new_users">New Users</SelectItem>
                          <SelectItem value="active_users">Active Users</SelectItem>
                          <SelectItem value="parents">Parents</SelectItem>
                          <SelectItem value="children">Children</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={formData.notification_type}
                        onValueChange={(v) =>
                          setFormData({ ...formData, notification_type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(v) =>
                          setFormData({ ...formData, priority: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={sendNotification} disabled={sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send Now
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              System Notifications
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadNotifications}>
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
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications
                    .filter((n) => n.is_active)
                    .map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {notification.message}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(notification.notification_type)}
                        </TableCell>
                        <TableCell>
                          {getPriorityBadge(notification.priority)}
                        </TableCell>
                        <TableCell>
                          {getAudienceBadge(notification.target_audience)}
                        </TableCell>
                        <TableCell>
                          {notification.sent_at ? (
                            <Badge className="bg-green-500/20 text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Sent
                            </Badge>
                          ) : notification.scheduled_at ? (
                            <Badge className="bg-amber-500/20 text-amber-500">
                              <Clock className="h-3 w-3 mr-1" />
                              Scheduled
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(notification.created_at), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
