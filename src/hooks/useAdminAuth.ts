import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isAdminWallet, ADMIN_ACCESS_DENIED_MESSAGE } from '@/config/adminConfig';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Try to import wagmi, handle gracefully if not available
let useAccount: () => { address?: string; isConnected?: boolean } = () => ({ address: undefined, isConnected: false });
try {
  const wagmiModule = require('wagmi');
  useAccount = wagmiModule.useAccount;
} catch {
  // wagmi not available, use fallback
}

interface UseAdminAuthReturn {
  isAdmin: boolean;
  isLoading: boolean;
  walletAddress: string | undefined;
  isConnected: boolean;
}

export const useAdminAuth = (redirectOnFail = true): UseAdminAuthReturn => {
  const { address, isConnected } = useAccount();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      setIsLoading(true);

      // First check wallet address from Web3
      if (isConnected && address) {
        const walletIsAdmin = isAdminWallet(address);
        if (walletIsAdmin) {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }
      }

      // Also check profile wallet address and database role
      if (user) {
        // Check has_role in database
        const { data: hasAdminRole } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (hasAdminRole) {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }

        // Check profile wallet
        const { data: profile } = await supabase
          .from('profiles')
          .select('wallet_address')
          .eq('id', user.id)
          .single();

        if (profile?.wallet_address && isAdminWallet(profile.wallet_address)) {
          setIsAdmin(true);
          setIsLoading(false);
          return;
        }
      }

      // Not admin - redirect if needed
      setIsAdmin(false);
      setIsLoading(false);

      if (redirectOnFail && !isConnected) {
        toast.error(ADMIN_ACCESS_DENIED_MESSAGE, {
          duration: 4000,
          icon: '🌟'
        });
        navigate('/');
      } else if (redirectOnFail && isConnected && !isAdminWallet(address)) {
        toast.error(ADMIN_ACCESS_DENIED_MESSAGE, {
          duration: 4000,
          icon: '🌟'
        });
        navigate('/');
      }
    };

    // Small delay to allow wallet connection to complete
    const timer = setTimeout(checkAdminAccess, 500);
    return () => clearTimeout(timer);
  }, [address, isConnected, user, navigate, redirectOnFail]);

  return {
    isAdmin,
    isLoading,
    walletAddress: address,
    isConnected
  };
};
