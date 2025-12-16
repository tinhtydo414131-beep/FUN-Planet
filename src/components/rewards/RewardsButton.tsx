import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePendingRewards } from '@/hooks/usePendingRewards';
import { formatCamly } from '@/lib/web3';
import RewardsModal from './RewardsModal';

interface RewardsButtonProps {
  variant?: 'header' | 'sidebar' | 'floating';
  className?: string;
}

const RewardsButton = ({ variant = 'header', className = '' }: RewardsButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { totalPending, isLoading } = usePendingRewards();

  const hasPendingRewards = totalPending > 0;

  if (variant === 'floating') {
    return (
      <>
        <motion.div
          className={`fixed bottom-6 right-6 z-50 ${className}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={() => setIsModalOpen(true)}
            className="relative h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500 hover:from-amber-600 hover:via-orange-600 hover:to-yellow-600 shadow-lg shadow-orange-500/30"
          >
            <motion.div
              animate={{ 
                rotate: hasPendingRewards ? [0, 10, -10, 0] : 0,
              }}
              transition={{ duration: 0.5, repeat: hasPendingRewards ? Infinity : 0, repeatDelay: 2 }}
            >
              <Gift className="w-8 h-8 text-white" />
            </motion.div>
            
            {hasPendingRewards && (
              <motion.div
                className="absolute -top-1 -right-1"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                <Badge className="bg-red-500 text-white text-xs px-2 py-1 font-bold animate-pulse">
                  {formatCamly(totalPending)}
                </Badge>
              </motion.div>
            )}
          </Button>
        </motion.div>
        
        <RewardsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  if (variant === 'sidebar') {
    return (
      <>
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="ghost"
          className={`w-full justify-start gap-3 relative ${className}`}
        >
          <Coins className="w-5 h-5 text-amber-500" />
          <span>My Rewards</span>
          {hasPendingRewards && (
            <Badge className="ml-auto bg-amber-500 text-white">
              {formatCamly(totalPending)}
            </Badge>
          )}
        </Button>
        
        <RewardsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // Default header variant
  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="ghost"
        className={`relative gap-2 ${className}`}
      >
        <motion.div
          animate={{ 
            rotate: hasPendingRewards ? [0, 15, -15, 0] : 0,
          }}
          transition={{ duration: 0.4, repeat: hasPendingRewards ? Infinity : 0, repeatDelay: 3 }}
        >
          <Gift className="w-5 h-5 text-amber-500" />
        </motion.div>
        <span className="hidden sm:inline">Rewards</span>
        
        {hasPendingRewards && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
            {isLoading ? '...' : formatCamly(totalPending)}
          </Badge>
        )}
      </Button>
      
      <RewardsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default RewardsButton;
