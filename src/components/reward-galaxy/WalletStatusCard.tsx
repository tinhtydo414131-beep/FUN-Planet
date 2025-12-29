import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Wallet, Check, Coins, Sparkles, Star } from 'lucide-react';

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
      transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="mb-10"
    >
      {/* Outer glow - stronger */}
      <div className="relative">
        <motion.div 
          className="absolute -inset-2 rounded-[32px] bg-gradient-to-r from-amber-400/50 via-yellow-300/40 to-amber-400/50 blur-2xl"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Metallic gold border - thicker 5px */}
        <div className="absolute -inset-[5px] rounded-[30px] bg-gradient-to-br from-yellow-400 via-amber-200 via-yellow-500 via-amber-600 to-yellow-400" />
        <div className="absolute -inset-[4px] rounded-[29px] bg-gradient-to-tr from-amber-500 via-yellow-100 via-amber-300 to-yellow-500" />
        
        {/* Warm cream/gold background */}
        <motion.div 
          className="relative p-7 rounded-[26px] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FEF9C3 25%, #FFFBEB 50%, #FDE68A 75%, #FED7AA 100%)',
            boxShadow: '0 12px 40px rgba(251, 191, 36, 0.4), inset 0 2px 6px rgba(255,255,255,0.9)',
          }}
        >
          {/* Animated shine sweep */}
          <motion.div
            className="absolute inset-0 opacity-60 pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
              width: '40%',
            }}
          />
          
          {/* Floating sparkle particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 30}%`,
              }}
              animate={{
                y: [0, -10, 0],
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              {i % 2 === 0 ? (
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-yellow-500" />
              )}
            </motion.div>
          ))}
          
          {/* Corner sparkle */}
          <motion.div
            className="absolute top-4 right-4"
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ 
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <Sparkles className="w-8 h-8 text-amber-500 drop-shadow-lg" />
          </motion.div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Wallet Status */}
            <div className="flex items-center gap-5">
              {/* Circular icon with 3D effect */}
              <motion.div 
                className="w-18 h-18 rounded-full flex items-center justify-center relative"
                style={{
                  width: '72px',
                  height: '72px',
                  background: isConnected 
                    ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 40%, #15803D 100%)'
                    : 'linear-gradient(135deg, #A855F7 0%, #9333EA 40%, #7E22CE 100%)',
                  boxShadow: isConnected
                    ? '0 8px 25px rgba(34, 197, 94, 0.5), inset 0 3px 6px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.2)'
                    : '0 8px 25px rgba(168, 85, 247, 0.5), inset 0 3px 6px rgba(255,255,255,0.35), inset 0 -3px 6px rgba(0,0,0,0.2)',
                }}
                whileHover={{ scale: 1.08, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Shine overlay */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
                  }}
                />
                {isConnected ? (
                  <Check className="w-9 h-9 text-white drop-shadow-md" />
                ) : (
                  <Wallet className="w-9 h-9 text-white drop-shadow-md" />
                )}
              </motion.div>
              
              <div>
                <p className="text-xl font-bold text-amber-800 drop-shadow-sm">
                  {isConnected ? '✨ Ví Ánh Sáng Của Con' : 'Kết nối ví để nhận thưởng'}
                </p>
                {isConnected && walletAddress ? (
                  <motion.p 
                    className="text-2xl font-mono font-bold text-amber-700 tracking-wide"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </motion.p>
                ) : (
                  <motion.div 
                    whileHover={{ scale: 1.03, y: -2 }} 
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      onClick={onConnect}
                      className="mt-2 font-bold text-white text-lg px-6 py-3 h-auto"
                      style={{
                        background: 'linear-gradient(135deg, #A855F7, #9333EA, #7E22CE)',
                        boxShadow: '0 6px 20px rgba(168, 85, 247, 0.5), inset 0 1px 2px rgba(255,255,255,0.2)',
                      }}
                    >
                      <Wallet className="w-5 h-5 mr-2" />
                      Kết nối MetaMask
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* CAMLY Balance - enhanced */}
            {isConnected && (
              <motion.div 
                className="flex items-center gap-4 p-5 rounded-2xl relative overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.35))',
                  border: '3px solid rgba(251, 191, 36, 0.7)',
                  boxShadow: '0 6px 25px rgba(251, 191, 36, 0.3), inset 0 1px 2px rgba(255,255,255,0.3)',
                }}
                whileHover={{ scale: 1.02 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 opacity-40"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                    width: '50%',
                  }}
                />
                
                {/* Icon box with 3D effect */}
                <motion.div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #D97706, #B45309)',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)',
                  }}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div 
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 50%)',
                    }}
                  />
                  <Coins className="w-9 h-9 text-white drop-shadow-md relative z-10" />
                </motion.div>
                
                <div className="relative z-10">
                  <p className="text-sm font-bold text-amber-800">
                    Số dư CAMLY
                  </p>
                  <motion.p 
                    className="text-3xl md:text-4xl font-bold font-fredoka text-amber-600"
                    style={{
                      textShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                    key={camlyBalance}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {camlyBalance.toLocaleString()} <span className="text-lg">CAMLY</span>
                  </motion.p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
