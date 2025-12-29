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
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="mb-12"
    >
      {/* Outer glow - stronger */}
      <div className="relative">
        <motion.div 
          className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-amber-400/60 via-yellow-300/50 to-amber-400/60 blur-3xl"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Metallic gold border - thicker 6px */}
        <div className="absolute -inset-[6px] rounded-[34px] bg-gradient-to-br from-yellow-400 via-amber-200 via-yellow-500 via-amber-600 to-yellow-400" />
        <div className="absolute -inset-[5px] rounded-[33px] bg-gradient-to-tr from-amber-500 via-yellow-100 via-amber-300 to-yellow-500" />
        
        {/* Warm cream/gold background */}
        <motion.div 
          className="relative p-8 rounded-[28px] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FEF3C7 0%, #FEF9C3 25%, #FFFBEB 50%, #FDE68A 75%, #FED7AA 100%)',
            boxShadow: '0 15px 50px rgba(251, 191, 36, 0.5), inset 0 3px 8px rgba(255,255,255,0.95)',
          }}
        >
          {/* Animated shine sweep */}
          <motion.div
            className="absolute inset-0 opacity-70 pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
              width: '40%',
            }}
          />
          
          {/* Floating sparkle particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 3) * 30}%`,
              }}
              animate={{
                y: [0, -12, 0],
                opacity: [0.5, 1, 0.5],
                scale: [0.9, 1.4, 0.9],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.25,
              }}
            >
              {i % 2 === 0 ? (
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" style={{ filter: 'drop-shadow(0 0 8px #F59E0B)' }} />
              ) : (
                <Sparkles className="w-5 h-5 text-yellow-500" style={{ filter: 'drop-shadow(0 0 8px #EAB308)' }} />
              )}
            </motion.div>
          ))}
          
          {/* Corner sparkle */}
          <motion.div
            className="absolute top-5 right-5"
            animate={{ rotate: 360, scale: [1, 1.3, 1] }}
            transition={{ 
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <Sparkles className="w-10 h-10 text-amber-500" style={{ filter: 'drop-shadow(0 0 15px #F59E0B)' }} />
          </motion.div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Wallet Status */}
            <div className="flex items-center gap-6">
              {/* Circular icon with 3D effect - BIGGER */}
              <motion.div 
                className="w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{
                  background: isConnected 
                    ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 40%, #15803D 100%)'
                    : 'linear-gradient(135deg, #A855F7 0%, #9333EA 40%, #7E22CE 100%)',
                  boxShadow: isConnected
                    ? '0 10px 35px rgba(34, 197, 94, 0.6), inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.25)'
                    : '0 10px 35px rgba(168, 85, 247, 0.6), inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.25)',
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Shine overlay */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, transparent 50%)',
                  }}
                />
                {isConnected ? (
                  <Check className="w-11 h-11 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                ) : (
                  <Wallet className="w-11 h-11 text-white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                )}
              </motion.div>
              
              <div>
                {/* Title with gradient - BIGGER */}
                <p 
                  className="text-2xl md:text-3xl font-fredoka font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED, #EC4899, #7C3AED)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                  }}
                >
                  {isConnected ? '✨ Ví Ánh Sáng Của Con ✨' : 'Kết nối ví để nhận thưởng'}
                </p>
                {isConnected && walletAddress ? (
                  <motion.p 
                    className="text-xl md:text-2xl font-mono font-bold px-4 py-2 mt-2 rounded-full inline-block"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))',
                      color: '#7C3AED',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                    }}
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
                      className="mt-3 font-bold text-white text-xl px-8 py-4 h-auto rounded-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #A855F7, #9333EA, #7E22CE)',
                        boxShadow: '0 8px 30px rgba(168, 85, 247, 0.5), inset 0 2px 4px rgba(255,255,255,0.25)',
                      }}
                    >
                      <Wallet className="w-6 h-6 mr-2" />
                      Kết nối MetaMask
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* CAMLY Balance - enhanced BIGGER */}
            {isConnected && (
              <motion.div 
                className="flex items-center gap-5 p-6 rounded-3xl relative overflow-hidden"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                style={{
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.4))',
                  border: '4px solid rgba(251, 191, 36, 0.8)',
                  boxShadow: '0 8px 35px rgba(251, 191, 36, 0.4), inset 0 2px 4px rgba(255,255,255,0.35)',
                }}
                whileHover={{ scale: 1.03 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 opacity-50"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)',
                    width: '50%',
                  }}
                />
                
                {/* Icon box with 3D effect - BIGGER */}
                <motion.div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #D97706, #B45309)',
                    boxShadow: '0 8px 30px rgba(245, 158, 11, 0.6), inset 0 3px 6px rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.25)',
                  }}
                  animate={{ rotate: [0, 6, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <div 
                    className="absolute inset-0 rounded-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)',
                    }}
                  />
                  <Coins className="w-11 h-11 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
                </motion.div>
                
                <div className="relative z-10">
                  <p 
                    className="text-lg font-bold"
                    style={{
                      color: '#92400E',
                      textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                    }}
                  >
                    Số dư CAMLY
                  </p>
                  <motion.p 
                    className="text-4xl md:text-5xl font-bold font-fredoka"
                    style={{
                      background: 'linear-gradient(135deg, #F59E0B, #D97706, #B45309)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                    }}
                    key={camlyBalance}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {camlyBalance.toLocaleString()} <span className="text-xl">CAMLY</span>
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
