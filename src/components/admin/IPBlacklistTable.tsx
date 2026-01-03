import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Globe,
  Plus,
  Trash2,
  Loader2,
  RefreshCw,
  Ban,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";

interface BlacklistedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by: string;
  is_active: boolean;
  created_at: string;
  blocker_username?: string;
}

export function IPBlacklistTable() {
  const [blacklist, setBlacklist] = useState<BlacklistedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ip_blacklist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get blocker usernames
      if (data && data.length > 0) {
        const blockerIds = [...new Set(data.map((d) => d.blocked_by).filter(Boolean))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", blockerIds);

        const blacklistWithNames = data.map((item) => ({
          ...item,
          blocker_username:
            profiles?.find((p) => p.id === item.blocked_by)?.username || "System",
        }));

        setBlacklist(blacklistWithNames);
      } else {
        setBlacklist([]);
      }
    } catch (error) {
      console.error("Load IP blacklist error:", error);
      toast.error("Failed to load IP blacklist");
    } finally {
      setLoading(false);
    }
  };

  const handleAddIP = async () => {
    if (!newIP.trim()) {
      toast.error("Please enter an IP address");
      return;
    }
    if (!newReason.trim()) {
      toast.error("Please enter a reason");
      return;
    }

    setAdding(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("ip_blacklist").insert({
        ip_address: newIP.trim(),
        reason: newReason.trim(),
        blocked_by: user?.id,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This IP is already blacklisted");
        } else {
          throw error;
        }
        return;
      }

      toast.success("IP added to blacklist");
      setNewIP("");
      setNewReason("");
      setAddModalOpen(false);
      loadBlacklist();
    } catch (error) {
      console.error("Add IP to blacklist error:", error);
      toast.error("Failed to add IP");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("ip_blacklist")
        .update({ is_active: !currentActive, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast.success(currentActive ? "IP unblocked" : "IP blocked");
      loadBlacklist();
    } catch (error) {
      console.error("Toggle IP active error:", error);
      toast.error("Failed to update IP status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("ip_blacklist").delete().eq("id", id);

      if (error) throw error;

      toast.success("IP removed from blacklist");
      loadBlacklist();
    } catch (error) {
      console.error("Delete IP error:", error);
      toast.error("Failed to delete IP");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ban className="h-5 w-5" />
            IP Blacklist
            <Badge variant="outline">{blacklist.filter((b) => b.is_active).length} active</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadBlacklist}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add IP
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : blacklist.length === 0 ? (
          <div className="text-center py-8">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No IPs in blacklist</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Blocked By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blacklist.map((item) => (
                  <TableRow key={item.id} className={!item.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-sm">{item.ip_address}</TableCell>
                    <TableCell className="max-w-xs truncate">{item.reason}</TableCell>
                    <TableCell>{item.blocker_username}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item.id, item.is_active)}
                          className={item.is_active ? "text-green-500" : "text-red-500"}
                        >
                          {item.is_active ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Add IP Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add IP to Blacklist</DialogTitle>
            <DialogDescription>
              Block an IP address from creating new accounts or claiming rewards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                placeholder="e.g., 192.168.1.1"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Why is this IP being blacklisted?"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddIP} disabled={adding}>
              {adding ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              Add to Blacklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
