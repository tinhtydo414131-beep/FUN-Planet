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
      {/* Outer glow - softer for light theme */}
      <div className="relative">
        <motion.div 
          className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-yellow-300/40 via-pink-300/30 to-yellow-300/40 blur-2xl"
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* White background */}
        <motion.div 
          className="relative p-8 rounded-[28px] overflow-hidden bg-white"
          style={{
            boxShadow: '0 15px 50px rgba(255, 182, 193, 0.25), inset 0 2px 4px rgba(255,255,255,0.9)',
          }}
        >
          {/* Animated shine sweep */}
          <motion.div
            className="absolute inset-0 opacity-50 pointer-events-none"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)',
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
                opacity: [0.4, 0.9, 0.4],
                scale: [0.9, 1.4, 0.9],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.25,
              }}
            >
              {i % 3 === 0 ? (
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" style={{ filter: 'drop-shadow(0 0 6px #FFD700)' }} />
              ) : i % 3 === 1 ? (
                <Sparkles className="w-5 h-5 text-pink-500" style={{ filter: 'drop-shadow(0 0 6px #FF69B4)' }} />
              ) : (
                <Star className="w-4 h-4 text-blue-500 fill-blue-400" style={{ filter: 'drop-shadow(0 0 6px #60A5FA)' }} />
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
            <Sparkles className="w-10 h-10 text-yellow-500" style={{ filter: 'drop-shadow(0 0 10px #FFD700)' }} />
          </motion.div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Wallet Status */}
            <div className="flex items-center gap-6">
              {/* Circular icon with 3D effect */}
              <motion.div 
                className="w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{
                  background: isConnected 
                    ? 'linear-gradient(135deg, #22C55E 0%, #16A34A 40%, #15803D 100%)'
                    : 'linear-gradient(135deg, #A855F7 0%, #9333EA 40%, #7E22CE 100%)',
                  boxShadow: isConnected
                    ? '0 10px 35px rgba(34, 197, 94, 0.5), inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.2)'
                    : '0 10px 35px rgba(168, 85, 247, 0.5), inset 0 4px 8px rgba(255,255,255,0.4), inset 0 -4px 8px rgba(0,0,0,0.2)',
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
                {/* Title with gradient - Yellow Pink Blue */}
                <p 
                  className="text-2xl md:text-3xl font-fredoka font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FF69B4, #60A5FA)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
                  }}
                >
                  {isConnected ? '✨ Ví Ánh Sáng Của Con ✨' : 'Kết nối ví để nhận thưởng'}
                </p>
                {isConnected && walletAddress ? (
                  <motion.p 
                    className="text-xl md:text-2xl font-mono font-bold px-4 py-2 mt-2 rounded-full inline-block"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 105, 180, 0.1))',
                      color: '#A855F7',
                      border: '2px solid rgba(255, 215, 0, 0.4)',
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
                        boxShadow: '0 8px 30px rgba(168, 85, 247, 0.4), inset 0 2px 4px rgba(255,255,255,0.25)',
                      }}
                    >
                      <Wallet className="w-6 h-6 mr-2" />
                      Kết nối MetaMask
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>

            {/* CAMLY Balance */}
            {isConnected && (
              <motion.div 
                className="flex items-center gap-5 p-6 rounded-3xl relative overflow-hidden bg-white"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                style={{
                  border: '3px solid rgba(255, 215, 0, 0.6)',
                  boxShadow: '0 8px 35px rgba(255, 215, 0, 0.2), inset 0 2px 4px rgba(255,255,255,0.5)',
                }}
                whileHover={{ scale: 1.03 }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 opacity-30"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.5), transparent)',
                    width: '50%',
                  }}
                />
                
                {/* Icon box with 3D effect */}
                <motion.div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center relative"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #D97706, #B45309)',
                    boxShadow: '0 8px 30px rgba(245, 158, 11, 0.5), inset 0 3px 6px rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.2)',
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
                    className="text-xl md:text-2xl font-fredoka font-bold tracking-wide"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700, #FF69B4)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Số dư CAMLY
                  </p>
                  <motion.p 
                    className="text-4xl md:text-5xl font-bold font-fredoka"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                      backgroundSize: '200% 200%',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.3))',
                    }}
                    key={camlyBalance}
                    initial={{ scale: 1.2 }}
                    animate={{ 
                      scale: 1,
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{ 
                      scale: { duration: 0.3 },
                      backgroundPosition: { duration: 3, repeat: Infinity }
                    }}
                  >
                    {camlyBalance.toLocaleString()} <span className="text-xl" style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CAMLY</span>
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
