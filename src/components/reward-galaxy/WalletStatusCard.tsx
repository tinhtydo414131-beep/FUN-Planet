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
        <div className="absolute -inset-1 rounded-[36px] bg-gradient-to-r from-[#FFD700]/50 via-[#FFEC8B]/30 to-[#FFD700]/50 blur-xl" />
        
        {/* Metallic gold border - thick 3px */}
        <div className="absolute -inset-[3px] rounded-[34px] bg-gradient-to-br from-[#FFD700] via-[#FFF8DC] via-[#FFD700] via-[#DAA520] to-[#FFD700]" />
        <div className="absolute -inset-[2px] rounded-[33px] bg-gradient-to-tr from-[#DAA520] via-[#FFEC8B] via-[#FFD700] to-[#B8860B]" />
        
        {/* Glass background */}
        <div className="relative p-6 rounded-[32px] backdrop-blur-[20px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          {/* Metallic shine overlay */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, transparent 40%, rgba(255,248,220,0.8) 50%, transparent 60%)',
            }}
          />
          
          {/* Bottom reflection */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1/3 opacity-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to top, rgba(255,215,0,0.3), transparent)',
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
              <Sparkles className="w-8 h-8 text-[#FFD700] drop-shadow-[0_0_10px_#FFD700]" />
            </motion.div>
          </div>
          
          <div className="absolute top-6 left-6">
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-[#FFEC8B] drop-shadow-[0_0_8px_#FFD700]" />
            </motion.div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Wallet Status */}
            <div className="flex items-center gap-4">
              {/* 3D Gold icon */}
              <motion.div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                style={{
                  background: isConnected 
                    ? 'linear-gradient(135deg, #FFD700, #DAA520, #B8860B)'
                    : 'linear-gradient(135deg, #C0C0C0, #A9A9A9, #808080)',
                  boxShadow: isConnected
                    ? '0 8px 25px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.2)'
                    : '0 8px 20px rgba(128, 128, 128, 0.3)',
                }}
                whileHover={{ scale: 1.05 }}
              >
                {/* Reflection on icon */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                  }}
                />
                {isConnected ? (
                  <Check className="w-10 h-10 text-white drop-shadow-lg" />
                ) : (
                  <Wallet className="w-10 h-10 text-white drop-shadow-lg" />
                )}
              </motion.div>
              
              <div>
                <p 
                  className="text-xl font-bold"
                  style={{
                    color: '#FFFFFF',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5), 0 0 15px rgba(255,215,0,0.3)',
                  }}
                >
                  {isConnected ? '✨ Ví Ánh Sáng Của Con' : 'Kết nối ví để nhận thưởng'}
                </p>
                {isConnected && walletAddress ? (
                  <p 
                    className="text-2xl font-mono font-extrabold tracking-wider"
                    style={{
                      color: '#FFFFFF',
                      textShadow: '0 0 20px #FFD700, 0 2px 6px rgba(0,0,0,0.8), 0 0 40px rgba(255,215,0,0.5)',
                      WebkitTextStroke: '0.5px rgba(255,215,0,0.8)',
                    }}
                  >
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                ) : (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={onConnect}
                      className="mt-2 font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #FFD700, #FFAA00, #DAA520)',
                        boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
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
                className="flex items-center gap-4 p-5 rounded-2xl relative overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: 'rgba(255,215,0,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 215, 0, 0.5)',
                  boxShadow: '0 0 30px rgba(255, 215, 0, 0.2), inset 0 0 20px rgba(255, 215, 0, 0.1)',
                }}
              >
                {/* Gold shimmer */}
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{
                    background: [
                      'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.4) 50%, transparent 100%)',
                      'linear-gradient(90deg, transparent 100%, rgba(255,215,0,0.4) 50%, transparent 0%)',
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* 3D Gold coin icon */}
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #DAA520, #B8860B)',
                    boxShadow: '0 6px 20px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.4)',
                  }}
                >
                  <div 
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)',
                    }}
                  />
                  <Coins className="w-9 h-9 text-white drop-shadow-lg relative z-10" />
                </div>
                
                <div className="relative z-10">
                  <p 
                    className="text-lg font-bold"
                    style={{
                      color: '#FFFFFF',
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}
                  >
                    Số dư CAMLY
                  </p>
                  <p 
                    className="text-4xl font-bold font-fredoka"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 20px #FFD700, 0 2px 4px rgba(0,0,0,0.5)',
                    }}
                  >
                    {camlyBalance.toLocaleString()} <span className="text-lg">CAMLY</span>
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
