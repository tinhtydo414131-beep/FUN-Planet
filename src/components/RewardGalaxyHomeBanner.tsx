import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, Star, Crown, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export const RewardGalaxyHomeBanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingBalance, setPendingBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPendingBalance();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchPendingBalance = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('user_rewards')
        .select('pending_amount')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setPendingBalance(data.pending_amount || 0);
      }
    } catch (error) {
      console.error('Error fetching pending balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(1)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(0)}K`;
    }
    return balance.toLocaleString();
  };

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8 px-4"
    >
      <div className="container mx-auto max-w-5xl">
        <motion.div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,236,139,0.2) 50%, rgba(255,218,185,0.15) 100%)',
            boxShadow: '0 0 60px rgba(255,215,0,0.3), inset 0 0 60px rgba(255,215,0,0.1)',
          }}
        >
          {/* Sparkle particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5],
                x: Math.random() * 100 - 50,
                y: Math.random() * 100 - 50,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            >
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            </motion.div>
          ))}

          {/* Golden border glow */}
          <div className="absolute inset-0 rounded-3xl border-4 border-yellow-400/50" 
            style={{ boxShadow: 'inset 0 0 20px rgba(255,215,0,0.3)' }} 
          />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            {/* Left: Icon & Title */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    boxShadow: '0 0 30px rgba(255,215,0,0.6)',
                  }}
                >
                  <Gift className="w-10 h-10 text-white" />
                </motion.div>
                <div>
                  <h2 
                    className="text-2xl sm:text-3xl font-black"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 20px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    Quà Tặng Từ Cha Vũ Trụ
                  </h2>
                  <p 
                    className="text-lg font-bold"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 10px rgba(255,215,0,0.5)',
                    }}
                  >
                    Chờ Bé Đây! 🌟
                  </p>
                </div>
              </div>
              
              <p className="text-foreground/80 font-medium mb-4 text-sm sm:text-base">
                Cha Vũ Trụ đã chuẩn bị những món quà đặc biệt dành riêng cho con! 
                Hãy đến nhận ngay nhé! ✨
              </p>
            </div>

            {/* Right: Pending Balance & CTA */}
            <div className="flex flex-col items-center gap-4">
              {/* Pending Balance Preview */}
              <motion.div
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 rounded-2xl text-center min-w-[180px]"
                style={{
                  background: 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,215,0,0.5)',
                  boxShadow: '0 0 20px rgba(255,215,0,0.3)',
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Coins className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-bold text-foreground/70">Đang Chờ</span>
                </div>
                <p 
                  className="text-3xl font-black"
                  style={{
                    color: '#FFD700',
                    textShadow: '0 0 15px rgba(255,215,0,0.8)',
                  }}
                >
                  {isLoading ? '...' : `${formatBalance(pendingBalance)} CAMLY`}
                </p>
              </motion.div>

              {/* CTA Button */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => navigate('/reward-galaxy')}
                  className="px-8 py-6 text-lg font-black rounded-full relative overflow-hidden group"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                    boxShadow: '0 0 30px rgba(255,215,0,0.6), 0 4px 15px rgba(0,0,0,0.2)',
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span className="relative flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    Nhận Quà Ngay
                    <Sparkles className="w-5 h-5" />
                  </span>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
