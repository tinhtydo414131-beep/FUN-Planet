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
      whileHover={{ scale: 1.06, y: -10 }}
      className="relative group"
    >
      {/* Metallic gold gradient border - thicker */}
      <div className="absolute -inset-[4px] rounded-[32px] bg-gradient-to-br from-[#FFD700] via-[#FFF8DC] via-[#FFD700] via-[#DAA520] to-[#FFD700] opacity-90 group-hover:opacity-100 transition-all duration-500" />
      <div className="absolute -inset-[3px] rounded-[31px] bg-gradient-to-tr from-[#DAA520] via-[#FFD700] via-[#FFFACD] to-[#DAA520] opacity-85" />
      
      {/* Glow effect - stronger */}
      <motion.div 
        className="absolute -inset-3 rounded-[36px] bg-gradient-to-r from-[#98FB98]/50 via-[#FFD700]/40 to-[#98FB98]/50 blur-xl group-hover:blur-2xl transition-all duration-500"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
      {/* Card with mint green to warm yellow gradient */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#98FB98]/90 via-[#F0FFF0]/95 to-[#FFFACD]/90 border-0 rounded-[28px] backdrop-blur-sm shadow-xl shadow-[#98FB98]/25 h-full">
        <CardContent className="p-7">
          {/* Sparkle effects */}
          <motion.div
            className="absolute top-5 left-5 w-3 h-3 rounded-full bg-[#FFD700]"
            animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            style={{ boxShadow: '0 0 10px #FFD700' }}
          />
          <motion.div
            className="absolute top-10 right-7 w-2 h-2 rounded-full bg-[#FF69B4]"
            animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            style={{ boxShadow: '0 0 8px #FF69B4' }}
          />
          <motion.div
            className="absolute bottom-20 left-7 w-2 h-2 rounded-full bg-[#87CEEB]"
            animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
            style={{ boxShadow: '0 0 8px #87CEEB' }}
          />

          {/* Planet Icon with glow - BIGGER */}
          <motion.div
            className="relative w-24 h-24 mx-auto mb-5"
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            <div 
              className="w-full h-full rounded-full bg-gradient-to-br from-[#3CB371] via-[#98FB98] to-[#FFD700] flex items-center justify-center"
              style={{
                boxShadow: '0 0 35px rgba(152, 251, 152, 0.6), 0 10px 40px rgba(0,0,0,0.2)',
              }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-full bg-white/25 blur-sm" />
              {/* Highlight */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent" />
              <Calendar className="w-12 h-12 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            </div>
            
            {/* Orbiting star with sparkle - BIGGER */}
            <motion.div
              className="absolute -top-3 -right-3"
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-8 h-8 text-[#FFD700] fill-[#FFD700]" style={{ filter: 'drop-shadow(0 0 12px #FFD700)' }} />
            </motion.div>
            
            {/* Additional sparkle */}
            <motion.div
              className="absolute -bottom-2 -left-2"
              animate={{ scale: [1, 1.4, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-[#FF69B4] fill-[#FF69B4]" style={{ filter: 'drop-shadow(0 0 8px #FF69B4)' }} />
            </motion.div>
          </motion.div>

          {/* Title - gradient text, BIGGER */}
          <h3 
            className="text-2xl font-fredoka font-bold text-center mb-2"
            style={{
              background: 'linear-gradient(135deg, #2E7D32, #4CAF50, #2E7D32)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
            }}
          >
            Đăng Nhập Hàng Ngày
          </h3>
          <p className="text-[#2E7D32] text-lg text-center mb-4 font-semibold" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>Daily Login Reward</p>

          {/* Amount with gold shimmer - BIGGER */}
          <div className="text-center mb-5">
            <motion.span 
              className="text-4xl md:text-5xl font-fredoka font-bold"
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
              5,000
            </motion.span>
            <span 
              className="text-xl ml-2 font-bold"
              style={{
                color: '#B8860B',
                textShadow: '0 0 15px rgba(255,215,0,0.7)',
              }}
            >
              CAMLY
            </span>
          </div>

          {/* Description */}
          <p className="text-[#2E7D32] text-base text-center mb-5 font-semibold" style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}>
            Mỗi ngày đăng nhập nhận quà từ Cha Vũ Trụ 🌟
          </p>

          {/* Status Badge - Received today */}
          {!canClaim && !isChecking && (
            <Badge 
              className="w-full justify-center py-3 mb-4 font-bold text-base"
              style={{
                background: 'linear-gradient(135deg, #98FB98, #90EE90)',
                color: '#1B5E20',
                border: '2px solid rgba(124, 252, 0, 0.4)',
                boxShadow: '0 4px 15px rgba(152, 251, 152, 0.3)',
              }}
            >
              <Check className="w-5 h-5 mr-2" />
              Đã nhận hôm nay! ✨
            </Badge>
          )}

          {/* Claim Button - Pastel mint green, BIGGER */}
          <Button
            onClick={onClaim}
            disabled={!canClaim || isClaiming || isChecking}
            className={`w-full font-fredoka font-bold py-6 rounded-2xl transition-all relative overflow-hidden text-lg ${
              canClaim
                ? 'bg-gradient-to-r from-[#98FB98] to-[#7CFC00] hover:from-[#7CFC00] hover:to-[#98FB98] text-[#1B5E20] shadow-lg shadow-[#98FB98]/50 border-2 border-[#7CFC00]/40'
                : 'bg-gradient-to-r from-[#DDA0DD]/80 to-[#E6E6FA]/80 text-[#6B5B95] border-2 border-[#DDA0DD]/30'
            }`}
            style={{
              boxShadow: canClaim ? '0 6px 25px rgba(152, 251, 152, 0.4)' : undefined,
            }}
          >
            {/* Shimmer effect */}
            {canClaim && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              />
            )}
            
            <span className="relative flex items-center justify-center gap-2">
              {isChecking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang nhận...
                </>
              ) : canClaim ? (
                <>
                  <Star className="w-6 h-6" />
                  Nhận Thưởng
                </>
              ) : (
                <span className="text-lg font-semibold">
                  <CalendarCheck className="w-6 h-6 inline mr-2" />
                  Quay lại ngày mai 😊
                </span>
              )}
            </span>
          </Button>
        </CardContent>
      </Card>

      {/* Floating particles on hover */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 pointer-events-none"
          style={{
            left: `${12 + i * 20}%`,
            bottom: '12%',
            background: i % 2 === 0 ? '#FFD700' : '#98FB98',
            boxShadow: i % 2 === 0 ? '0 0 10px #FFD700' : '0 0 10px #98FB98',
          }}
          animate={{
            y: [0, -50, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.25,
          }}
        />
      ))}
    </motion.div>
  );
}
