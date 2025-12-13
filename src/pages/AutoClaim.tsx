import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, CheckCircle, AlertCircle, RefreshCw, Wallet, ArrowDownLeft } from "lucide-react";
import { toast } from "sonner";
import { useTransactionNotifications } from "@/hooks/useTransactionNotifications";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface WalletTransaction {
  id: string;
  amount: number;
  token_type: string;
  from_user_id: string;
  to_user_id: string;
  transaction_hash: string;
  status: string;
  created_at: string;
  transaction_type: string;
}

const AutoClaim = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoClaimEnabled, setIsAutoClaimEnabled] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Enable real-time notifications
  useTransactionNotifications(user?.id, {
    onNewTransaction: () => {
      fetchTransactions();
    }
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWalletAddress();
      fetchTransactions();
    }
  }, [user]);

  const fetchWalletAddress = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();
    
    if (!error && data) {
      setWalletAddress(data.wallet_address);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("to_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchTransactions();
    toast.success("Đã cập nhật danh sách giao dịch");
    setIsRefreshing(false);
  };

  const triggerManualScan = async () => {
    try {
      toast.loading("Đang quét blockchain...", { id: "scan" });
      
      const { data, error } = await supabase.functions.invoke("watch-camly-transfers", {
        body: { manual: true }
      });
      
      if (error) throw error;
      
      toast.success("Quét blockchain hoàn tất!", { id: "scan" });
      await fetchTransactions();
    } catch (error) {
      console.error("Error triggering scan:", error);
      toast.error("Lỗi khi quét blockchain", { id: "scan" });
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount);
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              Automatic Money Transfer Claim
            </h1>
            <p className="text-muted-foreground mt-2">
              Tự động nhận CAMLY token khi có người chuyển tiền cho bạn
            </p>
          </div>

          {/* Status Card */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-pink-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Trạng thái Auto Claim
              </CardTitle>
              <CardDescription>
                Hệ thống sẽ tự động phát hiện và ghi nhận các giao dịch CAMLY gửi đến ví của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${isAutoClaimEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                  <span className="font-medium">
                    {isAutoClaimEnabled ? 'Đang hoạt động' : 'Đã tắt'}
                  </span>
                </div>
                <Switch
                  checked={isAutoClaimEnabled}
                  onCheckedChange={setIsAutoClaimEnabled}
                />
              </div>

              {walletAddress ? (
                <div className="p-4 bg-background/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Wallet className="w-4 h-4" />
                    Ví đang theo dõi
                  </div>
                  <code className="text-sm font-mono text-foreground break-all">
                    {walletAddress}
                  </code>
                </div>
              ) : (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    <span>Bạn chưa kết nối ví. Vui lòng kết nối ví để sử dụng Auto Claim.</span>
                  </div>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => navigate("/wallet")}
                  >
                    Kết nối ví ngay
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  disabled={isRefreshing}
                  className="flex-1"
                >
                  {isRefreshing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Làm mới
                </Button>
                <Button 
                  onClick={triggerManualScan}
                  className="flex-1 bg-gradient-to-r from-primary to-pink-500 hover:from-primary/90 hover:to-pink-500/90"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Quét blockchain
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-green-500" />
                Giao dịch đã nhận
              </CardTitle>
              <CardDescription>
                Danh sách các giao dịch CAMLY đã được tự động ghi nhận
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowDownLeft className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Chưa có giao dịch nào được ghi nhận</p>
                  <p className="text-sm mt-1">Khi có người chuyển CAMLY cho bạn, giao dịch sẽ xuất hiện ở đây</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className="p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ArrowDownLeft className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <div className="font-medium text-green-500">
                              +{formatAmount(tx.amount)} {tx.token_type}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Từ: {shortenAddress(tx.from_user_id)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={tx.status === 'completed' ? 'default' : 'secondary'}
                            className={tx.status === 'completed' ? 'bg-green-500' : ''}
                          >
                            {tx.status === 'completed' ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> Hoàn thành</>
                            ) : (
                              tx.status
                            )}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(tx.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
                          </div>
                        </div>
                      </div>
                      {tx.transaction_hash && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <a
                            href={`https://bscscan.com/tx/${tx.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline font-mono"
                          >
                            TX: {shortenAddress(tx.transaction_hash)}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Cách hoạt động</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Hệ thống tự động quét blockchain mỗi 60 giây để phát hiện giao dịch mới</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Khi có CAMLY được gửi đến ví của bạn, hệ thống sẽ tự động ghi nhận</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Bạn sẽ nhận được thông báo và hiệu ứng pháo hoa khi có tiền về</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Số dư Fun Wallet sẽ được cập nhật tự động</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AutoClaim;
