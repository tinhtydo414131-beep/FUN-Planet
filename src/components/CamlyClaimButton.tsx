import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Coins, Loader2, Sparkles, Check, X } from 'lucide-react';
import { useCamlyClaim, ClaimType } from '@/hooks/useCamlyClaim';
import { useAppKit } from '@reown/appkit/react';
import { cn } from '@/lib/utils';

interface CamlyClaimButtonProps {
  claimType: ClaimType;
  gameId?: string;
  onSuccess?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

const REWARD_LABELS: Record<ClaimType, { label: string; amount: string }> = {
  first_wallet: { label: 'First Connection Bonus', amount: '50,000' },
  game_completion: { label: 'Game Completion', amount: '10,000' },
  game_upload: { label: 'Game Upload Reward', amount: '500,000' },
};

export function CamlyClaimButton({ 
  claimType, 
  gameId, 
  onSuccess, 
  className,
  variant = 'default'
}: CamlyClaimButtonProps) {
  const { claimReward, checkCanClaim, isClaiming, isWalletConnected } = useCamlyClaim();
  const { open } = useAppKit();
  const [canClaim, setCanClaim] = useState<boolean | null>(null);
  const [claimReason, setClaimReason] = useState<string>();
  const [claimStatus, setClaimStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const check = async () => {
      const result = await checkCanClaim(claimType, gameId);
      setCanClaim(result.canClaim);
      setClaimReason(result.reason);
    };
    check();
  }, [claimType, gameId, checkCanClaim]);

  const handleClaim = async () => {
    if (!isWalletConnected) {
      open();
      return;
    }

    const result = await claimReward(claimType, gameId);
    
    if (result.success) {
      setClaimStatus('success');
      setCanClaim(false);
      onSuccess?.();
      setTimeout(() => setClaimStatus('idle'), 3000);
    } else {
      setClaimStatus('error');
      setTimeout(() => setClaimStatus('idle'), 2000);
    }
  };

  const reward = REWARD_LABELS[claimType];

  if (variant === 'compact') {
    return (
      <Button
        onClick={handleClaim}
        disabled={isClaiming || canClaim === false}
        className={cn(
          "relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
          className
        )}
        size="sm"
      >
        {isClaiming ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Coins className="h-4 w-4 mr-2" />
        )}
        Claim {reward.amount} CAMLY
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("relative", className)}
    >
      <motion.div
        className="relative p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-500/20 border border-amber-500/30 backdrop-blur-sm"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Animated background sparkles */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-amber-400 rounded-full"
              initial={{ 
                x: Math.random() * 100 + '%', 
                y: Math.random() * 100 + '%',
                opacity: 0 
              }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.4,
                repeat: Infinity,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
              <Coins className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">{reward.label}</h3>
              <p className="text-sm text-muted-foreground">
                Earn <span className="text-amber-500 font-semibold">{reward.amount} CAMLY</span>
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {claimStatus === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-500/20 border border-green-500/30"
              >
                <Check className="h-5 w-5 text-green-500" />
                <span className="text-green-500 font-medium">Claimed Successfully!</span>
              </motion.div>
            ) : claimStatus === 'error' ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/20 border border-red-500/30"
              >
                <X className="h-5 w-5 text-red-500" />
                <span className="text-red-500 font-medium">Claim Failed</span>
              </motion.div>
            ) : (
              <motion.div key="button">
                <Button
                  onClick={handleClaim}
                  disabled={isClaiming || canClaim === false}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  <AnimatePresence mode="wait">
                    {isClaiming ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </motion.div>
                    ) : !isWalletConnected ? (
                      <motion.div
                        key="connect"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Sparkles className="h-5 w-5" />
                        Connect Wallet to Claim
                      </motion.div>
                    ) : canClaim === false ? (
                      <motion.div
                        key="disabled"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-5 w-5" />
                        {claimReason || 'Already Claimed'}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="claim"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Coins className="h-5 w-5" />
                        Claim {reward.amount} CAMLY
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {canClaim === false && claimReason && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {claimReason}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
