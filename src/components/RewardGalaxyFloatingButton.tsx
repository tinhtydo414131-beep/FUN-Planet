import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useDraggable } from '@/hooks/useDraggable';
import { cn } from '@/lib/utils';

export const RewardGalaxyFloatingButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pendingBalance, setPendingBalance] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { 
    isDragging, 
    handleMouseDown,
    handleLongPressStart,
    handleLongPressEnd,
    handleLongPressMove,
    style 
  } = useDraggable({
    storageKey: "reward_galaxy_position",
    defaultPosition: { x: 0, y: 0 },
  });

  useEffect(() => {
    if (user) {
      fetchPendingBalance();
      
      // Subscribe to realtime updates
      const channel = supabase
        .channel('rewards-floating')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_rewards',
            filter: `user_id=eq.${user.id}`,
          },
          () => fetchPendingBalance()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
      // Silently fail
    }
  };

  const formatBalance = (balance: number) => {
    if (balance >= 1000000) {
      return `${(balance / 1000000).toFixed(1)}M`;
    } else if (balance >= 1000) {
      return `${(balance / 1000).toFixed(0)}K`;
    }
    return balance.toString();
  };

  const handleClick = () => {
    if (!isDragging) {
      navigate('/reward-galaxy');
    }
  };

  return (
    <div 
      className="fixed bottom-24 md:bottom-8 right-4 z-40 select-none"
      style={style}
    >
      <div className="relative group">
        {/* Drag handle - always visible */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          className={cn(
            "absolute -top-3 -left-3 w-8 h-8 rounded-full bg-yellow-600/90 flex items-center justify-center z-10 cursor-grab active:cursor-grabbing shadow-lg",
            "transition-all duration-200",
            isDragging ? "scale-110 bg-yellow-500" : "opacity-70 hover:opacity-100 hover:scale-110"
          )}
          title="Kéo để di chuyển"
        >
          <GripVertical className="w-4 h-4 text-white" />
        </div>

        <motion.button
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); handleLongPressEnd(); }}
          onMouseDown={handleLongPressStart}
          onMouseUp={handleLongPressEnd}
          onTouchStart={handleLongPressStart}
          onTouchEnd={handleLongPressEnd}
          onTouchMove={handleLongPressMove}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: isDragging ? 1 : 1.1 }}
          whileTap={{ scale: isDragging ? 1 : 0.9 }}
        >
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: isDragging
                ? '0 0 50px rgba(255,215,0,1), 0 0 100px rgba(255,215,0,0.6)'
                : isHovered
                  ? '0 0 40px rgba(255,215,0,0.8), 0 0 80px rgba(255,215,0,0.4)'
                  : '0 0 20px rgba(255,215,0,0.5), 0 0 40px rgba(255,215,0,0.2)',
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Main button */}
          <div
            className={cn(
              "relative w-16 h-16 rounded-full flex items-center justify-center",
              isDragging && "ring-4 ring-yellow-400/50"
            )}
            style={{
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
              border: '3px solid rgba(255,255,255,0.5)',
            }}
          >
            {/* Sparkle particles */}
            <AnimatePresence>
              {isHovered && !isDragging && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        x: [0, (Math.random() - 0.5) * 60],
                        y: [0, (Math.random() - 0.5) * 60],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Gift icon */}
            <motion.div
              animate={{ 
                rotate: isHovered && !isDragging ? [0, -10, 10, 0] : 0,
                scale: isHovered && !isDragging ? [1, 1.2, 1] : 1,
              }}
              transition={{ duration: 0.5 }}
            >
              <Gift className="w-8 h-8 text-white drop-shadow-lg" />
            </motion.div>

            {/* Pending badge */}
            {pendingBalance > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-black text-white min-w-[24px] text-center"
                style={{
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF4757 100%)',
                  boxShadow: '0 2px 8px rgba(255,71,87,0.5)',
                }}
              >
                {formatBalance(pendingBalance)}
              </motion.div>
            )}
          </div>

          {/* Tooltip on hover */}
          <AnimatePresence>
            {isHovered && !isDragging && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  color: 'white',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                  boxShadow: '0 4px 15px rgba(255,215,0,0.4)',
                }}
              >
                🎁 Quà Từ Cha Vũ Trụ
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Drag instruction tooltip */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-yellow-500 text-white rounded-lg px-3 py-1.5 shadow-xl text-xs font-medium"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              Đang kéo...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
