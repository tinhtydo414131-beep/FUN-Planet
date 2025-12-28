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
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { History, Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface WalletHistoryItem {
  id: string;
  user_id: string;
  username?: string;
  wallet_address: string;
  previous_wallet: string | null;
  action: string;
  created_at: string;
}

export function WalletHistoryTable() {
  const [history, setHistory] = useState<WalletHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("wallet_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data) {
        // Get usernames
        const userIds = [...new Set(data.map((d: any) => d.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds as string[]);

        const historyWithUsernames = data.map((item: any) => ({
          ...item,
          username: profiles?.find((p) => p.id === item.user_id)?.username || "Unknown",
        }));

        setHistory(historyWithUsernames);
      }
    } catch (error) {
      console.error("Load wallet history error:", error);
      toast.error("Failed to load wallet history");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "connected":
        return <Badge className="bg-green-500/20 text-green-500">Connected</Badge>;
      case "changed":
        return <Badge className="bg-amber-500/20 text-amber-500">Changed</Badge>;
      case "disconnected":
        return <Badge variant="secondary">Disconnected</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const truncateWallet = (wallet: string | null) => {
    if (!wallet) return "—";
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Wallet History
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadHistory}>
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
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No wallet history recorded</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Wallet Change</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.username}</TableCell>
                    <TableCell>{getActionBadge(item.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-mono text-sm">
                        {item.previous_wallet ? (
                          <>
                            <span className="text-muted-foreground">
                              {truncateWallet(item.previous_wallet)}
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="text-foreground">
                              {truncateWallet(item.wallet_address)}
                            </span>
                          </>
                        ) : (
                          <span className="text-foreground">
                            {truncateWallet(item.wallet_address)}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy HH:mm")}
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
