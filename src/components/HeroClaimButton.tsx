import { motion, AnimatePresence } from "framer-motion";
import { Diamond, Rocket, Sparkles, Wallet, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { useClaimToWallet } from "@/hooks/useClaimToWallet";
import { toast } from "sonner";

export const HeroClaimButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isVN = i18n.language === 'vi';
  const [isHovered, setIsHovered] = useState(false);
  
  const { 
    isClaiming, 
    hasClaimed, 
    isConnected, 
    claimAirdrop, 
    openWalletModal, 
    celebrateClaim,
    checkHasClaimed,
    walletAddress
  } = useClaimToWallet();

  const [claimSuccess, setClaimSuccess] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Check claim status when wallet connects
  useEffect(() => {
    if (walletAddress) {
      checkHasClaimed(walletAddress);
    }
  }, [walletAddress, checkHasClaimed]);

  const handleClick = async () => {
    // If not logged in, go to auth
    if (!user) {
      navigate('/auth');
      return;
    }

    // If wallet not connected, open modal
    if (!isConnected) {
      await openWalletModal();
      return;
    }

    // If already claimed, go to claim page
    if (hasClaimed) {
      navigate('/claim');
      return;
    }

    // Try to claim airdrop
    const result = await claimAirdrop();
    
    if (result.success && result.txHash) {
      setClaimSuccess(true);
      setTxHash(result.txHash);
      celebrateClaim();
      toast.success(
        isVN 
          ? '🎉 Đã nhận 50,000 CAMLY vào ví!' 
          : '🎉 50,000 CAMLY claimed to your wallet!'
      );
      
      // Reset after 3 seconds
      setTimeout(() => {
        setClaimSuccess(false);
        navigate('/claim');
      }, 3000);
    } else if (result.error) {
      toast.error(result.error);
    }
  };

  const getButtonText = () => {
    if (isClaiming) {
      return isVN ? 'Đang xử lý...' : 'Processing...';
    }
    if (claimSuccess) {
      return isVN ? '✓ Đã nhận 50K CAMLY!' : '✓ Claimed 50K CAMLY!';
    }
    if (hasClaimed) {
      return isVN ? 'Xem Ví Của Bạn 💎' : 'View Your Wallet 💎';
    }
    if (!isConnected && user) {
      return isVN ? 'Kết nối Ví → Nhận 50K CAMLY! 🚀' : 'Connect Wallet → Get 50K CAMLY! 🚀';
    }
    if (!user) {
      return isVN ? 'Đăng nhập & Nhận 50K CAMLY Miễn phí! 🚀' : 'Login & Get 50K CAMLY Free! 🚀';
    }
    return isVN ? 'Claim 50K CAMLY Ngay! 🚀' : 'Claim 50K CAMLY Now! 🚀';
  };

  const getButtonIcon = () => {
    if (isClaiming) {
      return <Loader2 className="w-6 h-6 animate-spin" />;
    }
    if (claimSuccess || hasClaimed) {
      return <CheckCircle className="w-6 h-6" />;
    }
    if (!isConnected && user) {
      return <Wallet className="w-6 h-6" />;
    }
    return <Diamond className="w-6 h-6" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="relative mt-6"
    >
      {/* Floating diamonds around button */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${15 + i * 14}%`,
            top: i % 2 === 0 ? '-20px' : 'auto',
            bottom: i % 2 !== 0 ? '-20px' : 'auto',
          }}
          animate={{
            y: [0, -10, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          <Diamond className="w-4 h-4 text-yellow-400 opacity-60" />
        </motion.div>
      ))}

      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleClick}
          disabled={isClaiming}
          size="lg"
          className={`relative px-8 py-6 text-lg md:text-xl font-bold shadow-2xl transition-all rounded-2xl border-2 border-white/20 ${
            claimSuccess 
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/40'
              : hasClaimed
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/40'
                : 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 shadow-purple-500/40 hover:shadow-purple-500/60'
          }`}
        >
          {/* Pulsing glow */}
          <motion.div
            className={`absolute inset-0 rounded-2xl ${
              claimSuccess 
                ? 'bg-gradient-to-r from-green-500/50 to-emerald-600/50'
                : 'bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-orange-500/50'
            }`}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <div className="relative flex items-center gap-3">
            <motion.div
              animate={{ rotate: isHovered && !isClaiming ? 360 : 0 }}
              transition={{ duration: 0.5 }}
            >
              {getButtonIcon()}
            </motion.div>
            
            <span>{getButtonText()}</span>
            
            {!isClaiming && !claimSuccess && !hasClaimed && (
              <motion.div
                animate={{
                  x: [0, 5, 0],
                  y: [0, -3, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <Rocket className="w-5 h-5" />
              </motion.div>
            )}
          </div>

          {/* Sparkle effects on hover */}
          <AnimatePresence>
            {isHovered && !isClaiming && (
              <>
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0.5, 1, 0.5],
                      x: (Math.random() - 0.5) * 100,
                      y: (Math.random() - 0.5) * 60,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </motion.div>
                ))}
              </>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* BSCScan link after success */}
      <AnimatePresence>
        {claimSuccess && txHash && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 text-center"
          >
            <a
              href={`https://bscscan.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <CheckCircle className="w-4 h-4" />
              {isVN ? 'Xem giao dịch trên BSCScan ↗' : 'View transaction on BSCScan ↗'}
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
