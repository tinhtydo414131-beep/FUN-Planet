import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Gamepad2, Wallet, Upload, Globe, Sparkles, Loader2 } from "lucide-react";
import { web3Modal, REWARDS, formatCamly, isWeb3ModalAvailable } from "@/lib/web3";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface HeroActionButtonsProps {
  onScrollToGames?: () => void;
}

export function HeroActionButtons({ onScrollToGames }: HeroActionButtonsProps) {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connectWallet, firstWalletClaimed } = useWeb3Rewards();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ['#FFD700', '#00BFFF', '#FF69B4', '#00FF7F'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());

    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: colors,
    });
  };

  const handleConnectWallet = async () => {
    if (isConnected && !firstWalletClaimed) {
      setIsConnecting(true);
      const result = await connectWallet();
      setIsConnecting(false);
      if (result) {
        fireConfetti();
        toast.success(`🎉 Airdrop claimed! +${formatCamly(REWARDS.FIRST_WALLET_CONNECT)} CAMLY`);
      }
    } else if (!isConnected && isWeb3ModalAvailable() && web3Modal) {
      web3Modal.open();
    } else {
      toast.info("You've already claimed your airdrop!");
    }
  };

  const handlePlayNow = () => {
    if (onScrollToGames) {
      onScrollToGames();
    } else {
      document.getElementById('featured-games')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const actions = [
    {
      id: "play",
      label: "Play Now",
      sublabel: "No Registration Required",
      icon: Gamepad2,
      gradient: "from-green-500 via-emerald-500 to-teal-500",
      shadow: "shadow-green-500/30",
      emoji: "🎮",
      onClick: handlePlayNow,
    },
    {
      id: "wallet",
      label: "Connect Wallet",
      sublabel: isConnected && !firstWalletClaimed ? "Get 50K CAMLY Free!" : isConnected ? "Connected ✓" : "Get 50K CAMLY Free!",
      icon: Wallet,
      gradient: "from-purple-500 via-pink-500 to-rose-500",
      shadow: "shadow-purple-500/30",
      emoji: "💎",
      onClick: handleConnectWallet,
      loading: isConnecting,
      disabled: isConnected && firstWalletClaimed,
    },
    {
      id: "upload",
      label: "Upload Game",
      sublabel: "Get 500K CAMLY",
      icon: Upload,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      shadow: "shadow-orange-500/30",
      emoji: "🚀",
      onClick: () => navigate("/upload-game"),
    },
    {
      id: "builder",
      label: "3D Planet Builder",
      sublabel: "Build Your Child's World",
      icon: Globe,
      gradient: "from-blue-500 via-cyan-500 to-sky-500",
      shadow: "shadow-blue-500/30",
      emoji: "🌍",
      onClick: () => navigate("/planet-explorer"),
    },
  ];

  return (
    <>
      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-4 gap-4 max-w-5xl mx-auto px-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              <Button
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={`relative w-full h-28 flex flex-col items-center justify-center gap-2 bg-gradient-to-br ${action.gradient} hover:opacity-90 ${action.shadow} shadow-2xl border-2 border-white/30 rounded-2xl overflow-hidden group transition-all duration-300 hover:scale-105`}
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
                
                {action.loading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Icon className="w-6 h-6 text-white" />
                      <span className="text-2xl">{action.emoji}</span>
                    </div>
                    <span className="font-bold text-white text-base">{action.label}</span>
                    <span className="text-xs text-white/80">{action.sublabel}</span>
                  </>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>

      {/* Mobile - 2x2 Grid */}
      <div className="md:hidden grid grid-cols-2 gap-3 px-4 max-w-md mx-auto">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 + 0.2 }}
            >
              <Button
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
                className={`relative w-full h-24 flex flex-col items-center justify-center gap-1 bg-gradient-to-br ${action.gradient} hover:opacity-90 ${action.shadow} shadow-xl border border-white/30 rounded-xl overflow-hidden`}
              >
                {action.loading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <>
                    <span className="text-xl">{action.emoji}</span>
                    <span className="font-bold text-white text-sm">{action.label}</span>
                    <span className="text-[10px] text-white/80">{action.sublabel}</span>
                  </>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
