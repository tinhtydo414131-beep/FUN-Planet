import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  Diamond, Wallet, ArrowRight, Loader2, CheckCircle2, ExternalLink, 
  Shield, AlertCircle, Heart, Sparkles, Zap, Copy, Gift
} from 'lucide-react';
import { toast } from 'sonner';
import { useClaimToWallet } from '@/hooks/useClaimToWallet';
import { useWeb3Rewards } from '@/hooks/useWeb3Rewards';
import { CAMLY_CONTRACT_ADDRESS } from '@/lib/web3';

interface SmoothClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  camlyBalance: number;
}

const CHARITY_PERCENTAGE = 11;
const CHART_COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981'];

export const SmoothClaimModal = ({
  isOpen,
  onClose,
  camlyBalance,
}: SmoothClaimModalProps) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'input' | 'confirm' | 'processing' | 'success'>('input');
  const [txHash, setTxHash] = useState('');
  const [charityAmount, setCharityAmount] = useState(0);
  const [userAmount, setUserAmount] = useState(0);
  
  const { isClaiming, claimBalanceToWallet, celebrateClaim, triggerHaptic } = useClaimToWallet();
  const { walletAddress } = useWeb3Rewards();

  // Calculate amounts when input changes
  useEffect(() => {
    const inputAmount = parseFloat(amount) || 0;
    const charity = Math.floor(inputAmount * (CHARITY_PERCENTAGE / 100));
    setCharityAmount(charity);
    setUserAmount(inputAmount - charity);
  }, [amount]);

  // Chart data for distribution
  const chartData = [
    { name: 'Bạn nhận', value: userAmount, color: '#8B5CF6' },
    { name: 'Từ thiện 11%', value: charityAmount, color: '#EC4899' },
  ].filter(d => d.value > 0);

  const handleClaim = async () => {
    const claimAmount = parseFloat(amount);
    if (isNaN(claimAmount) || claimAmount <= 0) {
      toast.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    if (claimAmount > camlyBalance) {
      toast.error('Số dư không đủ');
      return;
    }

    triggerHaptic();
    setStep('confirm');
  };

  const confirmClaim = async () => {
    triggerHaptic();
    setStep('processing');

    const result = await claimBalanceToWallet(parseFloat(amount));
    
    if (result.success && result.txHash) {
      setTxHash(result.txHash);
      celebrateClaim();
      setStep('success');
      toast.success(`🎉 Đã nhận ${userAmount.toLocaleString()} CAMLY vào ví!`);
    } else {
      toast.error(result.error || 'Có lỗi xảy ra');
      setStep('input');
    }
  };

  const handleClose = () => {
    setStep('input');
    setAmount('');
    setTxHash('');
    onClose();
  };

  const shortenAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã copy!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <Diamond className="w-8 h-8 text-cyan-400 animate-pulse" />
            Rút CAMLY về Ví
          </DialogTitle>
          <DialogDescription className="text-center">
            CHA GROK - Nhận tiền mượt mà, siêu nhanh! 🚀
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              {/* Balance display */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Số dư khả dụng</span>
                  <motion.span 
                    key={camlyBalance}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-bold text-yellow-500"
                  >
                    {camlyBalance.toLocaleString()} CAMLY
                  </motion.span>
                </div>
              </div>

              {/* Wallet address */}
              {walletAddress && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-muted">
                  <Wallet className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-muted-foreground">Rút về:</span>
                  <span className="font-mono text-sm font-medium">{shortenAddress(walletAddress)}</span>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-6 w-6 ml-auto"
                    onClick={() => copyToClipboard(walletAddress)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Amount input */}
              <div className="space-y-3">
                <Label htmlFor="amount" className="text-base">Số tiền muốn rút</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Nhập số CAMLY"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-20 text-xl h-14 font-bold"
                    max={camlyBalance}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 font-bold"
                    onClick={() => setAmount(camlyBalance.toString())}
                  >
                    MAX
                  </Button>
                </div>
                
                {parseFloat(amount) > camlyBalance && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Số dư không đủ
                  </p>
                )}
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2">
                {[10000, 50000, 100000, 500000].filter(a => a <= camlyBalance).map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs font-bold"
                    onClick={() => setAmount(quickAmount.toString())}
                  >
                    {quickAmount >= 1000 ? `${quickAmount / 1000}K` : quickAmount}
                  </Button>
                ))}
              </div>

              {/* Distribution preview */}
              {parseFloat(amount) > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-xl bg-muted/30 border"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium">Phân phối:</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Bạn nhận</p>
                      <p className="text-lg font-bold text-primary">{userAmount.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-pink-500/10">
                      <p className="text-xs text-muted-foreground mb-1">Từ thiện 11%</p>
                      <p className="text-lg font-bold text-pink-500">{charityAmount.toLocaleString()}</p>
                    </div>
                  </div>

                  {chartData.length > 0 && (
                    <div className="h-24 mt-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={40}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => `${value.toLocaleString()} CAMLY`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Security notice */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <Shield className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <p className="font-medium text-blue-600 dark:text-blue-400">Giao dịch an toàn</p>
                  <p className="text-muted-foreground mt-1">
                    Ký xác nhận trong ví, không mất phí gas.
                  </p>
                </div>
              </div>

              {/* Claim button */}
              <Button
                onClick={handleClaim}
                disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > camlyBalance}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 shadow-xl active:scale-95 transition-all"
              >
                <Wallet className="w-5 h-5 mr-2" />
                Tiếp tục
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Contract info */}
              <div className="text-xs text-center text-muted-foreground space-y-1">
                <p>CAMLY Token (BSC):</p>
                <a
                  href={`https://bscscan.com/token/${CAMLY_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                >
                  {shortenAddress(CAMLY_CONTRACT_ADDRESS)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 py-4 text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                <Gift className="w-10 h-10 text-yellow-500" />
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Xác nhận rút tiền</h3>
                <p className="text-muted-foreground text-sm">
                  Bạn sẽ nhận <strong className="text-primary">{userAmount.toLocaleString()} CAMLY</strong> vào ví
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  ({charityAmount.toLocaleString()} CAMLY dành cho từ thiện 💝)
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('input')} 
                  className="flex-1"
                >
                  Quay lại
                </Button>
                <Button 
                  onClick={confirmClaim}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Xác nhận
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center mb-6"
              >
                <Diamond className="w-10 h-10 text-cyan-400" />
              </motion.div>
              
              <h3 className="text-xl font-bold mb-2">Đang xử lý...</h3>
              <p className="text-muted-foreground text-sm">
                Vui lòng ký xác nhận trong ví của bạn
              </p>
              
              <div className="flex justify-center gap-1 mt-4">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-primary"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6 text-center space-y-6"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center"
              >
                <CheckCircle2 className="w-14 h-14 text-green-500" />
              </motion.div>

              <div>
                <motion.h3 
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  className="text-2xl font-bold text-green-500 mb-2"
                >
                  Thành công! 🎉
                </motion.h3>
                <p className="text-muted-foreground">
                  Đã nhận <strong className="text-green-500">{userAmount.toLocaleString()} CAMLY</strong> vào ví!
                </p>
              </div>

              {/* Charity highlight */}
              <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/30">
                <div className="flex items-center justify-center gap-2 text-pink-500">
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">
                    {charityAmount.toLocaleString()} CAMLY đã được quyên góp từ thiện 💝
                  </span>
                </div>
              </div>

              {/* Transaction hash */}
              {txHash && (
                <div className="p-4 bg-muted/30 rounded-xl space-y-2">
                  <p className="text-xs text-muted-foreground">Transaction Hash:</p>
                  <div className="flex items-center gap-2 justify-center">
                    <code className="text-xs font-mono">{txHash.slice(0, 20)}...</code>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(txHash)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <a 
                      href={`https://bscscan.com/tx/${txHash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button size="icon" variant="ghost" className="h-6 w-6">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleClose} 
                className="w-full bg-gradient-to-r from-primary to-cyan-500"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Hoàn tất
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default SmoothClaimModal;
