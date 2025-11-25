import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface GameLevelConfig {
  currentLevel: number;
  highestLevelCompleted: number;
  difficultyMultiplier: number; // 1.0 at level 1, increases by 5% per level
  coinReward: number; // Starts at 10, increases to 100 at level 10
}

export const useGameLevel = (gameId: string) => {
  const { user } = useAuth();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highestLevelCompleted, setHighestLevelCompleted] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch user's progress for this game
  useEffect(() => {
    if (!user || !gameId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const { data, error } = await supabase
          .from("game_progress")
          .select("highest_level_completed")
          .eq("user_id", user.id)
          .eq("game_id", gameId)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Error fetching progress:", error);
          return;
        }

        if (data) {
          setHighestLevelCompleted(data.highest_level_completed);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, gameId]);

  // Calculate difficulty multiplier: Level 1 = 1.0, Level 2 = 1.05, Level 10 = 1.45
  const getDifficultyMultiplier = (level: number): number => {
    return 1 + (level - 1) * 0.05;
  };

  // Calculate coin reward: Level 1 = 10, Level 2 = 20, ..., Level 10 = 100
  const getCoinReward = (level: number): number => {
    return level * 10;
  };

  // Check if a level is unlocked
  const isLevelUnlocked = (level: number): boolean => {
    if (level === 1) return true;
    return highestLevelCompleted >= level - 1;
  };

  // Complete a level and unlock the next one
  const completeLevel = async (level: number) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu tiến độ!");
      return;
    }

    try {
      // Only update if this is a new achievement
      if (level > highestLevelCompleted) {
        const { error } = await supabase
          .from("game_progress")
          .upsert({
            user_id: user.id,
            game_id: gameId,
            highest_level_completed: level,
            total_stars: level * 3, // 3 stars per level
          }, {
            onConflict: "user_id,game_id"
          });

        if (error) {
          console.error("Error saving progress:", error);
          toast.error("Không thể lưu tiến độ!");
          return;
        }

        setHighestLevelCompleted(level);
        
        // Award coins based on level
        const coinReward = getCoinReward(level);
        
        // Update wallet balance
        const { data: profileData } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", user.id)
          .single();

        if (profileData) {
          const newBalance = (profileData.wallet_balance || 0) + coinReward;
          await supabase
            .from("profiles")
            .update({ wallet_balance: newBalance })
            .eq("id", user.id);
          
          toast.success(`🎉 Hoàn thành Level ${level}! +${coinReward} Camly Coins!`);
        }
      }
    } catch (error) {
      console.error("Error completing level:", error);
    }
  };

  // Get current level config
  const getLevelConfig = (level: number = currentLevel): GameLevelConfig => {
    return {
      currentLevel: level,
      highestLevelCompleted,
      difficultyMultiplier: getDifficultyMultiplier(level),
      coinReward: getCoinReward(level),
    };
  };

  return {
    currentLevel,
    setCurrentLevel,
    highestLevelCompleted,
    loading,
    isLevelUnlocked,
    completeLevel,
    getLevelConfig,
    getDifficultyMultiplier,
    getCoinReward,
  };
};
