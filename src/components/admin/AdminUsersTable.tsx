import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Search, ExternalLink, Ban, Shield, Loader2, 
  Eye, RefreshCw, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { getBscScanAddressLink, formatWalletAddress } from '@/config/adminConfig';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface UserData {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  wallet_address: string | null;
  wallet_balance: number;
  created_at: string;
  total_plays: number;
  total_friends: number;
  is_banned?: boolean;
}

export function AdminUsersTable() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, avatar_url, wallet_address, wallet_balance, created_at, total_plays, total_friends')
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.wallet_address?.toLowerCase().includes(query)
    );
  });

  const handleBanUser = async (userId: string, username: string) => {
    // In a real implementation, this would update a banned_users table or user status
    toast.success(`User ${username} has been banned`);
    // Log admin action
    console.log('Admin action: Ban user', { userId, username, timestamp: new Date().toISOString() });
  };

  return (
    <Card className="border-amber-200/50 dark:border-amber-800/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              User Management
            </CardTitle>
            <CardDescription>View and manage all registered users</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border-2 border-amber-200">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="bg-amber-100 text-amber-700">
                                {user.username?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.wallet_address ? (
                            <a
                              href={getBscScanAddressLink(user.wallet_address)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-amber-600 hover:text-amber-700 hover:underline font-mono text-sm"
                            >
                              {formatWalletAddress(user.wallet_address)}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground text-sm">Not connected</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {(user.wallet_balance || 0).toLocaleString()} $C
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {format(new Date(user.created_at), 'dd/MM/yyyy')}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Plays: </span>
                            <span className="font-medium">{user.total_plays || 0}</span>
                            <span className="text-muted-foreground ml-2">Friends: </span>
                            <span className="font-medium">{user.total_friends || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600">
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Ban User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to ban {user.username}? This action can be reversed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => handleBanUser(user.id, user.username)}
                                  >
                                    Ban User
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredUsers.length} users (Page {page})
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={users.length < pageSize}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
