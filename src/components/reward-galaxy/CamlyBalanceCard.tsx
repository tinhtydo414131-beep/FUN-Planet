import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import camlyCoin from '@/assets/camly-coin.png';

interface CamlyBalanceCardProps {
  balance: number;
}

export const CamlyBalanceCard = ({ balance }: CamlyBalanceCardProps) => {
  // Format number with dots (Vietnamese format)
  const formatBalance = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mb-8"
    >
      <div className="relative max-w-md mx-auto">
        {/* Outer glow */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FFD700]/40 via-[#FFEC8B]/30 to-[#FFD700]/40 blur-lg" />
        
        {/* Main card */}
        <div 
          className="relative px-5 py-4 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FFE566 0%, #FFD93D 30%, #FFC107 70%, #FFAB00 100%)',
            boxShadow: '0 8px 32px rgba(255, 193, 7, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
          }}
        >
          {/* Shine effect */}
          <div 
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 40%)',
            }}
          />
          
          {/* Top right star */}
          <motion.div 
            className="absolute top-2 right-2"
            animate={{ rotate: 360, scale: [1, 1.2, 1] }}
            transition={{ 
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          >
            <Star className="w-5 h-5 text-[#FF8C00] fill-[#FF8C00] drop-shadow-sm" />
          </motion.div>
          
          {/* Bottom left star */}
          <motion.div 
            className="absolute bottom-2 left-2"
            animate={{ opacity: [0.6, 1, 0.6], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
          </motion.div>

          <div className="relative z-10 flex items-center gap-4">
            {/* Camly Coin Icon */}
            <motion.div 
              className="w-14 h-14 rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #FFB300 0%, #FF8F00 100%)',
                boxShadow: '0 4px 15px rgba(255, 143, 0, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
              }}
              whileHover={{ scale: 1.05 }}
            >
              <img 
                src={camlyCoin} 
                alt="Camly Coin" 
                className="w-10 h-10 object-contain drop-shadow-md"
              />
            </motion.div>
            
            {/* Balance Info */}
            <div className="flex-1">
              <p 
                className="text-sm font-jakarta font-semibold mb-0.5"
                style={{ color: '#5D4E37' }}
              >
                Số dư CAMLY
              </p>
              <div className="flex items-baseline gap-1.5">
                <motion.p 
                  className="text-2xl md:text-3xl font-fredoka font-bold"
                  style={{ 
                    color: '#1A237E',
                    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                  key={balance}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {formatBalance(balance)}
                </motion.p>
                <span 
                  className="text-base md:text-lg font-bold"
                  style={{ color: '#FF6F00' }}
                >
                  $C
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
