import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, ShieldAlert, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface BlacklistedWallet {
  id: string;
  wallet_address: string;
  reason: string;
  added_by: string;
  added_by_username?: string;
  is_active: boolean;
  created_at: string;
}

export function WalletBlacklistTable() {
  const [wallets, setWallets] = useState<BlacklistedWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newWallet, setNewWallet] = useState("");
  const [newReason, setNewReason] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadBlacklist();
  }, []);

  const loadBlacklist = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("wallet_blacklist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Get usernames for added_by
        const adminIds = [...new Set(data.map((d: any) => d.added_by))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", adminIds as string[]);

        const walletsWithUsernames = data.map((wallet: any) => ({
          ...wallet,
          added_by_username:
            profiles?.find((p) => p.id === wallet.added_by)?.username || "Admin",
        }));

        setWallets(walletsWithUsernames);
      }
    } catch (error) {
      console.error("Load blacklist error:", error);
      toast.error("Failed to load blacklist");
    } finally {
      setLoading(false);
    }
  };

  const addToBlacklist = async () => {
    if (!newWallet.trim()) {
      toast.error("Please enter a wallet address");
      return;
    }

    setAdding(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any).from("wallet_blacklist").insert({
        wallet_address: newWallet.trim().toLowerCase(),
        reason: newReason.trim() || "Added by admin",
        added_by: user.id,
      });

      if (error) throw error;

      toast.success("Wallet added to blacklist");
      setNewWallet("");
      setNewReason("");
      setDialogOpen(false);
      loadBlacklist();
    } catch (error: any) {
      console.error("Add to blacklist error:", error);
      toast.error(error.message || "Failed to add wallet");
    } finally {
      setAdding(false);
    }
  };

  const removeFromBlacklist = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("wallet_blacklist")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      toast.success("Wallet removed from blacklist");
      loadBlacklist();
    } catch (error) {
      console.error("Remove from blacklist error:", error);
      toast.error("Failed to remove wallet");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            Wallet Blacklist
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadBlacklist}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Wallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Wallet to Blacklist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <label className="text-sm font-medium">Wallet Address</label>
                    <Input
                      placeholder="0x..."
                      value={newWallet}
                      onChange={(e) => setNewWallet(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reason</label>
                    <Textarea
                      placeholder="Why is this wallet being blacklisted?"
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                    />
                  </div>
                  <Button onClick={addToBlacklist} disabled={adding} className="w-full">
                    {adding ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add to Blacklist
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-8">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No wallets in blacklist</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet Address</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wallets.map((wallet) => (
                  <TableRow key={wallet.id} className={!wallet.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-mono text-sm">
                      {wallet.wallet_address.slice(0, 10)}...{wallet.wallet_address.slice(-8)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{wallet.reason}</TableCell>
                    <TableCell>{wallet.added_by_username}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(wallet.created_at), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {wallet.is_active ? (
                        <Badge variant="destructive">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Removed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {wallet.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromBlacklist(wallet.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
  );
}
