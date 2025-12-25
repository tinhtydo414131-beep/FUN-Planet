import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Gamepad2, Wallet, Upload, Globe, Loader2 } from "lucide-react";
import { REWARDS, formatCamly } from "@/lib/web3";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useAccount, useConnect } from "wagmi";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export function MobileActionBar() {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { connectWallet, firstWalletClaimed } = useWeb3Rewards();
  const [isConnecting, setIsConnecting] = useState(false);

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.9 },
      colors: ['#FFD700', '#00BFFF', '#FF69B4', '#00FF7F'],
    });
  };

  const handleConnectWallet = async () => {
    if (isConnected && !firstWalletClaimed) {
      setIsConnecting(true);
      const result = await connectWallet();
      setIsConnecting(false);
      if (result) {
        fireConfetti();
        toast.success(`🎉 +${formatCamly(REWARDS.FIRST_WALLET_CONNECT)} CAMLY!`);
      }
      return;
    }

    if (!isConnected) {
      try {
        if (typeof window.ethereum === 'undefined') {
          toast.error('Chưa phát hiện ví. Vui lòng cài MetaMask hoặc Trust Wallet.');
          return;
        }
        const injectedConnector = connectors.find((c) => 
          c.id === 'injected' || c.id === 'metaMask' || c.id.includes('injected')
        );
        if (!injectedConnector) {
          toast.error('Không thể kết nối ví. Vui lòng thử lại!');
          return;
        }
        await connectAsync({ connector: injectedConnector });
      } catch (error: any) {
        const message = String(error?.shortMessage || error?.message || '');
        if (message.toLowerCase().includes('user rejected')) {
          toast.error('Bạn đã từ chối kết nối ví!');
        } else {
          toast.error('Không thể kết nối ví. Vui lòng thử lại!');
        }
      }
    }
  };

  const handlePlayNow = () => {
    document.getElementById('featured-games')?.scrollIntoView({ behavior: 'smooth' });
  };

  const actions = [
    {
      id: "play",
      label: "Play",
      icon: Gamepad2,
      color: "text-green-500",
      bg: "bg-green-500/10",
      onClick: handlePlayNow,
    },
    {
      id: "wallet",
      label: isConnected ? "Wallet" : "Connect",
      icon: Wallet,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      onClick: handleConnectWallet,
      loading: isConnecting,
    },
    {
      id: "upload",
      label: "Upload",
      icon: Upload,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      onClick: () => navigate("/upload-game"),
    },
    {
      id: "builder",
      label: "3D",
      icon: Globe,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      onClick: () => navigate("/planet-explorer"),
    },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
    >
      {/* Gradient border */}
      <div className="h-1 bg-gradient-to-r from-green-500 via-purple-500 to-orange-500" />
      
      {/* Action bar */}
      <div className="bg-background/95 backdrop-blur-lg border-t border-border px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl ${action.bg} transition-all active:scale-95`}
              >
                {action.loading ? (
                  <Loader2 className={`w-6 h-6 ${action.color} animate-spin`} />
                ) : (
                  <Icon className={`w-6 h-6 ${action.color}`} />
                )}
                <span className={`text-xs font-bold ${action.color}`}>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
