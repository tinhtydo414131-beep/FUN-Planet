import { motion } from 'framer-motion';
import { Clock, Moon, Star, Sparkles } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { AgeGroup, getDailyCap } from '@/config/playtimeRewards';

interface DailyPlayProgressBarProps {
  totalMinutesPlayed: number;
  ageGroup: AgeGroup;
  isChildFriendlyDisplay: boolean;
}

export function DailyPlayProgressBar({
  totalMinutesPlayed,
  ageGroup,
  isChildFriendlyDisplay
}: DailyPlayProgressBarProps) {
  const { maxMinutes } = getDailyCap(ageGroup);
  const percentage = Math.min((totalMinutesPlayed / maxMinutes) * 100, 100);
  const remainingMinutes = Math.max(0, maxMinutes - totalMinutesPlayed);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getMessage = () => {
    if (isAtLimit) return "Nghỉ ngơi một chút nhé bé yêu! 🌙";
    if (isNearLimit) return "Sắp hết thời gian chơi rồi! Cố lên bé! 💪";
    if (percentage >= 50) return "Bé chơi giỏi lắm! Tiếp tục nhé! 🌟";
    return "Bé đang khám phá thế giới thật tuyệt! ✨";
  };

  const getStars = () => {
    if (percentage >= 100) return '🌟🌟🌟🌟🌟';
    if (percentage >= 75) return '🌟🌟🌟🌟';
    if (percentage >= 50) return '🌟🌟🌟';
    if (percentage >= 25) return '🌟🌟';
    return '🌟';
  };

  // Get gradient border colors based on state
  const getBorderGradient = () => {
    if (isAtLimit) return 'from-purple-400 via-indigo-400 to-blue-400';
    if (isNearLimit) return 'from-amber-400 via-orange-400 to-yellow-400';
    return 'from-emerald-400 via-teal-400 to-cyan-400';
  };

  // Get glow colors based on state
  const getGlowGradient = () => {
    if (isAtLimit) return 'from-purple-300/30 via-indigo-300/20 to-blue-300/30';
    if (isNearLimit) return 'from-amber-300/30 via-orange-300/20 to-yellow-300/30';
    return 'from-emerald-300/30 via-teal-300/20 to-cyan-300/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {/* Outer glow */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${getGlowGradient()} rounded-2xl blur-lg opacity-60`} />
      
      <Card 
        className="overflow-hidden border-0 relative bg-white"
        style={{
          boxShadow: isAtLimit 
            ? '0 8px 32px rgba(147, 51, 234, 0.15), 0 4px 16px rgba(79, 70, 229, 0.1)'
            : isNearLimit
            ? '0 8px 32px rgba(251, 191, 36, 0.15), 0 4px 16px rgba(249, 115, 22, 0.1)'
            : '0 8px 32px rgba(52, 211, 153, 0.15), 0 4px 16px rgba(96, 165, 250, 0.1)',
        }}
      >
        {/* Gradient border */}
        <div className={`absolute inset-0 bg-gradient-to-r ${getBorderGradient()} rounded-xl opacity-30`} />
        <div className="absolute inset-[2px] bg-white rounded-xl" />

        {/* Animated background particles - brighter for white bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${3 + Math.random() * 4}px`,
                height: `${3 + Math.random() * 4}px`,
                background: isAtLimit ? '#A855F7' : isNearLimit ? '#F59E0B' : '#10B981',
                filter: 'drop-shadow(0 0 4px currentColor)',
              }}
              animate={{
                opacity: [0.4, 0.9, 0.4],
                scale: [1, 1.3, 1],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <CardContent className="p-5 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={isNearLimit ? { rotate: [0, 10, -10, 0] } : {}}
                transition={{ duration: 0.5, repeat: isNearLimit ? Infinity : 0 }}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isAtLimit 
                    ? 'bg-purple-100' 
                    : isNearLimit 
                    ? 'bg-amber-100' 
                    : 'bg-emerald-100'
                }`}
              >
                {isAtLimit ? (
                  <Moon className="w-6 h-6 text-purple-600" />
                ) : (
                  <Clock className="w-6 h-6 text-emerald-600" />
                )}
              </motion.div>
              <div>
                <h3 className="text-lg font-fredoka font-bold bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent">
                  {isChildFriendlyDisplay ? '⏰ Thời Gian Chơi Hôm Nay' : 'Daily Play Time'}
                </h3>
                <p className="text-sm text-blue-700/70 font-fredoka">
                  {isChildFriendlyDisplay 
                    ? `Độ tuổi: ${ageGroup} • Tối đa: ${maxMinutes} phút/ngày`
                    : `Age: ${ageGroup} • Max: ${maxMinutes} min/day`
                  }
                </p>
              </div>
            </div>
            
            {/* Stars display for children */}
            {isChildFriendlyDisplay && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-2xl"
              >
                {getStars()}
              </motion.div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="relative">
              <Progress 
                value={percentage} 
                className={`h-6 rounded-full ${
                  isAtLimit 
                    ? 'bg-purple-100' 
                    : isNearLimit 
                    ? 'bg-amber-100' 
                    : 'bg-gray-200'
                }`}
              />
              
              {/* Animated rocket on progress bar */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: `calc(${Math.min(percentage, 95)}% - 12px)` }}
                animate={{ 
                  y: [-2, 2, -2],
                  rotate: isNearLimit ? [0, 5, -5, 0] : 0
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {isAtLimit ? (
                  <Moon className="w-6 h-6 text-purple-600 drop-shadow-lg" />
                ) : (
                  <Sparkles className="w-6 h-6 text-amber-500 drop-shadow-lg" />
                )}
              </motion.div>
            </div>
            
            {/* Time labels */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-lg font-fredoka font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                {isChildFriendlyDisplay ? (
                  <>
                    Bé đã chơi: <span className="text-yellow-600">{totalMinutesPlayed}</span>/{maxMinutes} phút
                  </>
                ) : (
                  <>
                    Played: <span className="text-yellow-600">{totalMinutesPlayed}</span>/{maxMinutes} min
                  </>
                )}
              </span>
              
              <motion.span
                animate={isNearLimit ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isNearLimit ? Infinity : 0 }}
                className={`text-sm font-bold px-3 py-1 rounded-full font-fredoka ${
                  isAtLimit 
                    ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                    : isNearLimit 
                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
              >
                {isAtLimit 
                  ? (isChildFriendlyDisplay ? '😴 Hết giờ rồi!' : 'Time\'s up!')
                  : (isChildFriendlyDisplay ? `Còn ${remainingMinutes} phút` : `${remainingMinutes} min left`)
                }
              </motion.span>
            </div>
          </div>

          {/* Motivational Message */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`p-3 rounded-xl text-center border ${
              isAtLimit 
                ? 'bg-purple-50 border-purple-200' 
                : isNearLimit 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <p className={`text-base font-fredoka font-medium ${
              isAtLimit 
                ? 'text-purple-700' 
                : isNearLimit 
                ? 'text-amber-700' 
                : 'text-blue-700'
            }`}>
              {getMessage()}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
