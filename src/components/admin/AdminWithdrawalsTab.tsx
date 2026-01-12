import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  CheckCircle, XCircle, Clock, AlertTriangle, 
  Search, RefreshCw, Wallet, Shield, ExternalLink,
  TrendingUp, TrendingDown, Send, RotateCcw, Coins
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string;
  status: string;
  trust_score: number;
  auto_approved: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  tx_hash: string | null;
  created_at: string;
  completed_at: string | null;
  username?: string;
  avatar_url?: string;
}

interface WithdrawalStats {
  pending_count: number;
  pending_amount: number;
  approved_today: number;
  rejected_today: number;
  completed_today: number;
  total_sent_today: number;
}

interface RewardWalletBalance {
  camly_balance: number;
  bnb_balance: number;
  wallet_address: string;
  checked_at: string;
}

export const AdminWithdrawalsTab = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<WithdrawalStats>({
    pending_count: 0,
    pending_amount: 0,
    approved_today: 0,
    rejected_today: 0,
    completed_today: 0,
    total_sent_today: 0
  });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [walletBalance, setWalletBalance] = useState<RewardWalletBalance | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('withdrawal_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;

      // Fetch user info for each withdrawal
      const userIds = [...new Set(data?.map(w => w.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enrichedWithdrawals = data?.map(w => ({
        ...w,
        username: profileMap.get(w.user_id)?.username || 'Unknown',
        avatar_url: profileMap.get(w.user_id)?.avatar_url
      })) || [];

      setWithdrawals(enrichedWithdrawals);

      // Calculate stats
      const allData = await supabase
        .from('withdrawal_requests')
        .select('*')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const today = allData.data || [];
      setStats({
        pending_count: today.filter(w => w.status === 'pending').length,
        pending_amount: today.filter(w => w.status === 'pending').reduce((sum, w) => sum + Number(w.amount), 0),
        approved_today: today.filter(w => w.status === 'approved').length,
        rejected_today: today.filter(w => w.status === 'rejected').length,
        completed_today: today.filter(w => w.status === 'completed').length,
        total_sent_today: today.filter(w => w.status === 'completed').reduce((sum, w) => sum + Number(w.amount), 0)
      });
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    setLoadingBalance(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-reward-wallet-balance');
      if (error) throw error;
      if (data?.success) {
        setWalletBalance(data);
      } else {
        throw new Error(data?.error || 'Failed to fetch balance');
      }
    } catch (error: any) {
      console.error('Error fetching wallet balance:', error);
      toast.error('Failed to fetch reward wallet balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    fetchWalletBalance();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('withdrawal_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'withdrawal_requests'
      }, () => {
        fetchWithdrawals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  const handleRetryFailed = async (withdrawal: WithdrawalRequest) => {
    setRetryingId(withdrawal.id);
    try {
      // Update status to 'approved' first
      const { error: updateError } = await supabase
        .from('withdrawal_requests')
        .update({ status: 'approved' })
        .eq('id', withdrawal.id);

      if (updateError) throw updateError;

      toast.info('Retrying withdrawal transfer...');
      
      // Call the edge function to process the transfer
      const { data: transferResult, error: transferError } = await supabase.functions.invoke('process-approved-withdrawal', {
        body: { withdrawal_id: withdrawal.id }
      });

      if (transferError) {
        toast.error('Retry failed: ' + transferError.message);
      } else if (transferResult?.success) {
        toast.success(`Transfer complete! TX: ${transferResult.tx_hash?.slice(0, 10)}...`);
        fetchWalletBalance(); // Refresh balance after successful transfer
      } else {
        toast.error('Transfer failed: ' + (transferResult?.error || 'Unknown error'));
      }

      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error retrying withdrawal:', error);
      toast.error(error.message || 'Failed to retry withdrawal');
    } finally {
      setRetryingId(null);
    }
  };

  const handleApprove = async (withdrawal: WithdrawalRequest) => {
    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('admin_approve_pending_withdrawal', {
        p_withdrawal_id: withdrawal.id,
        p_admin_id: user.id
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Unknown error');

      toast.success('Withdrawal approved! Processing blockchain transfer...');
      
      // Call the edge function to process the transfer
      const { data: transferResult, error: transferError } = await supabase.functions.invoke('process-approved-withdrawal', {
        body: { withdrawal_id: withdrawal.id }
      });

      if (transferError) {
        toast.error('Approved but transfer failed: ' + transferError.message);
      } else if (transferResult?.success) {
        toast.success(`Transfer complete! TX: ${transferResult.tx_hash.slice(0, 10)}...`);
      }

      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error approving withdrawal:', error);
      toast.error(error.message || 'Failed to approve withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('admin_reject_pending_withdrawal', {
        p_withdrawal_id: selectedWithdrawal.id,
        p_admin_id: user.id,
        p_reason: rejectReason
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Unknown error');

      toast.success('Withdrawal rejected');
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedWithdrawal(null);
      fetchWithdrawals();
    } catch (error: any) {
      console.error('Error rejecting withdrawal:', error);
      toast.error(error.message || 'Failed to reject withdrawal');
    } finally {
      setProcessing(false);
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500 bg-green-500/10';
    if (score >= 40) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30"><Send className="h-3 w-3 mr-1" /> Processing</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30"><AlertTriangle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => 
    w.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Reward Wallet Balance Card */}
      <Card className={`border-2 ${walletBalance && walletBalance.camly_balance < 1000000 ? 'border-red-500 bg-red-500/5' : 'border-green-500/30 bg-green-500/5'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              Reward Wallet Balance
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchWalletBalance} 
              disabled={loadingBalance}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loadingBalance ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {walletBalance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${walletBalance.camly_balance < 1000000 ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                  <Coins className={`h-6 w-6 ${walletBalance.camly_balance < 1000000 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CAMLY Balance</p>
                  <p className={`text-2xl font-bold ${walletBalance.camly_balance < 1000000 ? 'text-red-500' : 'text-green-500'}`}>
                    {walletBalance.camly_balance.toLocaleString()}
                  </p>
                  {walletBalance.camly_balance < 1000000 && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low balance! Please recharge
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${walletBalance.bnb_balance < 0.01 ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
                  <Wallet className={`h-6 w-6 ${walletBalance.bnb_balance < 0.01 ? 'text-red-500' : 'text-blue-500'}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">BNB (Gas)</p>
                  <p className={`text-2xl font-bold ${walletBalance.bnb_balance < 0.01 ? 'text-red-500' : 'text-blue-500'}`}>
                    {walletBalance.bnb_balance.toFixed(4)}
                  </p>
                  {walletBalance.bnb_balance < 0.01 && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low gas! Add BNB
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-purple-500/20">
                  <ExternalLink className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Wallet Address</p>
                  <a 
                    href={`https://bscscan.com/address/${walletBalance.wallet_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-purple-500 hover:underline"
                  >
                    {walletBalance.wallet_address.slice(0, 10)}...{walletBalance.wallet_address.slice(-8)}
                  </a>
                  <p className="text-xs text-muted-foreground">
                    Updated: {format(new Date(walletBalance.checked_at), 'HH:mm:ss')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {loadingBalance ? 'Loading wallet balance...' : 'Click refresh to load balance'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-yellow-500/10 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-bold text-yellow-500">{stats.pending_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Pending Amount</p>
                <p className="text-lg font-bold text-orange-500">{stats.pending_amount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Approved Today</p>
                <p className="text-xl font-bold text-blue-500">{stats.approved_today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Rejected Today</p>
                <p className="text-xl font-bold text-red-500">{stats.rejected_today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-xl font-bold text-green-500">{stats.completed_today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Sent</p>
                <p className="text-lg font-bold text-purple-500">{stats.total_sent_today.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Withdrawal Requests
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user or wallet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <Button variant="outline" size="icon" onClick={fetchWithdrawals} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'pending', 'approved', 'completed', 'rejected', 'failed'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'pending' && stats.pending_count > 0 && (
                  <Badge className="ml-1 bg-yellow-500">{stats.pending_count}</Badge>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredWithdrawals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No withdrawal requests found</div>
            ) : (
              filteredWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {withdrawal.avatar_url ? (
                        <img src={withdrawal.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                      ) : (
                        <Wallet className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{withdrawal.username}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {withdrawal.wallet_address.slice(0, 8)}...{withdrawal.wallet_address.slice(-6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(withdrawal.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-lg">{Number(withdrawal.amount).toLocaleString()} CAMLY</p>
                      <div className="flex items-center gap-2">
                        <Badge className={getTrustScoreColor(withdrawal.trust_score)}>
                          <Shield className="h-3 w-3 mr-1" />
                          Trust: {withdrawal.trust_score}
                        </Badge>
                        {withdrawal.auto_approved && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 text-xs">Auto</Badge>
                        )}
                      </div>
                    </div>
                    
                    {getStatusBadge(withdrawal.status)}

                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(withdrawal)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setShowRejectDialog(true);
                          }}
                          disabled={processing}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}

                    {withdrawal.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRetryFailed(withdrawal)}
                        disabled={retryingId === withdrawal.id}
                        className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                      >
                        <RotateCcw className={`h-4 w-4 mr-1 ${retryingId === withdrawal.id ? 'animate-spin' : ''}`} />
                        {retryingId === withdrawal.id ? 'Retrying...' : 'Retry'}
                      </Button>
                    )}

                    {withdrawal.tx_hash && (
                      <a
                        href={`https://bscscan.com/tx/${withdrawal.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this withdrawal request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">User: <span className="font-medium">{selectedWithdrawal?.username}</span></p>
              <p className="text-sm">Amount: <span className="font-medium">{selectedWithdrawal?.amount.toLocaleString()} CAMLY</span></p>
              <p className="text-sm">Trust Score: <span className="font-medium">{selectedWithdrawal?.trust_score}</span></p>
            </div>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={processing || !rejectReason.trim()}
            >
              {processing ? 'Processing...' : 'Reject Withdrawal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
