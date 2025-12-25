import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Admin wallet addresses (case insensitive)
const ADMIN_WALLETS = [
  "0x2C05a7663dBaAe48A4d195EA2f957eBa1F00D71B".toLowerCase(),
];

export const useAdminRole = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin, isLoading: queryLoading } = useQuery({
    queryKey: ['adminRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      console.debug('[useAdminRole] Checking admin role for user:', user.id);
      
      // Check 1: Check if user has admin role in database
      const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (roleError) {
        console.error('[useAdminRole] Error checking admin role:', roleError);
      }
      
      if (hasAdminRole === true) {
        console.debug('[useAdminRole] User has admin role in database');
        return true;
      }
      
      // Check 2: Check if user's wallet address is in admin list
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_address')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('[useAdminRole] Error fetching profile:', profileError);
        return false;
      }
      
      if (profile?.wallet_address) {
        const isAdminWallet = ADMIN_WALLETS.includes(profile.wallet_address.toLowerCase());
        console.debug('[useAdminRole] Wallet check:', { 
          wallet: profile.wallet_address, 
          isAdminWallet 
        });
        return isAdminWallet;
      }
      
      console.debug('[useAdminRole] No admin access found');
      return false;
    },
    // Only run query when auth is loaded and user exists
    enabled: !authLoading && !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Include auth loading in the overall loading state
  const isLoading = authLoading || queryLoading;

  return {
    isAdmin: isAdmin ?? false,
    isLoading,
  };
};
