import { motion } from "framer-motion";
import { Diamond, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWeb3Rewards } from "@/hooks/useWeb3Rewards";
import { useState } from "react";
import { RewardsDashboard } from "./RewardsDashboard";

export const DashboardClaimBanner = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isVN = i18n.language === 'vi';
  const { camlyBalance, canClaimDailyCheckin } = useWeb3Rewards();
  const [showDashboard, setShowDashboard] = useState(false);

  const handleClaim = () => {
    navigate('/claim');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 border border-purple-500/30 p-4 md:p-6"
    >
      {/* Animated background sparkles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${20 + i * 15}%`,
            top: `${20 + (i % 2) * 60}%`,
          }}
          animate={{
            y: [0, -10, 0],
            opacity: [0.3, 0.7, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2 + i * 0.3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          <Diamond className="w-4 h-4 text-purple-400" />
        </motion.div>
      ))}

      <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left side - Balance & Info */}
        <div className="flex items-center gap-4">
          <motion.div
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
            animate={{
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          >
            <Diamond className="w-7 h-7 text-white" />
          </motion.div>
          
          <div>
            <p className="text-sm text-muted-foreground">
              {isVN ? 'Số dư CAMLY của bạn' : 'Your CAMLY Balance'}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">
                {camlyBalance.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">CAMLY</span>
              {canClaimDailyCheckin && (
                <motion.span
                  className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {isVN ? 'Có thể nhận!' : 'Claimable!'}
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => setShowDashboard(!showDashboard)}
            variant="outline"
            className="flex items-center gap-2 border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/10"
          >
            <TrendingUp className="w-4 h-4" />
            {showDashboard 
              ? (isVN ? 'Ẩn thống kê' : 'Hide Stats')
              : (isVN ? 'Xem thống kê' : 'View Stats')}
          </Button>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleClaim}
              className="w-full sm:w-auto flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 hover:from-purple-700 hover:via-pink-600 hover:to-orange-600 shadow-lg shadow-purple-500/30"
            >
              <Sparkles className="w-4 h-4" />
              {isVN ? 'Nhận Bonus' : 'Claim Bonus'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Expandable Dashboard */}
      <motion.div
        initial={false}
        animate={{
          height: showDashboard ? 'auto' : 0,
          opacity: showDashboard ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="pt-4 mt-4 border-t border-purple-500/20">
          <RewardsDashboard />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardClaimBanner;
