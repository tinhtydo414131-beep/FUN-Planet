import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, Gift, Trophy, Heart, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

interface RewardNotification {
  id: string;
  username: string;
  amount: number;
  reason: string;
  type: 'behavior' | 'engagement' | 'game_complete' | 'sharing' | 'kindness';
  timestamp: Date;
}

const playBellSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Bell-like tone sequence
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const playDrumSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (e) {
    console.log('Audio not supported');
  }
};

const triggerCelebration = () => {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.1 },
    colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
  });
};

const getRewardIcon = (type: string) => {
  switch (type) {
    case 'game_complete': return Trophy;
    case 'sharing': return Gift;
    case 'kindness': return Heart;
    default: return Sparkles;
  }
};

const getRewardColor = (type: string) => {
  switch (type) {
    case 'game_complete': return 'from-amber-500 to-yellow-500';
    case 'sharing': return 'from-purple-500 to-pink-500';
    case 'kindness': return 'from-rose-500 to-red-500';
    case 'engagement': return 'from-blue-500 to-cyan-500';
    default: return 'from-green-500 to-emerald-500';
  }
};

export function RewardMarquee() {
  const [notifications, setNotifications] = useState<RewardNotification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const addNotification = useCallback((notification: RewardNotification) => {
    setNotifications(prev => {
      const updated = [...prev, notification].slice(-20); // Keep last 20
      return updated;
    });
    setIsVisible(true);
    playBellSound();
    setTimeout(playDrumSound, 150);
    triggerCelebration();
  }, []);

  useEffect(() => {
    // Subscribe to behavior_rewards
    const behaviorChannel = supabase
      .channel('reward-marquee-behavior')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'behavior_rewards',
        },
        async (payload) => {
          const reward = payload.new as any;
          
          // Fetch username
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', reward.user_id)
            .single();

          addNotification({
            id: reward.id,
            username: profile?.username || 'Người chơi',
            amount: reward.amount,
            reason: reward.description || reward.behavior_type,
            type: reward.behavior_type as any,
            timestamp: new Date(reward.created_at),
          });
        }
      )
      .subscribe();

    // Subscribe to game_engagement_rewards
    const engagementChannel = supabase
      .channel('reward-marquee-engagement')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_engagement_rewards',
        },
        async (payload) => {
          const reward = payload.new as any;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', reward.creator_id)
            .single();

          addNotification({
            id: reward.id,
            username: profile?.username || 'Creator',
            amount: reward.amount,
            reason: `Game đạt ${reward.threshold_reached}`,
            type: 'engagement',
            timestamp: new Date(reward.created_at),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(behaviorChannel);
      supabase.removeChannel(engagementChannel);
    };
  }, [addNotification]);

  // Auto-rotate notifications
  useEffect(() => {
    if (notifications.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % notifications.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [notifications.length]);

  // Auto-hide after no new notifications
  useEffect(() => {
    if (notifications.length === 0) {
      setIsVisible(false);
      return;
    }

    const timeout = setTimeout(() => {
      setIsVisible(false);
    }, 30000);

    return () => clearTimeout(timeout);
  }, [notifications]);

  if (!isVisible || notifications.length === 0) return null;

  const currentNotification = notifications[currentIndex];
  const Icon = getRewardIcon(currentNotification?.type || 'behavior');
  const colorClass = getRewardColor(currentNotification?.type || 'behavior');

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] pointer-events-none"
    >
      <div className={`bg-gradient-to-r ${colorClass} py-2 px-4 shadow-lg`}>
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 overflow-hidden">
          {/* Bell animation */}
          <motion.div
            animate={{ 
              rotate: [0, -15, 15, -15, 15, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            <Bell className="w-5 h-5 text-white" />
          </motion.div>

          {/* Marquee text */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNotification?.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -100, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 text-white font-medium"
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm md:text-base">
                🎉 <strong>FUN Planet</strong> chúc mừng{' '}
                <span className="font-bold text-yellow-200">
                  {currentNotification?.username}
                </span>{' '}
                đã nhận{' '}
                <span className="font-bold text-yellow-200">
                  {currentNotification?.amount.toLocaleString()} CAMLY
                </span>{' '}
                vì {currentNotification?.reason}! 🌟
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Sparkles */}
          <motion.div
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 text-yellow-200" />
          </motion.div>
        </div>

        {/* Rainbow glow effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'linear-gradient(90deg, rgba(255,0,0,0.1) 0%, rgba(255,165,0,0.1) 25%, rgba(255,255,0,0.1) 50%, rgba(0,255,0,0.1) 75%, rgba(0,0,255,0.1) 100%)',
              'linear-gradient(90deg, rgba(0,0,255,0.1) 0%, rgba(255,0,0,0.1) 25%, rgba(255,165,0,0.1) 50%, rgba(255,255,0,0.1) 75%, rgba(0,255,0,0.1) 100%)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
    </motion.div>
  );
}
