import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Sparkles, Check } from 'lucide-react';
import { ReactNode } from 'react';

interface RewardPlanetCardProps {
  title: string;
  subtitle: string;
  amount: number;
  icon: ReactNode;
  gradientFrom: string;
  gradientTo: string;
  description: string;
  canClaim: boolean;
  isClaiming: boolean;
  isConnected: boolean;
  onClaim: () => void;
  buttonText?: string;
  isSpecial?: boolean;
  showHeart?: boolean;
  delay?: number;
}

export const RewardPlanetCard = ({
  title,
  subtitle,
  amount,
  icon,
  gradientFrom,
  gradientTo,
  description,
  canClaim,
  isClaiming,
  isConnected,
  onClaim,
  buttonText,
  isSpecial,
  showHeart,
  delay = 0,
}: RewardPlanetCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.03, y: -5 }}
      className="relative group"
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-500`} />
      
      <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 overflow-hidden h-full">
        {/* Special badge */}
        {isSpecial && (
          <div className="absolute top-3 right-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-2xl">👑</span>
            </motion.div>
          </div>
        )}

        {/* Heart for referral */}
        {showHeart && (
          <div className="absolute top-3 right-3">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
            </motion.div>
          </div>
        )}

        {/* Planet Icon */}
        <motion.div 
          className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-2xl mb-4`}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          whileHover={{ scale: 1.1 }}
          style={{
            boxShadow: `0 0 30px rgba(255,255,255,0.3), 0 10px 40px rgba(0,0,0,0.3)`,
          }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-white"
          >
            {icon}
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-xl font-fredoka font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-white/60 mb-3">{subtitle}</p>
          
          {/* Amount */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <motion.span 
              className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {amount.toLocaleString()}
            </motion.span>
            <span className="text-lg text-yellow-300 font-bold">$C</span>
          </div>
          
          <p className="text-xs text-white/50 mb-4">{description}</p>

          {/* Claim Button */}
          <Button
            onClick={onClaim}
            disabled={isClaiming || (!canClaim && !buttonText)}
            className={`w-full relative overflow-hidden rounded-xl font-bold py-5 ${
              canClaim || buttonText
                ? `bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 text-white shadow-lg`
                : 'bg-white/10 text-white/50'
            }`}
          >
            {/* Shimmer effect */}
            {(canClaim || buttonText) && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            )}
            
            <span className="relative flex items-center justify-center gap-2">
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : !canClaim && !buttonText ? (
                <>
                  <Check className="w-5 h-5" />
                  Đã nhận
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {buttonText || `Nhận ${amount.toLocaleString()} $C`}
                </>
              )}
            </span>
          </Button>
        </div>

        {/* Floating particles */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-white/40"
            style={{
              left: `${20 + i * 30}%`,
              bottom: '20%',
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};
