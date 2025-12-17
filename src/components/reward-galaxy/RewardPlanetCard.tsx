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
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 80, damping: 15 }}
      whileHover={{ scale: 1.05, y: -8 }}
      className="relative group"
    >
      {/* Golden glow border effect */}
      <div 
        className="absolute -inset-[2px] rounded-[26px] opacity-70 group-hover:opacity-100 transition-all duration-500"
        style={{
          background: 'linear-gradient(135deg, #FFD700, #FFEC8B, #FFD700, #FFAA00)',
          boxShadow: '0 0 25px rgba(255, 215, 0, 0.4)',
        }}
      />
      
      {/* Card background - Glassmorphism */}
      <div 
        className="relative p-6 rounded-3xl overflow-hidden h-full"
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(10px)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.3), 0 10px 40px rgba(0,0,0,0.1)',
        }}
      >
        {/* Inner glossy reflection */}
        <div 
          className="absolute inset-x-0 top-0 h-1/2 opacity-15 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.5), transparent)',
            borderRadius: '24px 24px 50% 50%',
          }}
        />

        {/* Sparkle effects on hover */}
        <motion.div
          className="absolute top-4 left-4 w-2 h-2 rounded-full"
          style={{ background: '#FFD700', boxShadow: '0 0 8px #FFD700' }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />
        <motion.div
          className="absolute top-8 right-6 w-1.5 h-1.5 rounded-full"
          style={{ background: '#FFEC8B', boxShadow: '0 0 6px #FFEC8B' }}
          animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}
        />
        <motion.div
          className="absolute bottom-12 left-6 w-1.5 h-1.5 rounded-full"
          style={{ background: '#FFAA00', boxShadow: '0 0 6px #FFAA00' }}
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
              <span className="text-2xl drop-shadow-lg" style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }}>👑</span>
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
              <Heart className="w-7 h-7 text-[#FFD700] fill-[#FFD700]" style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }} />
            </motion.div>
          </div>
        )}

        {/* Planet Icon - 3D metallic gold */}
        <motion.div 
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          whileHover={{ scale: 1.15 }}
          style={{
            background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FF8C00 100%)',
            boxShadow: '0 0 35px rgba(255, 215, 0, 0.6), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.1)',
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
          
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="text-white relative z-10"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
          >
            {icon}
          </motion.div>
          
          {/* Sparkle on icon */}
          <motion.div
            className="absolute -top-1 -right-1 w-5 h-5"
            animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-[#FFD700] fill-[#FFD700]" style={{ filter: 'drop-shadow(0 0 6px #FFD700)' }} />
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="text-center">
          <h3 
            className="text-xl font-fredoka font-bold mb-1"
            style={{ color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            {title}
          </h3>
          <p className="text-sm mb-3" style={{ color: '#FFF8DC' }}>{subtitle}</p>
          
          {/* Amount with gold metallic gradient and shimmer */}
          <div className="flex items-center justify-center gap-1 mb-3 relative">
            <motion.span 
              className="text-4xl font-bold font-fredoka"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 30%, #FFEC8B 60%, #FFD700 100%)',
                backgroundSize: '200% 200%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 4px rgba(255, 170, 0, 0.5))',
              }}
              animate={{ 
                scale: [1, 1.05, 1],
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {amount.toLocaleString()}
            </motion.span>
            <span 
              className="text-lg font-bold"
              style={{ color: '#FFEC8B', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}
            >
              $C
            </span>
          </div>
          
          <p className="text-sm mb-4" style={{ color: '#FFF8DC' }}>{description}</p>

          {/* Claim Button - Golden metallic */}
          <Button
            onClick={onClaim}
            disabled={isClaiming || (!canClaim && !buttonText)}
            className="w-full relative overflow-hidden rounded-2xl font-bold py-5 transition-all duration-300"
            style={{
              background: canClaim || buttonText
                ? 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FF8C00 100%)'
                : !canClaim && !buttonText
                ? 'linear-gradient(135deg, #90EE90 0%, #7CFC00 100%)'
                : 'linear-gradient(135deg, #DDA0DD 0%, #E6E6FA 100%)',
              boxShadow: canClaim || buttonText
                ? '0 0 25px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)'
                : '0 4px 15px rgba(0,0,0,0.1)',
              color: canClaim || buttonText ? '#FFFFFF' : (!canClaim && !buttonText ? '#1B5E20' : '#6B5B95'),
              textShadow: canClaim || buttonText ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
            }}
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
                  Đã nhận hôm nay! ✨
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {buttonText || `Nhận ${amount.toLocaleString()} $C`}
                </>
              )}
            </span>
          </Button>

          {/* "Back Tomorrow" indicator */}
          {!canClaim && !buttonText && (
            <motion.div 
              className="mt-3 flex items-center justify-center gap-1 text-xs"
              style={{ color: '#FFEC8B' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Quay lại ngày mai nhé! 😊</span>
            </motion.div>
          )}
        </div>

        {/* Floating golden particles on hover */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full opacity-0 group-hover:opacity-100"
            style={{
              left: `${15 + i * 25}%`,
              bottom: '15%',
              background: '#FFD700',
              boxShadow: '0 0 8px #FFD700',
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
