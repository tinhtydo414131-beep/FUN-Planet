import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Sparkles, Check, CalendarCheck } from 'lucide-react';
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
  cardGradient?: string;
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
  cardGradient,
}: RewardPlanetCardProps) => {
  // Default card gradient if not provided
  const bgGradient = cardGradient || 'from-white/90 to-white/70';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 80, damping: 15 }}
      whileHover={{ scale: 1.05, y: -8 }}
      className="relative group"
    >
      {/* Metallic gold gradient border */}
      <div className="absolute -inset-[3px] rounded-[30px] bg-gradient-to-br from-[#FFD700] via-[#FFF8DC] via-[#FFD700] via-[#DAA520] to-[#FFD700] opacity-90 group-hover:opacity-100 transition-all duration-500" />
      <div className="absolute -inset-[2px] rounded-[29px] bg-gradient-to-tr from-[#DAA520] via-[#FFD700] via-[#FFFACD] to-[#DAA520] opacity-80" />
      
      {/* Glow effect */}
      <div className="absolute -inset-2 rounded-[32px] bg-gradient-to-r from-[#FFD700]/40 via-[#FFF8DC]/30 to-[#FFD700]/40 blur-md group-hover:blur-lg transition-all duration-500" />
      
      {/* Card background with pastel gradient */}
      <div className={`relative p-6 rounded-3xl bg-gradient-to-br ${bgGradient} backdrop-blur-sm border-0 overflow-hidden h-full shadow-lg shadow-[#FFD700]/10`}>
        {/* Sparkle effects on hover */}
        <motion.div
          className="absolute top-4 left-4 w-2 h-2 rounded-full bg-[#FFD700]"
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute top-8 right-6 w-1.5 h-1.5 rounded-full bg-[#FF69B4]"
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-12 left-6 w-1.5 h-1.5 rounded-full bg-[#87CEEB]"
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
        />
        
        {/* Special badge */}
        {isSpecial && (
          <div className="absolute top-3 right-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-2xl drop-shadow-lg">👑</span>
            </motion.div>
          </div>
        )}

        {/* Heart for referral */}
        {showHeart && (
          <div className="absolute top-3 right-3">
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Heart className="w-7 h-7 text-[#FF69B4] fill-[#FF69B4] drop-shadow-lg" />
            </motion.div>
          </div>
        )}

        {/* Planet Icon with glow */}
        <motion.div 
          className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4 relative`}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          whileHover={{ scale: 1.15 }}
          style={{
            boxShadow: `0 0 25px rgba(255, 215, 0, 0.4), 0 8px 30px rgba(0,0,0,0.15)`,
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-white relative z-10 drop-shadow-lg"
          >
            {icon}
          </motion.div>
          
          {/* Sparkle on icon */}
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="text-center">
          <h3 className="text-xl font-fredoka font-bold text-[#4A4A4A] mb-1 drop-shadow-sm">{title}</h3>
          <p className="text-sm text-[#6B6B6B] mb-3">{subtitle}</p>
          
          {/* Amount with gold gradient and shimmer */}
          <div className="flex items-center justify-center gap-1 mb-3 relative">
            <motion.span 
              className="text-3xl font-bold"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 10px rgba(255, 215, 0, 0.3)',
              }}
              animate={{ 
                scale: [1, 1.05, 1],
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {amount.toLocaleString()}
            </motion.span>
            <span className="text-sm font-bold text-[#FFD700] drop-shadow-sm">CAMLY</span>
          </div>
          
          <p className="text-xs text-[#8B8B8B] mb-4">{description}</p>

          {/* Claim Button - Pastel style */}
          <Button
            onClick={onClaim}
            disabled={isClaiming || (!canClaim && !buttonText)}
            className={`w-full relative overflow-hidden rounded-2xl font-bold py-5 transition-all duration-300 ${
              canClaim || buttonText
                ? 'bg-gradient-to-r from-[#98FB98] to-[#90EE90] hover:from-[#7CFC00] hover:to-[#98FB98] text-[#2E7D32] shadow-lg shadow-[#98FB98]/30 border-2 border-[#7CFC00]/30'
                : !canClaim && !buttonText
                ? 'bg-gradient-to-r from-[#98FB98]/80 to-[#90EE90]/80 text-[#2E7D32] border-2 border-[#7CFC00]/30'
                : 'bg-gradient-to-r from-[#DDA0DD] to-[#E6E6FA] text-[#6B5B95] border-2 border-[#DDA0DD]/30'
            }`}
          >
            {/* Shimmer effect */}
            {(canClaim || buttonText) && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
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
                  Đã nhận hôm nay! ✨
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {buttonText || `Nhận ${amount.toLocaleString()} CAMLY`}
                </>
              )}
            </span>
          </Button>

          {/* "Back Tomorrow" indicator */}
          {!canClaim && !buttonText && (
            <motion.div 
              className="mt-3 flex items-center justify-center gap-1 text-xs text-[#9370DB]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Quay lại ngày mai nhé! 😊</span>
            </motion.div>
          )}
        </div>

        {/* Floating particles on hover */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-0 group-hover:opacity-100"
            style={{
              left: `${15 + i * 25}%`,
              bottom: '15%',
              background: i % 2 === 0 ? '#FFD700' : '#FF69B4',
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
};
