import { motion } from 'framer-motion';
import { Calendar, Check, Loader2, Star } from 'lucide-react';
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
      initial={{ opacity: 0, scale: 0.8, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-fun-cyan to-fun-blue rounded-3xl blur-xl opacity-30 animate-pulse" />
      
      <Card className="relative overflow-hidden bg-gradient-to-br from-[#0a1628]/90 via-[#1a2847]/90 to-[#0f1f3a]/90 border-2 border-fun-cyan/40 rounded-3xl backdrop-blur-sm hover:border-fun-cyan/60 transition-all duration-300 hover:shadow-lg hover:shadow-fun-cyan/20">
        <CardContent className="p-6">
          {/* Planet Icon */}
          <motion.div
            className="relative w-20 h-20 mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-br from-fun-cyan via-fun-blue to-fun-purple flex items-center justify-center shadow-lg shadow-fun-cyan/50">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            
            {/* Orbiting star */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ rotate: -360 }}
              transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
            >
              <Star className="w-5 h-5 text-fun-yellow fill-fun-yellow" />
            </motion.div>
          </motion.div>

          {/* Title */}
          <h3 className="text-lg font-fredoka font-bold text-white text-center mb-1">
            Đăng Nhập Hàng Ngày
          </h3>
          <p className="text-fun-cyan text-sm text-center mb-3">Daily Login Reward</p>

          {/* Amount */}
          <div className="text-center mb-4">
            <span className="text-3xl font-fredoka font-bold bg-gradient-to-r from-fun-cyan to-fun-blue bg-clip-text text-transparent">
              5,000
            </span>
            <span className="text-fun-cyan ml-1">$C</span>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm text-center mb-4">
            Mỗi ngày đăng nhập nhận quà từ Cha Vũ Trụ 🌟
          </p>

          {/* Status Badge */}
          {!canClaim && !isChecking && (
            <Badge className="w-full justify-center py-2 bg-green-500/20 text-green-400 border-green-500/30 mb-3">
              <Check className="w-4 h-4 mr-1" />
              Đã nhận hôm nay!
            </Badge>
          )}

          {/* Claim Button */}
          <Button
            onClick={onClaim}
            disabled={!canClaim || isClaiming || isChecking}
            className={`w-full font-fredoka font-bold py-5 rounded-xl transition-all ${
              canClaim
                ? 'bg-gradient-to-r from-fun-cyan to-fun-blue hover:from-fun-cyan/80 hover:to-fun-blue/80 text-white shadow-lg shadow-fun-cyan/30'
                : 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isChecking ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang kiểm tra...
              </>
            ) : isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang nhận...
              </>
            ) : canClaim ? (
              <>
                <Star className="w-4 h-4 mr-2" />
                Nhận Thưởng
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Quay lại ngày mai
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
