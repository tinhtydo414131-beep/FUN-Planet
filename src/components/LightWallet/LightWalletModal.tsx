import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Wallet, Gem, Sparkles, Gift, Gamepad2, Upload, Users, Heart,
  CheckCircle2, Loader2, Shield, Key, Copy, ExternalLink, X, AlertTriangle
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { useAuth } from '@/hooks/useAuth';
import { useWalletLinking } from '@/hooks/useWalletLinking';
import { formatCamly, isWalletConnectConfigured } from '@/lib/web3';
import { toast } from 'sonner';


interface LightWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  camlyBalance: number;
  onBalanceUpdate: () => void;
}

const playBlingSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(528, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1056, audioContext.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(1584, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    console.log('Audio not supported');
  }
};

export const LightWalletModal = ({ isOpen, onClose, camlyBalance, onBalanceUpdate }: LightWalletModalProps) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { user } = useAuth();
  const { linkWallet, checkEligibility, getCurrentWallet, isLinking } = useWalletLinking();
  
  const [showFunWalletCreate, setShowFunWalletCreate] = useState(false);
  const [creatingFunWallet, setCreatingFunWallet] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChangeWarning, setShowChangeWarning] = useState(false);
  const [pendingConnector, setPendingConnector] = useState<any>(null);
  
  // Track processed addresses to prevent duplicate checks
  const processedAddressRef = useRef<string | null>(null);
  const isProcessingRef = useRef(false);

  // BNB balance
  const { data: bnbBalance } = useBalance({ address });

  // Check if on BSC
  const isOnBSC = chainId === bsc.id;

  useEffect(() => {
    // Auto-switch to BSC if connected but wrong chain
    if (isConnected && !isOnBSC) {
      switchChain?.({ chainId: bsc.id });
    }
  }, [isConnected, isOnBSC, switchChain]);

  // Handle wallet connection with eligibility check
  useEffect(() => {
    if (isConnected && address && user) {
      handleWalletConnectionWithCheck();
    }
  }, [isConnected, address, user]);

  const handleWalletConnectionWithCheck = async () => {
    if (!user || !address || isProcessingRef.current) return;
    
    const normalizedAddress = address.toLowerCase();
    
    // Skip if already processed this address
    if (processedAddressRef.current === normalizedAddress) return;
    
    isProcessingRef.current = true;
    
    try {
      // Step 1: Check eligibility BEFORE updating database
      const eligibility = await checkEligibility(user.id, normalizedAddress);
      
      if (!eligibility.canConnect) {
        // CRITICAL: Disconnect the ineligible wallet
        toast.error(eligibility.reason || 'Ví không đủ điều kiện kết nối');
        disconnect();
        processedAddressRef.current = null;
        return;
      }
      
      // Step 2: Link wallet through centralized hook (handles all tables + bonus)
      const result = await linkWallet(user.id, normalizedAddress, {
        showToasts: true,
        source: 'appkit'
      });
      
      if (result.success) {
        processedAddressRef.current = normalizedAddress;
        
        // Refresh balance if first connection
        if (result.isFirstConnection) {
          onBalanceUpdate();
          playBlingSound();
        }
      } else if (!result.alreadyLinked) {
        // If linking failed (not because already linked), disconnect
        toast.error(result.reason || 'Không thể liên kết ví');
        disconnect();
        processedAddressRef.current = null;
      }
    } catch (error) {
      console.error('Error handling wallet connection:', error);
      toast.error('Lỗi kết nối ví. Vui lòng thử lại.');
      disconnect();
      processedAddressRef.current = null;
    } finally {
      isProcessingRef.current = false;
    }
  };

  // Pre-connection check: warn user if they already have a wallet
  const handlePreConnectCheck = async (connector: any) => {
    if (!user) {
      connect({ connector });
      return;
    }
    
    // Check if user already has a wallet linked
    const currentWallet = await getCurrentWallet(user.id);
    
    if (currentWallet) {
      // User already has wallet - show warning about wallet change limits
      setPendingConnector(connector);
      setShowChangeWarning(true);
    } else {
      // No existing wallet - proceed directly
      connect({ connector });
    }
  };

  const handleConfirmWalletChange = () => {
    if (pendingConnector) {
      connect({ connector: pendingConnector });
    }
    setShowChangeWarning(false);
    setPendingConnector(null);
  };

  const handleCancelWalletChange = () => {
    setShowChangeWarning(false);
    setPendingConnector(null);
  };

  const handleConnectMetaMask = () => {
    const metamaskConnector = connectors.find(c => c.id === 'injected' || c.name === 'MetaMask');
    if (metamaskConnector) {
      handlePreConnectCheck(metamaskConnector);
    }
  };

  const handleConnectWalletConnect = () => {
    const wcConnector = connectors.find(c => c.id === 'walletConnect');
    if (wcConnector) {
      handlePreConnectCheck(wcConnector);
    } else {
      toast.info('Đang sử dụng ví trong trình duyệt...');
      handleConnectMetaMask();
    }
  };

  const handleCreateFunWallet = async () => {
    setCreatingFunWallet(true);
    // Simulate wallet creation (in production, this would use a proper key management solution)
    setTimeout(() => {
      setCreatingFunWallet(false);
      toast.success('FUN Wallet created! Your keys are securely encrypted.');
      setShowFunWalletCreate(false);
    }, 2000);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const earnRewards = [
    { icon: Gamepad2, label: 'Play Games', amount: '+10K CAMLY', color: 'text-green-500' },
    { icon: Upload, label: 'Upload Game', amount: '+500K CAMLY', color: 'text-blue-500' },
    { icon: Users, label: 'Invite Friends', amount: '+25K CAMLY', color: 'text-purple-500' },
    { icon: Gift, label: 'Daily Check-in', amount: '+5K CAMLY', color: 'text-amber-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-amber-500/5 border-2 border-amber-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Gem className="w-7 h-7 text-amber-500" />
            </motion.div>
            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent">
              Light Wallet
            </span>
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Connected State */}
          {isConnected && address ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Balance Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 via-yellow-500/10 to-orange-500/20 border border-amber-500/30 relative overflow-hidden">
                {/* Animated sparkles */}
                <div className="absolute inset-0 overflow-hidden">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      animate={{
                        x: [Math.random() * 100, Math.random() * 100],
                        y: [Math.random() * 100, Math.random() * 100],
                        opacity: [0.3, 0.8, 0.3],
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: i * 0.5,
                      }}
                      style={{ left: `${Math.random() * 80}%`, top: `${Math.random() * 80}%` }}
                    >
                      <Gem className="w-4 h-4 text-amber-400/50" />
                    </motion.div>
                  ))}
                </div>

                <div className="relative z-10">
                  <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                  <motion.p
                    className="text-4xl font-bold text-amber-500"
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                  >
                    {formatCamly(camlyBalance)} CAMLY
                  </motion.p>
                {bnbBalance && (
                    <p className="text-sm text-muted-foreground mt-1">
                      + {(Number(bnbBalance.value) / 1e18).toFixed(4)} BNB
                    </p>
                  )}
                </div>
              </div>

              {/* Wallet Address */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                <p className="flex-1 font-mono text-sm truncate">{address}</p>
                <Button variant="ghost" size="icon" onClick={copyAddress}>
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <a
                  href={`https://bscscan.com/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              </div>

              {/* Earn Rewards Section */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-500" />
                  Earn Joy Rewards
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {earnRewards.map((reward, i) => (
                    <motion.div
                      key={reward.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 rounded-xl bg-muted/50 border border-border hover:border-amber-500/50 transition-colors cursor-pointer group"
                    >
                      <reward.icon className={`w-5 h-5 ${reward.color} mb-1 group-hover:scale-110 transition-transform`} />
                      <p className="text-xs text-muted-foreground">{reward.label}</p>
                      <p className="font-bold text-sm text-amber-500">{reward.amount}</p>
                    </motion.div>
                  ))}
                </div>
              </div>


              {/* Disconnect */}
              <Button
                variant="outline"
                onClick={() => {
                  processedAddressRef.current = null;
                  disconnect();
                  onClose();
                }}
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                Disconnect Wallet
              </Button>
            </motion.div>
          ) : (
            /* Connect Options */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Airdrop Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-orange-500/20 border border-amber-500/30 text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Gift className="w-12 h-12 text-amber-500 mx-auto mb-2" />
                </motion.div>
                <p className="font-bold text-lg text-amber-500">Connect & Get 50K CAMLY Free!</p>
                <p className="text-sm text-muted-foreground">First connection bonus on BSC Mainnet</p>
              </div>

              {/* Wallet Change Warning */}
              {showChangeWarning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-4 rounded-xl bg-amber-500/20 border-2 border-amber-500/50 space-y-3"
                >
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Bạn đã liên kết ví!</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bạn chỉ được đổi ví tối đa <strong>3 lần</strong>. Mỗi lần đổi sẽ được ghi nhận.
                    Bạn có chắc muốn tiếp tục?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelWalletChange}
                      className="flex-1"
                    >
                      Hủy
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirmWalletChange}
                      className="flex-1 bg-amber-500 hover:bg-amber-600"
                    >
                      Tiếp tục
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* MetaMask */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnectMetaMask}
                disabled={isPending || isLinking || showChangeWarning}
                className="w-full p-4 rounded-xl border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 transition-all flex items-center gap-4 disabled:opacity-50"
              >
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                  <span className="text-2xl">🦊</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-lg">MetaMask</p>
                  <p className="text-sm text-muted-foreground">Most popular wallet</p>
                </div>
                {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
              </motion.button>

              {/* WalletConnect - Only show if configured */}
              {isWalletConnectConfigured() && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConnectWalletConnect}
                  disabled={isPending || isLinking || showChangeWarning}
                  className="w-full p-4 rounded-xl border-2 border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all flex items-center gap-4 disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-lg">WalletConnect</p>
                    <p className="text-sm text-muted-foreground">Scan QR with mobile wallet</p>
                  </div>
                  {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                </motion.button>
              )}

              {/* FUN Wallet */}
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowFunWalletCreate(true)}
                className="w-full p-4 rounded-xl border-2 border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Gem className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-lg">FUN Wallet</p>
                  <p className="text-sm text-muted-foreground">Create new wallet automatically</p>
                </div>
                <div className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold">
                  NEW
                </div>
              </motion.button>

              {/* Security Note */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
                <Shield className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Your keys are encrypted and secured. Safe for kids! 🔒
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* FUN Wallet Creation Modal */}
        <AnimatePresence>
          {showFunWalletCreate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="text-center space-y-4"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  {creatingFunWallet ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <Key className="w-10 h-10 text-white" />
                  )}
                </div>
                <h3 className="text-xl font-bold">Create FUN Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  A new wallet will be created just for you! Your private key is encrypted and stored securely.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowFunWalletCreate(false)}
                    disabled={creatingFunWallet}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateFunWallet}
                    disabled={creatingFunWallet}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    {creatingFunWallet ? 'Creating...' : 'Create Wallet'}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
