import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useAdminRole = () => {
  const { user, loading: authLoading } = useAuth();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['adminRole', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      // Only check database role - no client-side bypasses
      const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      
      if (roleError) {
        console.error('Error checking admin role:', roleError);
        return false;
      }
      
      return hasAdminRole === true;
    },
    enabled: !authLoading && !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    isAdmin: isAdmin ?? false,
    isLoading: authLoading || isLoading,
  };
};
