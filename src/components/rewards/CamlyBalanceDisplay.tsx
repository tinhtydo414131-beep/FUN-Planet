import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { CAMLY_CONTRACT_ADDRESS, CAMLY_ABI, formatCamly } from '@/lib/web3';
import { Button } from '@/components/ui/button';

interface CamlyBalanceDisplayProps {
  className?: string;
  showRefresh?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CamlyBalanceDisplay = ({ className = '', showRefresh = true, size = 'md' }: CamlyBalanceDisplayProps) => {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [prevBalance, setPrevBalance] = useState<number>(0);

  const fetchBalance = async () => {
    if (!address || !isConnected) {
      setBalance(0);
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org');
      const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, CAMLY_ABI, provider);
      const rawBalance = await contract.balanceOf(address);
      const formattedBalance = Number(ethers.formatUnits(rawBalance, 18));
      
      setPrevBalance(balance);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching CAMLY balance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [address, isConnected]);

  const balanceChanged = balance !== prevBalance && prevBalance > 0;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full px-3 py-1.5 border border-amber-200 dark:border-amber-700"
        animate={balanceChanged ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: 'linear' }}
        >
          <Coins className={`${iconSizes[size]} text-amber-600 dark:text-amber-400`} />
        </motion.div>
        
        <motion.span
          key={balance}
          initial={balanceChanged ? { opacity: 0, y: -10 } : {}}
          animate={{ opacity: 1, y: 0 }}
          className={`font-bold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent ${sizeClasses[size]}`}
        >
          {isLoading ? '...' : formatCamly(balance)}
        </motion.span>
        
        <span className={`text-amber-700 dark:text-amber-300 font-medium ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          CAMLY
        </span>
      </motion.div>

      {showRefresh && (
        <Button
          variant="ghost"
          size="icon"
          onClick={fetchBalance}
          disabled={isLoading}
          className="w-7 h-7 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
};

export default CamlyBalanceDisplay;
