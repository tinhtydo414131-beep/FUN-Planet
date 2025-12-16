import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Wallet, Gift, Sparkles, ExternalLink, Loader2, PartyPopper, Gamepad2, Plus } from 'lucide-react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePendingRewards } from '@/hooks/usePendingRewards';
import { useClaimReward, ClaimType } from '@/hooks/useClaimReward';
import { shortenAddress, formatCamly, appKit } from '@/lib/web3';
import confetti from 'canvas-confetti';

interface MyRewardsPanelProps {
  onClose?: () => void;
}

const MyRewardsPanel = ({ onClose }: MyRewardsPanelProps) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { pendingRewards, totalPending, isLoading, refetch, addTestReward } = usePendingRewards();
  const { claimReward, isClaiming, lastTxHash } = useClaimReward();
  
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [showTestButtons, setShowTestButtons] = useState(false);

  const BSC_CHAIN_ID = 56;
  const isCorrectChain = chainId === BSC_CHAIN_ID;

  const handleConnectWallet = () => {
    appKit.open();
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchChain({ chainId: BSC_CHAIN_ID });
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ['#FFD700', '#FFA500', '#FF6B00', '#00D4FF', '#FF69B4'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  };

  const handleClaimAll = async () => {
    if (!isConnected || !address) {
      handleConnectWallet();
      return;
    }

    if (!isCorrectChain) {
      handleSwitchNetwork();
      return;
    }

    if (totalPending <= 0) return;

    // For now, claim as 'daily_checkin' type - in production you'd have a dedicated endpoint
    const result = await claimReward('daily_checkin' as ClaimType);
    
    if (result.success) {
      setClaimSuccess(true);
      setClaimedAmount(totalPending);
      triggerConfetti();
      await refetch();
      
      // Reset success state after animation
      setTimeout(() => {
        setClaimSuccess(false);
      }, 5000);
    }
  };

  const handleAddTestReward = async (amount: number, source: string) => {
    await addTestReward(amount, source);
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'game_play': return '🎮 Playing Games';
      case 'upload': return '📤 Uploaded Game';
      case 'daily_bonus': return '📅 Daily Bonus';
      case 'welcome': return '👋 Welcome Bonus';
      case 'referral': return '👥 Referral Bonus';
      default: return '🎁 Reward';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950 border-2 border-amber-300 dark:border-amber-700 shadow-xl overflow-hidden">
      {/* Fun Header with Animation */}
      <CardHeader className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 text-white pb-6 pt-4 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Gift className="w-8 h-8" />
              </motion.div>
              My Rewards
            </CardTitle>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-yellow-200" />
            </motion.div>
          </div>
          
          {/* Wallet Address Display */}
          {isConnected && address && (
            <div className="mt-3 flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5 w-fit">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium">{shortenAddress(address)}</span>
              {isCorrectChain ? (
                <Badge className="bg-green-500 text-white text-xs">BSC</Badge>
              ) : (
                <Badge className="bg-red-500 text-white text-xs">Wrong Network</Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Success Animation */}
        <AnimatePresence>
          {claimSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: -20 }}
              className="bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl p-6 text-center shadow-lg"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 0.5 }}
              >
                <PartyPopper className="w-12 h-12 mx-auto mb-3" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">🎉 Congratulations! 🎉</h3>
              <p className="text-lg">
                You received <span className="font-bold text-yellow-200">{formatCamly(claimedAmount)} CAMLY</span> in your wallet!
              </p>
              {lastTxHash && (
                <a
                  href={`https://bscscan.com/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-sm underline hover:text-yellow-200 transition-colors"
                >
                  View Transaction <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending Rewards Display */}
        {!claimSuccess && (
          <>
            <div className="text-center">
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-4"
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(251, 191, 36, 0.3)',
                    '0 0 40px rgba(251, 191, 36, 0.6)',
                    '0 0 20px rgba(251, 191, 36, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Coins className="w-10 h-10 text-white" />
              </motion.div>
              
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">Pending CAMLY Rewards</p>
                <motion.p
                  className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent"
                  key={totalPending}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {isLoading ? '...' : formatCamly(totalPending)}
                </motion.p>
                <p className="text-xs text-muted-foreground">≈ ${(totalPending * 0.0001).toFixed(2)} USD</p>
              </div>
            </div>

            {/* Rewards List */}
            {pendingRewards.length > 0 && (
              <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 max-h-40 overflow-y-auto">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Recent Rewards</h4>
                <div className="space-y-2">
                  {pendingRewards.slice(0, 5).map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 rounded-lg px-3 py-2"
                    >
                      <span>{getSourceLabel(reward.source)}</span>
                      <span className="font-bold text-amber-600">+{formatCamly(reward.amount)}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Claim Button */}
            {!isConnected ? (
              <Button
                onClick={handleConnectWallet}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all"
              >
                <Wallet className="w-6 h-6 mr-2" />
                Connect Wallet to Claim
              </Button>
            ) : !isCorrectChain ? (
              <Button
                onClick={handleSwitchNetwork}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-xl shadow-lg"
              >
                Switch to BSC Network
              </Button>
            ) : totalPending > 0 ? (
              <Button
                onClick={handleClaimAll}
                disabled={isClaiming}
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isClaiming ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                    >
                      <Coins className="w-6 h-6 mr-2" />
                    </motion.div>
                    Claim {formatCamly(totalPending)} CAMLY to Wallet! 🚀
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl">
                <Gamepad2 className="w-12 h-12 mx-auto text-blue-500 mb-3" />
                <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                  No pending rewards yet!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Play games to earn more CAMLY, kid! 🎮
                </p>
              </div>
            )}

            {/* Test Rewards Section (Development Only) */}
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTestButtons(!showTestButtons)}
                className="w-full text-xs text-muted-foreground"
              >
                {showTestButtons ? 'Hide' : 'Show'} Test Options
              </Button>
              
              <AnimatePresence>
                {showTestButtons && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2"
                  >
                    <p className="text-xs text-muted-foreground text-center mb-2">
                      Add test rewards (for development)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTestReward(10000, 'game_play')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        +10K (Game)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTestReward(5000, 'daily_bonus')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        +5K (Daily)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTestReward(50000, 'welcome')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        +50K (Welcome)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTestReward(500000, 'upload')}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        +500K (Upload)
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MyRewardsPanel;
