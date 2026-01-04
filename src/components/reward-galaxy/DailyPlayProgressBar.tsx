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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <Card 
        className="overflow-hidden border-0 relative"
        style={{
          background: isAtLimit 
            ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.3), rgba(79, 70, 229, 0.3))'
            : isNearLimit
            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(249, 115, 22, 0.3))'
            : 'linear-gradient(135deg, rgba(52, 211, 153, 0.3), rgba(96, 165, 250, 0.3))',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}
      >
        {/* Animated background particles */}
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
                background: isAtLimit ? '#A855F7' : isNearLimit ? '#FBBF24' : '#34D399',
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
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
                    ? 'bg-purple-500/30' 
                    : isNearLimit 
                    ? 'bg-amber-500/30' 
                    : 'bg-emerald-500/30'
                }`}
              >
                {isAtLimit ? (
                  <Moon className="w-6 h-6 text-purple-300" />
                ) : (
                  <Clock className="w-6 h-6 text-white" />
                )}
              </motion.div>
              <div>
                <h3 className="text-lg font-fredoka font-bold text-white">
                  {isChildFriendlyDisplay ? '⏰ Thời Gian Chơi Hôm Nay' : 'Daily Play Time'}
                </h3>
                <p className="text-sm text-white/70">
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
                    ? 'bg-purple-900/50' 
                    : isNearLimit 
                    ? 'bg-amber-900/50' 
                    : 'bg-emerald-900/50'
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
                  <Moon className="w-6 h-6 text-purple-200 drop-shadow-lg" />
                ) : (
                  <Sparkles className="w-6 h-6 text-yellow-300 drop-shadow-lg" />
                )}
              </motion.div>
            </div>
            
            {/* Time labels */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-lg font-fredoka font-bold text-white">
                {isChildFriendlyDisplay ? (
                  <>
                    Bé đã chơi: <span className="text-yellow-300">{totalMinutesPlayed}</span>/{maxMinutes} phút
                  </>
                ) : (
                  <>
                    Played: <span className="text-yellow-300">{totalMinutesPlayed}</span>/{maxMinutes} min
                  </>
                )}
              </span>
              
              <motion.span
                animate={isNearLimit ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5, repeat: isNearLimit ? Infinity : 0 }}
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  isAtLimit 
                    ? 'bg-purple-500/30 text-purple-200' 
                    : isNearLimit 
                    ? 'bg-amber-500/30 text-amber-200' 
                    : 'bg-emerald-500/30 text-emerald-200'
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
            className={`p-3 rounded-xl text-center ${
              isAtLimit 
                ? 'bg-purple-500/20' 
                : isNearLimit 
                ? 'bg-amber-500/20' 
                : 'bg-white/10'
            }`}
          >
            <p className="text-base font-fredoka text-white">
              {getMessage()}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
