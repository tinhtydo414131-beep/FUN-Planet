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
      {/* Outer glow */}
      <div className="relative">
        <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-yellow-400/40 via-orange-300/30 to-yellow-400/40 blur-xl" />
        
        {/* Metallic gold border - thick 4px */}
        <div className="absolute -inset-[4px] rounded-[26px] bg-gradient-to-br from-yellow-500 via-yellow-300 via-amber-400 via-yellow-600 to-yellow-400" />
        <div className="absolute -inset-[3px] rounded-[25px] bg-gradient-to-tr from-amber-600 via-yellow-200 via-yellow-400 to-amber-500" />
        
        {/* Cream/Yellow background (matching reference image) */}
        <div 
          className="relative p-6 rounded-[24px] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FEF9C3 30%, #FFFBEB 60%, #FED7AA 100%)',
            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.3), inset 0 2px 4px rgba(255,255,255,0.8)',
          }}
        >
          {/* Subtle shine overlay */}
          <div 
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.3) 100%)',
            }}
          />
          
          {/* Sparkle effects */}
          <div className="absolute top-3 right-3">
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.2, 1] }}
              transition={{ 
                rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              <Sparkles className="w-7 h-7 text-amber-500 drop-shadow-md" />
            </motion.div>
          </div>
          
          <div className="absolute bottom-4 left-4">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-yellow-500 drop-shadow-md" />
            </motion.div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Wallet Status */}
            <div className="flex items-center gap-4">
              {/* Circular icon with checkmark or wallet */}
              <motion.div 
                className="w-16 h-16 rounded-full flex items-center justify-center relative"
                style={{
                  background: isConnected 
                    ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 50%, #15803D 100%)'
                    : 'linear-gradient(135deg, #9333EA 0%, #7E22CE 50%, #6B21A8 100%)',
                  boxShadow: isConnected
                    ? '0 6px 20px rgba(34, 197, 94, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)'
                    : '0 6px 20px rgba(147, 51, 234, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                }}
                whileHover={{ scale: 1.05 }}
              >
                {/* Reflection on icon */}
                <div 
                  className="absolute inset-0 rounded-full opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
                  }}
                />
                {isConnected ? (
                  <Check className="w-8 h-8 text-white drop-shadow-md" />
                ) : (
                  <Wallet className="w-8 h-8 text-white drop-shadow-md" />
                )}
              </motion.div>
              
              <div>
                <p className="text-lg font-bold text-amber-800">
                  {isConnected ? '✨ Ví Ánh Sáng Của Con' : 'Kết nối ví để nhận thưởng'}
                </p>
                {isConnected && walletAddress ? (
                  <p className="text-xl font-mono font-bold text-amber-700 tracking-wide">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={onConnect}
                      className="mt-2 font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #9333EA, #7E22CE, #6B21A8)',
                        boxShadow: '0 4px 15px rgba(147, 51, 234, 0.4)',
                      }}
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Kết nối MetaMask
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* CAMLY Balance */}
            {isConnected && (
              <motion.div 
                className="flex items-center gap-4 p-4 rounded-2xl relative overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.3))',
                  border: '2px solid rgba(251, 191, 36, 0.6)',
                  boxShadow: '0 4px 20px rgba(251, 191, 36, 0.2)',
                }}
              >
                {/* Gold shimmer */}
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.5), transparent)',
                    width: '50%',
                  }}
                />
                
                {/* OD-style icon box */}
                <div 
                  className="w-14 h-14 rounded-xl flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #D97706, #B45309)',
                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    }}
                  />
                  <Coins className="w-8 h-8 text-white drop-shadow-md relative z-10" />
                </div>
                
                <div className="relative z-10">
                  <p className="text-sm font-bold text-amber-800">
                    Số dư CAMLY
                  </p>
                  <p 
                    className="text-3xl font-bold font-fredoka text-amber-600"
                    style={{
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {camlyBalance.toLocaleString()} <span className="text-base">CAMLY</span>
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
