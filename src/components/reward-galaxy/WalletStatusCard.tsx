import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Wallet, Check, Coins, Sparkles } from 'lucide-react';

interface WalletStatusCardProps {
  isConnected: boolean;
  walletAddress: string | undefined;
  camlyBalance: number;
  onConnect: () => void;
}

export const WalletStatusCard = ({ 
  isConnected, 
  walletAddress, 
  camlyBalance, 
  onConnect 
}: WalletStatusCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mb-10"
    >
      <div className="relative p-6 rounded-3xl bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Sparkle effects */}
        <div className="absolute top-2 right-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-yellow-300/50" />
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Wallet Status */}
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              isConnected 
                ? 'bg-gradient-to-br from-green-400 to-emerald-500' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              {isConnected ? (
                <Check className="w-8 h-8 text-white" />
              ) : (
                <Wallet className="w-8 h-8 text-white" />
              )}
            </div>
            <div>
              <p className="text-sm text-white/60 font-medium">
                {isConnected ? '✨ Ví Ánh Sáng Của Con' : 'Kết nối ví để nhận thưởng'}
              </p>
              {isConnected && walletAddress ? (
                <p className="text-lg font-mono text-white/90 font-bold">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              ) : (
                <Button
                  onClick={onConnect}
                  className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Kết nối MetaMask
                </Button>
              )}
            </div>
          </div>

          {/* CAMLY Balance */}
          {isConnected && (
            <motion.div 
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-400/30"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Coins className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm text-yellow-200/80">Số dư CAMLY</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                  {camlyBalance.toLocaleString()} <span className="text-lg">$C</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
