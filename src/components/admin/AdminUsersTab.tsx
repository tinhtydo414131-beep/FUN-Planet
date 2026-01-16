import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  Search, 
  Ban, 
  CheckCircle, 
  Eye, 
  Copy,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { UserBlockModal } from "./UserBlockModal";
import { UserDetailModal } from "./UserDetailModal";

interface UserData {
  id: string;
  username: string;
  email: string;
  wallet_address: string | null;
  created_at: string;
  total_earned: number;
  pending_amount: number;
  claimed_amount: number;
  wallet_balance: number;
  camly_balance: number;
  isBlocked: boolean;
  blockReason?: string;
}

interface AdminUsersTabProps {
  onStatsUpdate: () => void;
}

export function AdminUsersTab({ onStatsUpdate }: AdminUsersTabProps) {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const pageSize = 50;

  useEffect(() => {
    loadUsers();
  }, [page, statusFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // First get blocked user IDs
      const { data: blockedData } = await supabase
        .from("admin_blocked_users")
        .select("user_id, reason")
        .eq("status", "blocked");

      const blockedMap = new Map(blockedData?.map(b => [b.user_id, b.reason]) || []);

      // Build query - include wallet_balance
      let query = supabase
        .from("profiles")
        .select("id, username, email, wallet_address, created_at, wallet_balance", { count: "exact" });

      // Apply search
      if (searchQuery) {
        query = query.or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,wallet_address.ilike.%${searchQuery}%`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data: profilesData, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (profilesData) {
        // Get rewards data for these users
        const userIds = profilesData.map(p => p.id);
        const { data: rewardsData } = await supabase
          .from("user_rewards")
          .select("user_id, total_earned, pending_amount, claimed_amount")
          .in("user_id", userIds);

        // Get web3_rewards for camly_balance
        const { data: web3Data } = await supabase
          .from("web3_rewards")
          .select("user_id, camly_balance")
          .in("user_id", userIds);

        const rewardsMap = new Map(rewardsData?.map(r => [r.user_id, r]) || []);
        const web3Map = new Map(web3Data?.map(w => [w.user_id, w]) || []);

        let usersWithData = profilesData.map(profile => ({
          id: profile.id,
          username: profile.username,
          email: profile.email,
          wallet_address: profile.wallet_address,
          created_at: profile.created_at,
          wallet_balance: Number(profile.wallet_balance || 0),
          camly_balance: Number(web3Map.get(profile.id)?.camly_balance || 0),
          total_earned: Number(rewardsMap.get(profile.id)?.total_earned || 0),
          pending_amount: Number(rewardsMap.get(profile.id)?.pending_amount || 0),
          claimed_amount: Number(rewardsMap.get(profile.id)?.claimed_amount || 0),
          isBlocked: blockedMap.has(profile.id),
          blockReason: blockedMap.get(profile.id)
        }));

        // Filter by status
        if (statusFilter === "blocked") {
          usersWithData = usersWithData.filter(u => u.isBlocked);
        } else if (statusFilter === "active") {
          usersWithData = usersWithData.filter(u => !u.isBlocked);
        }

        setUsers(usersWithData);
        setTotalUsers(count || 0);
        setTotalPages(Math.ceil((count || 0) / pageSize));
      }
    } catch (error) {
      console.error("Load users error:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Copied to clipboard");
  };

  const handleBlockUser = (user: UserData) => {
    setSelectedUser(user);
    setBlockModalOpen(true);
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const handleUnblockUser = async (user: UserData) => {
    try {
      const { error } = await supabase
        .from("admin_blocked_users")
        .update({ 
          status: "unblocked",
          unblocked_at: new Date().toISOString()
        })
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(`Unblocked ${user.username}`);
      loadUsers();
      onStatsUpdate();
    } catch (error) {
      console.error("Unblock error:", error);
      toast.error("Failed to unblock user");
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const truncateAddress = (address: string) => {
    if (!address) return "-";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by username, email, or wallet..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            Users
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {totalUsers.toLocaleString()} users
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.wallet_address ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-sm">
                                {truncateAddress(user.wallet_address)}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => handleCopyAddress(user.wallet_address!)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-sm">{formatNumber(user.wallet_balance)}</span>
                            {user.wallet_balance !== user.camly_balance && (
                              <span className="text-xs text-amber-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                CAMLY: {formatNumber(user.camly_balance)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-amber-500">
                          {formatNumber(user.pending_amount)}
                        </TableCell>
                        <TableCell>
                          {user.isBlocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewUser(user)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {user.isBlocked ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleUnblockUser(user)}
                                className="text-green-500 hover:text-green-600"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleBlockUser(user)}
                                className="text-red-500 hover:text-red-600"
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalUsers)} of {totalUsers.toLocaleString()} users • Page {page}/{totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {selectedUser && (
        <>
          <UserBlockModal
            user={selectedUser}
            open={blockModalOpen}
            onClose={() => setBlockModalOpen(false)}
            onSuccess={() => {
              loadUsers();
              onStatsUpdate();
            }}
          />
          <UserDetailModal
            user={selectedUser}
            open={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            onDataRefresh={() => {
              loadUsers();
              onStatsUpdate();
            }}
          />
        </>
      )}
    </div>
  );
}
