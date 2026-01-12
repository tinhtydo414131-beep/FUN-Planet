import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Loader2, Heart, Sparkles, Check, CalendarCheck, Gift, Star } from 'lucide-react';
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
  isOneTime?: boolean;
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
  isOneTime = false,
}: RewardPlanetCardProps) => {
  // Default card gradient if not provided
  const bgGradient = cardGradient || 'from-white/90 to-white/70';

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 80, damping: 15 }}
      whileHover={{ scale: 1.06, y: -10 }}
      className="relative group"
    >
      {/* Metallic gold gradient border - thicker */}
      <div className="absolute -inset-[4px] rounded-[32px] bg-gradient-to-br from-[#FFD700] via-[#FFF8DC] via-[#FFD700] via-[#DAA520] to-[#FFD700] opacity-90 group-hover:opacity-100 transition-all duration-500" />
      <div className="absolute -inset-[3px] rounded-[31px] bg-gradient-to-tr from-[#DAA520] via-[#FFD700] via-[#FFFACD] to-[#DAA520] opacity-85" />
      
      {/* Glow effect - stronger */}
      <motion.div 
        className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#FFD700]/50 via-[#FFF8DC]/40 to-[#FFD700]/50 blur-xl group-hover:blur-2xl transition-all duration-500"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Card background with pastel gradient */}
      <div className={`relative p-4 md:p-5 rounded-[28px] bg-gradient-to-br ${bgGradient} backdrop-blur-sm border-0 overflow-hidden h-full shadow-xl shadow-[#FFD700]/15`}>
        
        {/* Special badge */}
        {isSpecial && (
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-3xl" style={{ filter: 'drop-shadow(0 0 10px rgba(255,215,0,0.8))' }}>👑</span>
            </motion.div>
          </div>
        )}

        {/* Heart for referral */}
        {showHeart && (
          <div className="absolute top-4 right-4">
            <motion.div
              animate={{ scale: [1, 1.35, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <Heart className="w-9 h-9 text-[#FF69B4] fill-[#FF69B4]" style={{ filter: 'drop-shadow(0 0 15px #FF69B4)' }} />
            </motion.div>
          </div>
        )}

        {/* Planet Icon with glow */}
        <motion.div 
          className={`w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4 relative`}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          whileHover={{ scale: 1.18 }}
          style={{
            boxShadow: `0 0 35px rgba(255, 215, 0, 0.5), 0 10px 40px rgba(0,0,0,0.2)`,
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-white/25 blur-sm" />
          {/* Highlight overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent" />
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-white relative z-10"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
          >
            {icon}
          </motion.div>
          
          {/* Sparkle on icon */}
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6"
            animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-[#FFD700] fill-[#FFD700]" style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }} />
          </motion.div>
          
          {/* Orbiting star */}
          <motion.div
            className="absolute -bottom-1 -left-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Star className="w-5 h-5 text-[#FF69B4] fill-[#FF69B4]" style={{ filter: 'drop-shadow(0 0 6px #FF69B4)' }} />
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="text-center">
          {/* Title - gradient text */}
          <h3 
            className="text-lg md:text-xl font-fredoka font-bold mb-1 tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #EC4899, #7C3AED)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
            }}
          >
            {title}
          </h3>
          <p className="text-sm md:text-base text-[#7C3AED] font-fredoka font-semibold mb-3 tracking-wide" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>{subtitle}</p>
          
          {/* Amount with gold gradient and shimmer */}
          <div className="flex items-center justify-center gap-1.5 mb-3 relative">
            <motion.span 
              className="text-2xl md:text-3xl font-bold font-fredoka"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
              }}
              animate={{ 
                scale: [1, 1.06, 1],
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {amount.toLocaleString()}
            </motion.span>
            <span 
              className="text-base md:text-lg font-bold"
              style={{
                color: '#B8860B',
                textShadow: '0 0 15px rgba(255,215,0,0.7)',
              }}
            >
              CAMLY
            </span>
          </div>
          
          {/* Description - darker purple with shadow */}
          <p 
            className="text-xs md:text-sm mb-4 font-fredoka font-semibold leading-relaxed"
            style={{
              color: '#7C3AED',
              textShadow: '0 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            {description}
          </p>

          {/* Claim Button - Pastel style */}
          <Button
            onClick={onClaim}
            disabled={isClaiming || (!canClaim && !buttonText)}
            className={`w-full relative overflow-hidden rounded-xl font-bold py-4 text-sm md:text-base transition-all duration-300 ${
              canClaim || buttonText
                ? 'bg-gradient-to-r from-[#98FB98] to-[#90EE90] hover:from-[#7CFC00] hover:to-[#98FB98] text-[#1B5E20] shadow-lg shadow-[#98FB98]/40 border-2 border-[#7CFC00]/40'
                : !canClaim && !buttonText
                ? 'bg-gradient-to-r from-[#98FB98]/80 to-[#90EE90]/80 text-[#2E7D32] border-2 border-[#7CFC00]/30'
                : 'bg-gradient-to-r from-[#DDA0DD] to-[#E6E6FA] text-[#6B5B95] border-2 border-[#DDA0DD]/30'
            }`}
            style={{
              boxShadow: canClaim || buttonText ? '0 6px 25px rgba(152, 251, 152, 0.4)' : undefined,
            }}
          >
            {/* Shimmer effect */}
            {(canClaim || buttonText) && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            )}
            
            <span className="relative flex items-center justify-center gap-1.5">
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang xử lý...
                </>
              ) : !canClaim && !buttonText ? (
                <>
                  <Check className="w-5 h-5" />
                  {isOneTime ? 'Đã nhận thưởng! ✨' : 'Đã nhận hôm nay! ✨'}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {buttonText || `Nhận ${amount.toLocaleString()} CAMLY`}
                </>
              )}
            </span>
          </Button>

          {/* "Back Tomorrow" indicator - only show for daily rewards, not one-time rewards */}
          {!canClaim && !buttonText && !isOneTime && (
            <motion.div 
              className="mt-3 flex items-center justify-center gap-1.5 text-sm md:text-base text-[#7C3AED] font-fredoka font-bold tracking-wide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{ textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}
            >
              <CalendarCheck className="w-5 h-5" />
              <span>Quay lại ngày mai nhé! 😊</span>
            </motion.div>
          )}

          {/* One-time reward indicator */}
          {!canClaim && !buttonText && isOneTime && (
            <motion.div 
              className="mt-3 flex items-center justify-center gap-1.5 text-xs md:text-sm text-[#2E7D32] font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Gift className="w-4 h-4" />
              <span>Phần thưởng chỉ nhận 1 lần 🎁</span>
            </motion.div>
          )}
        </div>

      </div>
    </motion.div>
  );
};
