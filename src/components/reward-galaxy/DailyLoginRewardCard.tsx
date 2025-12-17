import { motion } from 'framer-motion';
import { Calendar, Check, Loader2, Star, Sparkles, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DailyLoginRewardCardProps {
  canClaim: boolean;
  isClaiming: boolean;
  isChecking: boolean;
  onClaim: () => void;
  delay?: number;
}

export function DailyLoginRewardCard({
  canClaim,
  isClaiming,
  isChecking,
  onClaim,
  delay = 0,
}: DailyLoginRewardCardProps) {
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
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
        }}
      />
      
      {/* Card - Glassmorphism */}
      <div 
        className="relative overflow-hidden rounded-3xl h-full"
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

        <div className="p-6 relative z-10">
          {/* Sparkle effects */}
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
            className="absolute bottom-16 left-6 w-1.5 h-1.5 rounded-full"
            style={{ background: '#FFAA00', boxShadow: '0 0 6px #FFAA00' }}
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          />

          {/* Planet Icon - 3D metallic gold */}
          <motion.div
            className="relative w-20 h-20 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            <div 
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FF8C00 100%)',
                boxShadow: '0 0 35px rgba(255, 215, 0, 0.6), inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.1)',
              }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
              <Calendar className="w-10 h-10 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            </div>
            
            {/* Orbiting star */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-6 h-6 text-[#FFD700] fill-[#FFD700]" style={{ filter: 'drop-shadow(0 0 8px #FFD700)' }} />
            </motion.div>
            
            {/* Additional sparkle */}
            <motion.div
              className="absolute -bottom-1 -left-1"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-5 h-5 text-[#FFEC8B] fill-[#FFEC8B]" style={{ filter: 'drop-shadow(0 0 6px #FFEC8B)' }} />
            </motion.div>
          </motion.div>

          {/* Title */}
          <h3 
            className="text-xl font-fredoka font-bold text-center mb-1"
            style={{ color: '#FFFFFF', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
          >
            Đăng Nhập Hàng Ngày
          </h3>
          <p className="text-sm text-center mb-3" style={{ color: '#FFF8DC' }}>Daily Login Reward</p>

          {/* Amount with gold metallic shimmer */}
          <div className="text-center mb-4">
            <motion.span 
              className="text-4xl font-fredoka font-bold"
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
              5,000
            </motion.span>
            <span 
              className="ml-1 font-bold text-lg"
              style={{ color: '#FFEC8B', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}
            >
              $C
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-center mb-4" style={{ color: '#FFF8DC' }}>
            Mỗi ngày đăng nhập nhận quà từ Cha Vũ Trụ 🌟
          </p>

          {/* Status Badge - Received today */}
          {!canClaim && !isChecking && (
            <Badge 
              className="w-full justify-center py-2 mb-3 font-bold"
              style={{
                background: 'linear-gradient(135deg, #90EE90 0%, #7CFC00 100%)',
                color: '#1B5E20',
                border: 'none',
              }}
            >
              <Check className="w-4 h-4 mr-1" />
              Đã nhận hôm nay! ✨
            </Badge>
          )}

          {/* Claim Button - Golden metallic */}
          <Button
            onClick={onClaim}
            disabled={!canClaim || isClaiming || isChecking}
            className="w-full font-fredoka font-bold py-5 rounded-2xl transition-all relative overflow-hidden"
            style={{
              background: canClaim
                ? 'linear-gradient(135deg, #FFD700 0%, #FFAA00 50%, #FF8C00 100%)'
                : 'linear-gradient(135deg, #DDA0DD 0%, #E6E6FA 100%)',
              boxShadow: canClaim
                ? '0 0 25px rgba(255, 215, 0, 0.5), inset 0 2px 4px rgba(255,255,255,0.3)'
                : '0 4px 15px rgba(0,0,0,0.1)',
              color: canClaim ? '#FFFFFF' : '#6B5B95',
              textShadow: canClaim ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            {/* Shimmer effect */}
            {canClaim && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            )}
            
            <span className="relative flex items-center justify-center gap-2">
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : isClaiming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang nhận...
                </>
              ) : canClaim ? (
                <>
                  <Star className="w-5 h-5" />
                  Nhận Thưởng
                </>
              ) : (
                <>
                  <CalendarCheck className="w-5 h-5" />
                  Quay lại ngày mai 😊
                </>
              )}
            </span>
          </Button>
        </div>
      </div>

      {/* Floating golden particles on hover */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none"
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
    </motion.div>
  );
}
