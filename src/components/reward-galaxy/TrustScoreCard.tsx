import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Clock, 
  Zap,
  TrendingUp,
  Star,
  Crown,
  Award,
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { formatBalanceByAge, getRewardBadge } from '@/lib/childFriendlyDisplay';

interface TrustScoreCardProps {
  trustScore: number;
  tier: string;
  cooldownRemaining: number;
  hourlyRequestsRemaining: number;
  accountAgeDays: number;
  successfulClaims: number;
  hasWallet?: boolean;
  pendingAmount?: number;
  onConnectWallet?: () => void;
  birthYear?: number | null;
}

export function TrustScoreCard({
  trustScore,
  tier,
  cooldownRemaining,
  hourlyRequestsRemaining,
  accountAgeDays,
  successfulClaims,
  hasWallet = true,
  pendingAmount = 0,
  onConnectWallet,
  birthYear
}: TrustScoreCardProps) {
  const isChildFriendly = birthYear && (new Date().getFullYear() - birthYear) < 12;
  const badge = getRewardBadge(pendingAmount);
  
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
      className="mb-8 relative"
    >
      {/* Outer glow - light theme */}
      <div className="absolute -inset-1 bg-gradient-to-r from-purple-300/30 via-pink-300/20 to-blue-300/30 rounded-3xl blur-xl" />
      
      {/* Gradient border */}
      <div className="relative p-[2px] rounded-2xl bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400">
        <Card 
          className="overflow-hidden border-0 bg-white rounded-2xl"
          style={{
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.12), 0 4px 16px rgba(236, 72, 153, 0.08)',
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
                  <h3 className="text-lg font-fredoka font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                    Trust Score ✨
                  </h3>
                  <Badge 
                    className={`bg-gradient-to-r ${getTierColor()} text-white border-0 shadow-md`}
                  >
                    {tier}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <motion.span 
                  className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-pink-500 to-purple-600 bg-clip-text text-transparent"
                  key={trustScore}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                >
                  {trustScore}
                </motion.span>
                <span className="text-xl text-blue-600/60">/100</span>
              </div>
            </div>

            {/* Trust Score Progress Bar */}
            <div className="mb-6">
              <div className="relative h-3 rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${getTierColor()}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${trustScore}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-gray-500">0</span>
                <span className="text-amber-600">20 (Bronze)</span>
                <span className="text-gray-500">30 (Silver)</span>
                <span className="text-yellow-600">40 (Gold)</span>
                <span className="text-purple-600">50+ (Platinum)</span>
              </div>
            </div>

            {/* Stats Grid - light theme */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Cooldown */}
              <div 
                className="rounded-xl p-3 text-center border border-blue-200/50"
                style={{ background: 'linear-gradient(135deg, rgba(219, 234, 254, 0.6) 0%, rgba(224, 231, 255, 0.4) 100%)' }}
              >
                <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                <p className="text-xs text-blue-700/70 font-fredoka">Cooldown</p>
                <p className={`text-sm font-bold font-fredoka ${cooldownRemaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                  {formatCooldown(cooldownRemaining)}
                </p>
              </div>

              {/* Hourly Requests */}
              <div 
                className="rounded-xl p-3 text-center border border-yellow-200/50"
                style={{ background: 'linear-gradient(135deg, rgba(254, 252, 232, 0.6) 0%, rgba(254, 249, 195, 0.4) 100%)' }}
              >
                <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                <p className="text-xs text-blue-700/70 font-fredoka">Còn lại/giờ</p>
                <p className="text-sm font-bold text-yellow-700 font-fredoka">{hourlyRequestsRemaining}/3</p>
              </div>

              {/* Account Age */}
              <div 
                className="rounded-xl p-3 text-center border border-green-200/50"
                style={{ background: 'linear-gradient(135deg, rgba(220, 252, 231, 0.6) 0%, rgba(236, 253, 245, 0.4) 100%)' }}
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
                <p className="text-xs text-blue-700/70 font-fredoka">Tuổi TK</p>
                <p className="text-sm font-bold text-green-700 font-fredoka">{accountAgeDays} ngày</p>
              </div>

              {/* Successful Claims */}
              <div 
                className="rounded-xl p-3 text-center border border-purple-200/50"
                style={{ background: 'linear-gradient(135deg, rgba(243, 232, 255, 0.6) 0%, rgba(252, 231, 243, 0.4) 100%)' }}
              >
                <Star className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                <p className="text-xs text-blue-700/70 font-fredoka">Rút thành công</p>
                <p className="text-sm font-bold text-purple-700 font-fredoka">{successfulClaims}</p>
              </div>
            </div>

            {/* Warning: No wallet connected but has pending amount */}
            {!hasWallet && pendingAmount > 0 && (
              <motion.div 
                className="mt-4 p-4 rounded-xl border border-orange-200/50"
                style={{ background: 'linear-gradient(135deg, rgba(255, 237, 213, 0.8) 0%, rgba(254, 243, 199, 0.6) 100%)' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-orange-700 mb-1 font-fredoka">
                      ⚠️ Cần kết nối ví để rút CAMLY!
                    </p>
                    <p className="text-xs text-orange-600/80 mb-3 font-fredoka">
                      {isChildFriendly 
                        ? `Bé có ${badge.emoji} ${badge.name} đang chờ rút nhưng chưa kết nối ví!`
                        : `Bạn có ${pendingAmount.toLocaleString()} CAMLY đang chờ rút nhưng chưa kết nối ví.`
                      }
                      {' '}Kết nối ví để tăng Trust Score +20 điểm và có thể rút tiền!
                    </p>
                    {onConnectWallet && (
                      <Button
                        onClick={onConnectWallet}
                        size="sm"
                        className="bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white font-bold shadow-md font-fredoka"
                      >
                        <Wallet className="w-4 h-4 mr-2" />
                        Kết nối ví ngay
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tips for increasing trust */}
            {trustScore < 50 && (
              <div 
                className="mt-4 p-3 rounded-xl border border-yellow-200/50"
                style={{ background: 'linear-gradient(135deg, rgba(254, 252, 232, 0.8) 0%, rgba(254, 249, 195, 0.5) 100%)' }}
              >
                <p className="text-xs text-yellow-700 mb-2 font-fredoka font-medium">💡 Cách tăng Trust Score:</p>
                <ul className="text-xs text-yellow-700/80 space-y-1 font-fredoka">
                  {!hasWallet && (
                    <li className="text-orange-600 font-semibold">• Kết nối ví để được +20 điểm ⭐</li>
                  )}
                  <li>• Rút tiền thành công nhiều lần (+7-20 điểm)</li>
                  <li>• Upload game được duyệt (+7-15 điểm)</li>
                  <li>• Sử dụng IP độc lập (+20 điểm)</li>
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
