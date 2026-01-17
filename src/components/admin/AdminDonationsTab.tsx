import { useState, useEffect, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { HeartHandshake, ExternalLink, Loader2, RefreshCw, Wallet, CheckCircle, Clock, Send } from "lucide-react";
import { formatCamly } from "@/lib/web3";

interface Donation {
  id: string;
  user_id: string;
  amount: number;
  donation_type: string;
  is_onchain: boolean;
  tx_hash: string | null;
  created_at: string;
  username?: string;
}

interface DonationStats {
  total: number;
  internal: number;
  onchain: number;
  totalAmount: number;
  internalAmount: number;
  onchainAmount: number;
}

const DONATION_WALLET = "0xaBeB558CC6D34e56eaDB53D248872bEd1e7b77be";

const AdminDonationsTab = forwardRef<HTMLDivElement>((_, ref) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [stats, setStats] = useState<DonationStats>({
    total: 0, internal: 0, onchain: 0,
    totalAmount: 0, internalAmount: 0, onchainAmount: 0
  });
  const [filter, setFilter] = useState<'all' | 'internal' | 'onchain'>('all');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState(false);

  useEffect(() => {
    loadDonations();
  }, []);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch usernames
      const userIds = [...new Set((data || []).map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      const usernameMap = new Map(profiles?.map(p => [p.id, p.username]) || []);
      
      const donationsWithUsernames = (data || []).map(d => ({
        ...d,
        username: usernameMap.get(d.user_id) || 'Unknown'
      }));

      setDonations(donationsWithUsernames);

      // Calculate stats
      const internal = donationsWithUsernames.filter(d => !d.is_onchain);
      const onchain = donationsWithUsernames.filter(d => d.is_onchain);
      
      setStats({
        total: donationsWithUsernames.length,
        internal: internal.length,
        onchain: onchain.length,
        totalAmount: donationsWithUsernames.reduce((s, d) => s + d.amount, 0),
        internalAmount: internal.reduce((s, d) => s + d.amount, 0),
        onchainAmount: onchain.reduce((s, d) => s + d.amount, 0)
      });
    } catch (error) {
      console.error('Failed to load donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const processDonation = async (donationId: string) => {
    setProcessing(donationId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('process-donation-onchain', {
        body: { donation_id: donationId }
      });

      if (response.error) throw response.error;
      
      const result = response.data;
      if (result.success) {
        toast.success(`Donation processed! TX: ${result.results[0]?.tx_hash?.slice(0, 10)}...`);
        loadDonations();
      } else {
        toast.error(result.error || 'Failed to process donation');
      }
    } catch (error: any) {
      console.error('Process donation error:', error);
      toast.error(error.message || 'Failed to process donation');
    } finally {
      setProcessing(null);
    }
  };

  const processAllInternal = async () => {
    const internalCount = donations.filter(d => !d.is_onchain).length;
    if (internalCount === 0) {
      toast.info('No internal donations to process');
      return;
    }

    if (!confirm(`Process ${internalCount} internal donations on-chain?\nTotal: ${formatCamly(stats.internalAmount)} CAMLY`)) {
      return;
    }

    setProcessingAll(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Not authenticated');
        return;
      }

      const response = await supabase.functions.invoke('process-donation-onchain', {
        body: { process_all: true }
      });

      if (response.error) throw response.error;
      
      const result = response.data;
      if (result.success) {
        toast.success(`Processed ${result.processed}/${internalCount} donations on-chain!`);
        if (result.failed > 0) {
          toast.warning(`${result.failed} donations failed`);
        }
        loadDonations();
      } else {
        toast.error(result.error || 'Failed to process donations');
      }
    } catch (error: any) {
      console.error('Process all error:', error);
      toast.error(error.message || 'Failed to process donations');
    } finally {
      setProcessingAll(false);
    }
  };

  const filteredDonations = donations.filter(d => {
    if (filter === 'internal') return !d.is_onchain;
    if (filter === 'onchain') return d.is_onchain;
    return true;
  });

  return (
    <div ref={ref} className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-pink-500" />
              Total Donations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">{formatCamly(stats.totalAmount)} CAMLY</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Internal (Pending)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.internal}</div>
            <p className="text-xs text-muted-foreground">{formatCamly(stats.internalAmount)} CAMLY</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              On-chain (Done)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.onchain}</div>
            <p className="text-xs text-muted-foreground">{formatCamly(stats.onchainAmount)} CAMLY</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              Donation Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a 
              href={`https://bscscan.com/address/${DONATION_WALLET}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              {DONATION_WALLET.slice(0, 8)}...{DONATION_WALLET.slice(-6)}
              <ExternalLink className="h-3 w-3" />
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="internal">Internal ({stats.internal})</TabsTrigger>
            <TabsTrigger value="onchain">On-chain ({stats.onchain})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadDonations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {stats.internal > 0 && (
            <Button 
              size="sm" 
              onClick={processAllInternal}
              disabled={processingAll}
              className="bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
            >
              {processingAll ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Process All Internal ({stats.internal})
            </Button>
          )}
        </div>
      </div>

      {/* Donations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>TX Hash</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredDonations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No donations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDonations.map((donation) => (
                  <TableRow key={donation.id}>
                    <TableCell className="font-medium">{donation.username}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCamly(donation.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={donation.donation_type === 'onchain' ? 'default' : 'secondary'}>
                        {donation.donation_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {donation.is_onchain ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          On-chain
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-500/30">
                          <Clock className="h-3 w-3 mr-1" />
                          Internal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {donation.tx_hash ? (
                        <a
                          href={`https://bscscan.com/tx/${donation.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs flex items-center gap-1"
                        >
                          {donation.tx_hash.slice(0, 10)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {!donation.is_onchain && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => processDonation(donation.id)}
                          disabled={processing === donation.id}
                        >
                          {processing === donation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Process
                            </>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
});

AdminDonationsTab.displayName = "AdminDonationsTab";

export { AdminDonationsTab };
