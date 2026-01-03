import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Clock, 
  Zap,
  TrendingUp,
  Star,
  Crown,
  Award
} from 'lucide-react';

interface TrustScoreCardProps {
  trustScore: number;
  tier: string;
  cooldownRemaining: number;
  hourlyRequestsRemaining: number;
  accountAgeDays: number;
  successfulClaims: number;
}

export function TrustScoreCard({
  trustScore,
  tier,
  cooldownRemaining,
  hourlyRequestsRemaining,
  accountAgeDays,
  successfulClaims
}: TrustScoreCardProps) {
  const getTierColor = () => {
    if (trustScore >= 50) return 'from-purple-500 to-pink-500';
    if (trustScore >= 40) return 'from-yellow-500 to-orange-500';
    if (trustScore >= 30) return 'from-gray-400 to-gray-500';
    if (trustScore >= 20) return 'from-amber-600 to-amber-700';
    return 'from-red-500 to-red-600';
  };

  const getTierIcon = () => {
    if (trustScore >= 50) return <Crown className="w-5 h-5" />;
    if (trustScore >= 40) return <Star className="w-5 h-5" />;
    if (trustScore >= 30) return <Award className="w-5 h-5" />;
    return <Shield className="w-5 h-5" />;
  };

  const formatCooldown = (seconds: number) => {
    if (seconds <= 0) return 'Sẵn sàng rút';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card 
        className="overflow-hidden border-0"
        style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div 
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${getTierColor()} flex items-center justify-center text-white shadow-lg`}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getTierIcon()}
              </motion.div>
              <div>
                <h3 className="text-lg font-fredoka font-bold text-white">Trust Score</h3>
                <Badge 
                  className={`bg-gradient-to-r ${getTierColor()} text-white border-0`}
                >
                  {tier}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <motion.span 
                className="text-4xl font-bold text-white"
                key={trustScore}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
              >
                {trustScore}
              </motion.span>
              <span className="text-xl text-white/60">/100</span>
            </div>
          </div>

          {/* Trust Score Progress Bar */}
          <div className="mb-6">
            <Progress 
              value={trustScore} 
              className="h-3 bg-white/20"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>0</span>
              <span className="text-yellow-400">20 (Bronze)</span>
              <span className="text-gray-300">30 (Silver)</span>
              <span className="text-yellow-300">40 (Gold)</span>
              <span className="text-purple-300">50+ (Platinum)</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Cooldown */}
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-blue-300" />
              <p className="text-xs text-white/60">Cooldown</p>
              <p className={`text-sm font-bold ${cooldownRemaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {formatCooldown(cooldownRemaining)}
              </p>
            </div>

            {/* Hourly Requests */}
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-300" />
              <p className="text-xs text-white/60">Còn lại/giờ</p>
              <p className="text-sm font-bold text-white">{hourlyRequestsRemaining}/3</p>
            </div>

            {/* Account Age */}
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-300" />
              <p className="text-xs text-white/60">Tuổi TK</p>
              <p className="text-sm font-bold text-white">{accountAgeDays} ngày</p>
            </div>

            {/* Successful Claims */}
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <Star className="w-5 h-5 mx-auto mb-1 text-purple-300" />
              <p className="text-xs text-white/60">Rút thành công</p>
              <p className="text-sm font-bold text-white">{successfulClaims}</p>
            </div>
          </div>

          {/* Tips for increasing trust */}
          {trustScore < 50 && (
            <div className="mt-4 p-3 bg-white/5 rounded-xl">
              <p className="text-xs text-white/60 mb-2">💡 Cách tăng Trust Score:</p>
              <ul className="text-xs text-white/80 space-y-1">
                {!trustScore || trustScore < 20 && (
                  <li>• Kết nối ví để được +20 điểm</li>
                )}
                <li>• Rút tiền thành công nhiều lần (+7-20 điểm)</li>
                <li>• Upload game được duyệt (+7-15 điểm)</li>
                <li>• Sử dụng IP độc lập (+20 điểm)</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
