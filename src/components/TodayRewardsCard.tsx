import { motion } from 'framer-motion';
import { Gift, Star, Calendar, Wallet, Gamepad2, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const rewardTypes = [
  {
    icon: <Calendar className="w-6 h-6" />,
    title: 'Check-in Hàng Ngày',
    reward: '1,000 CAMLY',
    color: 'from-blue-400 to-blue-600',
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: 'Kết Nối Ví',
    reward: '50,000 CAMLY',
    color: 'from-orange-400 to-orange-600',
  },
  {
    icon: <Gamepad2 className="w-6 h-6" />,
    title: 'Chơi Game Đầu Tiên',
    reward: '10,000 CAMLY',
    color: 'from-purple-400 to-purple-600',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Mời Bạn Bè',
    reward: '25,000 CAMLY',
    color: 'from-pink-400 to-pink-600',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Streak 7 Ngày',
    reward: '2x Bonus',
    color: 'from-yellow-400 to-yellow-600',
  },
];

export const TodayRewardsCard = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card
            className="relative overflow-hidden p-6 sm:p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,236,139,0.15) 100%)',
              border: '3px solid rgba(255,215,0,0.4)',
              boxShadow: '0 0 40px rgba(255,215,0,0.2)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-3 rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    boxShadow: '0 0 20px rgba(255,215,0,0.5)',
                  }}
                >
                  <Gift className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 
                    className="text-xl sm:text-2xl font-black"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 15px rgba(255,215,0,0.6)',
                    }}
                  >
                    Quà Hôm Nay 🌟
                  </h3>
                  <p className="text-sm text-foreground/70 font-medium">
                    Nhận quà mỗi ngày từ Cha Vũ Trụ!
                  </p>
                </div>
              </div>
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              {rewardTypes.map((reward, index) => (
                <motion.div
                  key={reward.title}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="p-3 rounded-xl text-center cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid rgba(255,215,0,0.3)',
                  }}
                  onClick={() => navigate('/reward-galaxy')}
                >
                  <div 
                    className={`w-12 h-12 mx-auto mb-2 rounded-xl flex items-center justify-center bg-gradient-to-br ${reward.color} text-white`}
                  >
                    {reward.icon}
                  </div>
                  <p className="text-xs font-bold text-foreground/80 mb-1 line-clamp-1">
                    {reward.title}
                  </p>
                  <p 
                    className="text-sm font-black"
                    style={{ color: '#FFD700' }}
                  >
                    {reward.reward}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => navigate('/reward-galaxy')}
                  className="px-8 py-4 text-base font-bold rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    boxShadow: '0 0 20px rgba(255,215,0,0.5)',
                    color: 'white',
                  }}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Xem Tất Cả Quà
                  <Gift className="w-5 h-5 ml-2" />
                </Button>
              </motion.div>
            </div>

            {/* Decorative sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2 + Math.random(),
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                }}
              >
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
