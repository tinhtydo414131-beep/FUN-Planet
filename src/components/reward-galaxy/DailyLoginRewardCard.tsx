import { motion } from 'framer-motion';
import { Calendar, Check, Loader2, Star, Sparkles, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
      {/* Glow border effect - Light yellow */}
      <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-[#FFFACD] via-[#FFE4B5] to-[#98FB98] opacity-70 blur-sm group-hover:opacity-100 group-hover:blur-md transition-all duration-500" />
      
      {/* Card with mint green to warm yellow gradient */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#98FB98]/90 via-[#F0FFF0]/95 to-[#FFFACD]/90 border-2 border-[#FFFACD]/60 rounded-3xl backdrop-blur-sm shadow-lg shadow-[#98FB98]/20 h-full">
        <CardContent className="p-6">
          {/* Sparkle effects */}
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
            className="absolute bottom-16 left-6 w-1.5 h-1.5 rounded-full bg-[#87CEEB]"
            animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
          />

          {/* Planet Icon with glow */}
          <motion.div
            className="relative w-20 h-20 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            <div 
              className="w-full h-full rounded-full bg-gradient-to-br from-[#3CB371] via-[#98FB98] to-[#FFD700] flex items-center justify-center"
              style={{
                boxShadow: '0 0 25px rgba(152, 251, 152, 0.5), 0 8px 30px rgba(0,0,0,0.15)',
              }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-full bg-white/20 blur-sm" />
              <Calendar className="w-10 h-10 text-white relative z-10 drop-shadow-lg" />
            </div>
            
            {/* Orbiting star with sparkle */}
            <motion.div
              className="absolute -top-2 -right-2"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-6 h-6 text-[#FFD700] fill-[#FFD700] drop-shadow-lg" />
            </motion.div>
            
            {/* Additional sparkle */}
            <motion.div
              className="absolute -bottom-1 -left-1"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-[#FF69B4] fill-[#FF69B4]" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <h3 className="text-lg font-fredoka font-bold text-[#2E7D32] text-center mb-1 drop-shadow-sm">
            Đăng Nhập Hàng Ngày
          </h3>
          <p className="text-[#4A7C59] text-sm text-center mb-3">Daily Login Reward</p>

          {/* Amount with gold shimmer */}
          <div className="text-center mb-4">
            <motion.span 
              className="text-3xl font-fredoka font-bold"
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
              5,000
            </motion.span>
            <span className="text-[#FFD700] ml-1 font-bold drop-shadow-sm">$C</span>
          </div>

          {/* Description */}
          <p className="text-[#6B8E6B] text-sm text-center mb-4">
            Mỗi ngày đăng nhập nhận quà từ Cha Vũ Trụ 🌟
          </p>

          {/* Status Badge - Received today */}
          {!canClaim && !isChecking && (
            <Badge className="w-full justify-center py-2 bg-gradient-to-r from-[#98FB98] to-[#90EE90] text-[#2E7D32] border-2 border-[#7CFC00]/30 mb-3 font-bold">
              <Check className="w-4 h-4 mr-1" />
              Đã nhận hôm nay! ✨
            </Badge>
          )}

          {/* Claim Button - Pastel mint green */}
          <Button
            onClick={onClaim}
            disabled={!canClaim || isClaiming || isChecking}
            className={`w-full font-fredoka font-bold py-5 rounded-2xl transition-all relative overflow-hidden ${
              canClaim
                ? 'bg-gradient-to-r from-[#98FB98] to-[#7CFC00] hover:from-[#7CFC00] hover:to-[#98FB98] text-[#1B5E20] shadow-lg shadow-[#98FB98]/40 border-2 border-[#7CFC00]/30'
                : 'bg-gradient-to-r from-[#DDA0DD]/80 to-[#E6E6FA]/80 text-[#6B5B95] border-2 border-[#DDA0DD]/30'
            }`}
          >
            {/* Shimmer effect */}
            {canClaim && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
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
        </CardContent>
      </Card>

      {/* Floating particles on hover */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            left: `${15 + i * 25}%`,
            bottom: '15%',
            background: i % 2 === 0 ? '#FFD700' : '#98FB98',
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
