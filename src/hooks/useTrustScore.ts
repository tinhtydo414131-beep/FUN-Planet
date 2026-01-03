import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface TrustInfo {
  trust_score: number;
  account_age_days: number;
  successful_claims: number;
  cooldown_remaining: number;
  hourly_requests_remaining: number;
  auto_approve_tier: string;
}

export function useTrustScore() {
  const { user } = useAuth();
  const [trustInfo, setTrustInfo] = useState<TrustInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrustInfo = useCallback(async () => {
    if (!user) {
      setTrustInfo(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_user_trust_info', { p_user_id: user.id });

      if (error) throw error;

      if (data && typeof data === 'object') {
        setTrustInfo(data as unknown as TrustInfo);
      }
    } catch (error) {
      console.error('Error loading trust info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTrustInfo();
  }, [loadTrustInfo]);

  // Auto refresh when cooldown expires
  useEffect(() => {
    if (!trustInfo?.cooldown_remaining || trustInfo.cooldown_remaining <= 0) return;

    const timer = setTimeout(() => {
      loadTrustInfo();
    }, (trustInfo.cooldown_remaining + 1) * 1000);

    return () => clearTimeout(timer);
  }, [trustInfo?.cooldown_remaining, loadTrustInfo]);

  return {
    trustInfo,
    isLoading,
    loadTrustInfo,
  };
}
