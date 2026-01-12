import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Wallet, Gem, Sparkles, Gift, Gamepad2, Upload, Users,
  CheckCircle2, Loader2, Copy, ExternalLink
} from 'lucide-react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { useAuth } from '@/hooks/useAuth';
import { formatCamly, isWalletConnectConfigured } from '@/lib/web3';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';


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
  
  const [copied, setCopied] = useState(false);
  const processedAddressRef = useRef<string | null>(null);

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

  // Handle wallet connection - simple sync to profiles
  useEffect(() => {
    if (isConnected && address && user) {
      handleWalletSync();
    }
  }, [isConnected, address, user]);

  const handleWalletSync = async () => {
    if (!user || !address) return;
    
    const normalizedAddress = address.toLowerCase();
    
    // Skip if already processed this address
    if (processedAddressRef.current === normalizedAddress) return;
    
    try {
      // Simple sync to profiles table
      const { error } = await supabase
        .from('profiles')
        .update({ wallet_address: normalizedAddress })
        .eq('id', user.id);
      
      if (!error) {
        processedAddressRef.current = normalizedAddress;
        onBalanceUpdate();
        playBlingSound();
        toast.success('Wallet connected successfully! 🎉');
      }
    } catch (error) {
      console.error('Error syncing wallet:', error);
    }
  };

  const handleConnectMetaMask = () => {
    const metamaskConnector = connectors.find(c => c.id === 'injected' || c.name === 'MetaMask');
    if (metamaskConnector) {
      connect({ connector: metamaskConnector });
    }
  };

  const handleConnectWalletConnect = () => {
    const wcConnector = connectors.find(c => c.id === 'walletConnect');
    if (wcConnector) {
      connect({ connector: wcConnector });
    } else {
      toast.info('Using browser wallet...');
      handleConnectMetaMask();
    }
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
              {/* Welcome Message */}
              <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20">
                <Gem className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-2">Connect Your Wallet</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet to access CAMLY rewards and claim your earnings!
                </p>
              </div>

              {/* Connection Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleConnectMetaMask}
                  disabled={isPending}
                  className="w-full h-14 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  {isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-6 h-6 mr-3" />
                  )}
                  Connect MetaMask
                </Button>

                {isWalletConnectConfigured() && (
                  <Button
                    onClick={handleConnectWalletConnect}
                    disabled={isPending}
                    variant="outline"
                    className="w-full h-14 border-2 hover:bg-muted/50"
                  >
                    {isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Wallet className="w-5 h-5 mr-3" />
                    )}
                    WalletConnect
                  </Button>
                )}
              </div>

              {/* Earn Preview */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <p className="text-sm text-center text-muted-foreground">
                  🎁 Connect to earn <span className="font-bold text-amber-500">50,000 CAMLY</span> welcome bonus!
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
