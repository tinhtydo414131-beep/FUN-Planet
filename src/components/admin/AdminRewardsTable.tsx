import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { 
  Coins, Search, CheckCircle, ExternalLink, Loader2, 
  RefreshCw, AlertTriangle, Wallet, TrendingUp
} from 'lucide-react';
import { getBscScanAddressLink, getBscScanTxLink, formatWalletAddress } from '@/config/adminConfig';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RewardData {
  user_id: string;
  wallet_address: string | null;
  pending_amount: number;
  claimed_amount: number;
  total_earned: number;
  last_claim_at: string | null;
  profile?: {
    username: string;
    avatar_url: string | null;
  };
}

interface PendingClaim {
  id: string;
  user_id: string;
  amount: number;
  claim_type: string;
  status: string;
  wallet_address: string;
  created_at: string;
  profile?: {
    username: string;
  };
}

export function AdminRewardsTable() {
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [pendingClaims, setPendingClaims] = useState<PendingClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PendingClaim | null>(null);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalDistributed: 0,
    walletBalance: 0,
    largePendingClaims: 0
  });

  const fetchRewards = async () => {
    setLoading(true);
    try {
      // Fetch user rewards
      const { data: rewardsData } = await supabase
        .from('user_rewards')
        .select('user_id, wallet_address, pending_amount, claimed_amount, total_earned, last_claim_at')
        .order('pending_amount', { ascending: false })
        .limit(100);

      if (rewardsData) {
        const userIds = [...new Set(rewardsData.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .in('id', userIds);

        setRewards(rewardsData.map(r => ({
          ...r,
          profile: profiles?.find(p => p.id === r.user_id)
        })));

        // Calculate stats
        const totalPending = rewardsData.reduce((sum, r) => sum + (r.pending_amount || 0), 0);
        const totalDistributed = rewardsData.reduce((sum, r) => sum + (r.claimed_amount || 0), 0);

        setStats(prev => ({
          ...prev,
          totalPending,
          totalDistributed
        }));
      }

      // Fetch pending claims (large amounts > 100k)
      const { data: claimsData } = await supabase
        .from('camly_claims')
        .select('id, user_id, amount, claim_type, status, wallet_address, created_at')
        .eq('status', 'pending')
        .order('amount', { ascending: false })
        .limit(50);

      if (claimsData) {
        const userIds = [...new Set(claimsData.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', userIds);

        setPendingClaims(claimsData.map(c => ({
          ...c,
          profile: profiles?.find(p => p.id === c.user_id)
        })));

        const largeClaims = claimsData.filter(c => c.amount > 100000);
        setStats(prev => ({
          ...prev,
          largePendingClaims: largeClaims.length
        }));
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
      toast.error('Failed to load rewards data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleApproveClaim = async () => {
    if (!selectedClaim) return;

    try {
      const { error } = await supabase
        .from('camly_claims')
        .update({ status: 'approved', parent_approved_at: new Date().toISOString() })
        .eq('id', selectedClaim.id);

      if (error) throw error;

      setPendingClaims(claims => claims.filter(c => c.id !== selectedClaim.id));
      toast.success(`Claim of ${selectedClaim.amount.toLocaleString()} $C approved!`);
    } catch (error) {
      toast.error('Failed to approve claim');
    } finally {
      setApproveDialogOpen(false);
      setSelectedClaim(null);
    }
  };

  const filteredRewards = rewards.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      r.wallet_address?.toLowerCase().includes(query) ||
      r.profile?.username?.toLowerCase().includes(query)
    );
  });

  const largePendingClaims = pendingClaims.filter(c => c.amount > 100000);

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-amber-200/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Coins className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Pending</p>
                  <p className="text-xl font-bold">{(stats.totalPending / 1000000).toFixed(2)}M $C</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Distributed</p>
                  <p className="text-xl font-bold">{(stats.totalDistributed / 1000000).toFixed(2)}M $C</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Reward Wallet</p>
                  <p className="text-xl font-bold">Check BSC</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Large Claims</p>
                  <p className="text-xl font-bold">{stats.largePendingClaims}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Large Pending Claims Alert */}
        {largePendingClaims.length > 0 && (
          <Card className="border-orange-300 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                Large Claims Pending Approval (&gt;100k $C)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {largePendingClaims.map((claim) => (
                      <TableRow key={claim.id}>
                        <TableCell>{claim.profile?.username || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge className="bg-orange-500 font-mono">
                            {claim.amount.toLocaleString()} $C
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{claim.claim_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <a
                            href={getBscScanAddressLink(claim.wallet_address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-600 hover:underline font-mono text-sm flex items-center gap-1"
                          >
                            {formatWalletAddress(claim.wallet_address)}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </TableCell>
                        <TableCell>
                          {format(new Date(claim.created_at), 'dd/MM HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                            onClick={() => {
                              setSelectedClaim(claim);
                              setApproveDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Rewards Table */}
        <Card className="border-amber-200/50 dark:border-amber-800/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-500" />
                  User Rewards Overview
                </CardTitle>
                <CardDescription>Track pending and claimed rewards by user</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by wallet or username..."
                    className="pl-9 w-[250px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={fetchRewards} disabled={loading}>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Wallet</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Claimed</TableHead>
                      <TableHead>Total Earned</TableHead>
                      <TableHead>Last Claim</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRewards.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No rewards data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRewards.map((reward) => (
                        <TableRow key={reward.user_id}>
                          <TableCell>
                            <span className="font-medium">{reward.profile?.username || 'Unknown'}</span>
                          </TableCell>
                          <TableCell>
                            {reward.wallet_address ? (
                              <a
                                href={getBscScanAddressLink(reward.wallet_address)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-amber-600 hover:underline font-mono text-sm flex items-center gap-1"
                              >
                                {formatWalletAddress(reward.wallet_address)}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {(reward.pending_amount || 0).toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500 font-mono">
                              {(reward.claimed_amount || 0).toLocaleString()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono font-medium">
                              {(reward.total_earned || 0).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            {reward.last_claim_at ? (
                              format(new Date(reward.last_claim_at), 'dd/MM HH:mm')
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Large Claim</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve a claim of{' '}
              <span className="font-bold text-amber-500">
                {selectedClaim?.amount.toLocaleString()} $CAMLY
              </span>{' '}
              for user {selectedClaim?.profile?.username}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-500 hover:bg-green-600"
              onClick={handleApproveClaim}
            >
              Approve Claim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
