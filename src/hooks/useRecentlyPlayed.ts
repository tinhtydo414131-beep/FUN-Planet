import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface RecentGame {
  id: string;
  gameId: string;
  title: string;
  thumbnailUrl: string | null;
  category: string;
  playedAt: string;
  durationSeconds: number;
}

const LOCAL_STORAGE_KEY = "fp_recent_games";
const MAX_RECENT_GAMES = 4;

export function useRecentlyPlayed() {
  const { user } = useAuth();
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFromDatabase = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select(`
          id,
          started_at,
          duration_seconds,
          games:game_id (
            id,
            title,
            thumbnail_url,
            genre
          )
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(20); // Fetch more to allow deduplication

      if (error) throw error;

      // Deduplicate by game_id, keeping only the most recent session
      const uniqueGames = new Map<string, RecentGame>();
      
      (data || []).forEach((session: any) => {
        const game = session.games;
        if (!game || uniqueGames.has(game.id)) return;
        
        uniqueGames.set(game.id, {
          id: session.id,
          gameId: game.id,
          title: game.title || "Unknown Game",
          thumbnailUrl: game.thumbnail_url,
          category: game.genre || "casual",
          playedAt: session.started_at,
          durationSeconds: session.duration_seconds || 0
        });
      });

      return Array.from(uniqueGames.values()).slice(0, MAX_RECENT_GAMES);
    } catch (error) {
      console.error("Error fetching recent games:", error);
      return [];
    }
  }, [user]);

  const fetchFromLocalStorage = useCallback((): RecentGame[] => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_GAMES) : [];
    } catch {
      return [];
    }
  }, []);

  const refreshRecent = useCallback(async () => {
    setLoading(true);
    
    if (user) {
      const games = await fetchFromDatabase();
      setRecentGames(games);
    } else {
      const games = fetchFromLocalStorage();
      setRecentGames(games);
    }
    
    setLoading(false);
  }, [user, fetchFromDatabase, fetchFromLocalStorage]);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  // Static method to save to localStorage (for use in GamePlay)
  const saveToLocalStorage = useCallback((game: Omit<RecentGame, 'id' | 'durationSeconds'>) => {
    try {
      const existing = fetchFromLocalStorage();
      
      // Remove if already exists (will be re-added at top)
      const filtered = existing.filter(g => g.gameId !== game.gameId);
      
      // Add new game at the beginning
      const newGame: RecentGame = {
        ...game,
        id: `local_${Date.now()}`,
        durationSeconds: 0
      };
      
      const updated = [newGame, ...filtered].slice(0, MAX_RECENT_GAMES);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      
      // Update state if this is the current hook instance
      setRecentGames(updated);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [fetchFromLocalStorage]);

  return {
    recentGames,
    loading,
    refreshRecent,
    saveToLocalStorage,
    hasRecentGames: recentGames.length > 0
  };
}
