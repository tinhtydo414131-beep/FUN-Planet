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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="mb-10"
    >
      {/* Golden glow border */}
      <div className="relative">
        <div 
          className="absolute -inset-[2px] rounded-[26px] opacity-80"
          style={{
            background: 'linear-gradient(135deg, #FFD700, #FFEC8B, #FFD700, #FFAA00)',
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)',
          }}
        />
        
        {/* Glassmorphism card */}
        <div 
          className="relative p-6 rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 10px 40px rgba(0,0,0,0.1)',
          }}
        >
          {/* Inner glossy reflection */}
          <div 
            className="absolute inset-x-0 top-0 h-1/2 opacity-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)',
              borderRadius: '24px 24px 50% 50%',
            }}
          />

          {/* Sparkle effect */}
          <div className="absolute top-3 right-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-7 h-7 text-[#FFD700]" style={{ filter: 'drop-shadow(0 0 6px #FFD700)' }} />
            </motion.div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* Wallet Status */}
            <div className="flex items-center gap-4">
              <div 
                className="w-18 h-18 rounded-2xl flex items-center justify-center"
                style={{
                  width: '72px',
                  height: '72px',
                  background: isConnected 
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FF8C00 100%)' 
                    : 'linear-gradient(135deg, #A0A0A0 0%, #808080 100%)',
                  boxShadow: isConnected 
                    ? '0 0 25px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)' 
                    : '0 4px 15px rgba(0,0,0,0.2)',
                }}
              >
                {isConnected ? (
                  <Check className="w-9 h-9 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                ) : (
                  <Wallet className="w-9 h-9 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                )}
              </div>
              <div>
                <p 
                  className="text-sm font-medium mb-1"
                  style={{ color: '#FFF8DC', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {isConnected ? '✨ Ví Ánh Sáng Của Con' : 'Kết nối ví để nhận thưởng'}
                </p>
                {isConnected && walletAddress ? (
                  <p 
                    className="text-lg font-mono font-bold"
                    style={{ color: '#FFFFFF', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                  >
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </p>
                ) : (
                  <Button
                    onClick={onConnect}
                    className="mt-2 font-bold"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FF8C00 100%)',
                      boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                      color: '#FFFFFF',
                      textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    }}
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
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{
                  background: 'rgba(255, 215, 0, 0.15)',
                  border: '2px solid rgba(255, 215, 0, 0.5)',
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.2), inset 0 1px 1px rgba(255,255,255,0.2)',
                }}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FF8C00 100%)',
                    boxShadow: '0 0 25px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)',
                  }}
                >
                  <Coins className="w-8 h-8 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                </div>
                <div>
                  <p className="text-sm" style={{ color: '#FFEC8B' }}>Số dư CAMLY</p>
                  <p 
                    className="text-2xl font-bold font-fredoka"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FFEC8B 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 1px 2px rgba(255, 170, 0, 0.5))',
                    }}
                  >
                    {camlyBalance.toLocaleString()} <span className="text-lg">$C</span>
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
