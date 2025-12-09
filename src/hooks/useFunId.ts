import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface FunID {
  id: string;
  user_id: string;
  wallet_address: string | null;
  soul_nft_id: string;
  soul_nft_name: string;
  energy_level: number;
  light_points: number;
  role: string;
  display_name: string;
  avatar_glow_color: string;
  created_at: string;
  last_angel_message: string | null;
  last_activity_at: string;
}

const FUN_ID_STORAGE_KEY = "fun_planet_fun_id";
const ANGEL_SHOWN_KEY = "fun_planet_angel_shown_today";

export function useFunId() {
  const { user, loading: authLoading } = useAuth();
  const [funId, setFunId] = useState<FunID | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [shouldShowAngel, setShouldShowAngel] = useState(false);

  const fetchFunId = useCallback(async () => {
    if (!user) {
      setFunId(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('fun_id')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching FUN-ID:', error);
        // If no FUN-ID exists, create one (for existing users)
        if (error.code === 'PGRST116') {
          await createFunId();
          return;
        }
      }

      if (data) {
        setFunId(data as FunID);
        localStorage.setItem(FUN_ID_STORAGE_KEY, JSON.stringify(data));
        
        // Check if we should show Angel AI
        const today = new Date().toDateString();
        const angelShownToday = localStorage.getItem(ANGEL_SHOWN_KEY);
        
        // Check if this is a new user (created in last 5 minutes)
        const createdAt = new Date(data.created_at);
        const now = new Date();
        const isRecent = (now.getTime() - createdAt.getTime()) < 5 * 60 * 1000;
        
        if (isRecent && angelShownToday !== today) {
          setIsNewUser(true);
          setShouldShowAngel(true);
          localStorage.setItem(ANGEL_SHOWN_KEY, today);
        } else if (angelShownToday !== today) {
          setShouldShowAngel(true);
          localStorage.setItem(ANGEL_SHOWN_KEY, today);
        }
      }
    } catch (err) {
      console.error('Error in fetchFunId:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createFunId = async () => {
    if (!user) return;

    try {
      // Generate soul NFT number
      const { data: countData } = await supabase
        .from('fun_id')
        .select('id', { count: 'exact' });
      
      const soulNumber = (countData?.length || 0) + 1;
      const soulNftId = `#${String(soulNumber).padStart(6, '0')}`;
      const soulNftName = `Hạt Giống Ánh Sáng #${soulNumber}`;

      const { data, error } = await supabase
        .from('fun_id')
        .insert({
          user_id: user.id,
          soul_nft_id: soulNftId,
          soul_nft_name: soulNftName,
          display_name: user.user_metadata?.username || user.email?.split('@')[0] || 'Bé Ánh Sáng'
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFunId(data as FunID);
        setIsNewUser(true);
        setShouldShowAngel(true);
        localStorage.setItem(FUN_ID_STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(ANGEL_SHOWN_KEY, new Date().toDateString());
      }
    } catch (err) {
      console.error('Error creating FUN-ID:', err);
    }
  };

  const updateFunId = async (updates: Partial<FunID>) => {
    if (!user || !funId) return;

    try {
      const { data, error } = await supabase
        .from('fun_id')
        .update({
          ...updates,
          last_activity_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFunId(data as FunID);
        localStorage.setItem(FUN_ID_STORAGE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error updating FUN-ID:', err);
    }
  };

  const addLightPoints = async (points: number) => {
    if (!funId) return;
    
    const newPoints = (funId.light_points || 0) + points;
    const newEnergyLevel = Math.floor(newPoints / 1000) + 1;
    
    await updateFunId({
      light_points: newPoints,
      energy_level: newEnergyLevel
    });
  };

  const dismissAngel = () => {
    setShouldShowAngel(false);
    setIsNewUser(false);
  };

  const showAngel = () => {
    setShouldShowAngel(true);
  };

  useEffect(() => {
    if (!authLoading) {
      fetchFunId();
    }
  }, [authLoading, fetchFunId]);

  // Auto-login: Check cached FUN-ID on mount
  useEffect(() => {
    const cached = localStorage.getItem(FUN_ID_STORAGE_KEY);
    if (cached && !funId) {
      try {
        setFunId(JSON.parse(cached));
      } catch (e) {
        localStorage.removeItem(FUN_ID_STORAGE_KEY);
      }
    }
  }, []);

  return {
    funId,
    loading: loading || authLoading,
    isNewUser,
    shouldShowAngel,
    updateFunId,
    addLightPoints,
    dismissAngel,
    showAngel,
    refetch: fetchFunId
  };
}
