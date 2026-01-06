// Creator Engagement Rewards Hook
// Rewards creators based on game quality and engagement (comments, ratings)

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface EngagementMilestone {
  type: 'many_comments' | 'high_rating' | 'popular' | 'viral';
  threshold: string;
  amount: number;
}

// Milestone configurations
const ENGAGEMENT_MILESTONES: EngagementMilestone[] = [
  { type: 'many_comments', threshold: '10_comments', amount: 5000 },
  { type: 'many_comments', threshold: '50_comments', amount: 20000 },
  { type: 'many_comments', threshold: '100_comments', amount: 50000 },
  { type: 'high_rating', threshold: 'rating_4.5', amount: 10000 },
  { type: 'high_rating', threshold: 'rating_4.8', amount: 25000 },
  { type: 'popular', threshold: '1000_plays', amount: 15000 },
  { type: 'viral', threshold: '10000_plays', amount: 100000 },
];

interface GameEngagementStats {
  commentsCount: number;
  averageRating: number;
  totalPlays: number;
  ratingCount: number;
}

export function useEngagementRewards() {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  // Get engagement stats for a game
  const getGameEngagementStats = useCallback(async (gameId: string): Promise<GameEngagementStats | null> => {
    try {
      // Get comments count
      const { count: commentsCount } = await supabase
        .from('uploaded_game_comments')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId);

      // Get ratings from uploaded_game_ratings table
      const { data: ratings } = await supabase
        .from('uploaded_game_ratings')
        .select('rating')
        .eq('game_id', gameId);

      // Get play count
      const { count: totalPlays } = await supabase
        .from('game_plays')
        .select('*', { count: 'exact', head: true })
        .eq('game_id', gameId);

      const ratingSum = ratings?.reduce((sum, r) => sum + (r.rating || 0), 0) || 0;
      const ratingCount = ratings?.length || 0;
      const averageRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

      return {
        commentsCount: commentsCount || 0,
        averageRating,
        totalPlays: totalPlays || 0,
        ratingCount,
      };
    } catch (error) {
      console.error('Failed to get engagement stats:', error);
      return null;
    }
  }, []);

  // Check and award engagement rewards for a game
  const checkAndAwardEngagementRewards = useCallback(async (gameId: string, creatorId?: string) => {
    if (!creatorId && !user?.id) return { success: false, awarded: [] };
    
    const targetCreatorId = creatorId || user!.id;
    setIsChecking(true);

    try {
      const stats = await getGameEngagementStats(gameId);
      if (!stats) return { success: false, awarded: [] };

      const awarded: { milestone: string; amount: number }[] = [];

      // Check each milestone
      for (const milestone of ENGAGEMENT_MILESTONES) {
        // Check if already awarded
        const { data: existing } = await supabase
          .from('game_engagement_rewards')
          .select('id')
          .eq('game_id', gameId)
          .eq('creator_id', targetCreatorId)
          .eq('threshold_reached', milestone.threshold)
          .maybeSingle();

        if (existing) continue; // Already awarded

        // Check if milestone is reached
        let reached = false;

        if (milestone.type === 'many_comments') {
          const threshold = parseInt(milestone.threshold.split('_')[0]);
          reached = stats.commentsCount >= threshold;
        } else if (milestone.type === 'high_rating') {
          const threshold = parseFloat(milestone.threshold.split('_')[1]);
          reached = stats.averageRating >= threshold && stats.ratingCount >= 5;
        } else if (milestone.type === 'popular') {
          const threshold = parseInt(milestone.threshold.split('_')[0]);
          reached = stats.totalPlays >= threshold;
        } else if (milestone.type === 'viral') {
          const threshold = parseInt(milestone.threshold.split('_')[0]);
          reached = stats.totalPlays >= threshold;
        }

        if (reached) {
          // Award the milestone
          const { error: insertError } = await supabase
            .from('game_engagement_rewards')
            .insert({
              game_id: gameId,
              creator_id: targetCreatorId,
              reward_type: milestone.type,
              threshold_reached: milestone.threshold,
              amount: milestone.amount,
            });

          if (insertError) {
            console.error('Failed to insert engagement reward:', insertError);
            continue;
          }

          // Update wallet balance
          const { error: updateError } = await supabase.rpc('update_wallet_balance', {
            p_user_id: targetCreatorId,
            p_amount: milestone.amount,
            p_operation: 'add',
          });

          if (!updateError) {
            // Log transaction
            await supabase.from('camly_coin_transactions').insert({
              user_id: targetCreatorId,
              amount: milestone.amount,
              transaction_type: 'creator_engagement_reward',
              description: getEngagementDescription(milestone),
            });

            awarded.push({ milestone: milestone.threshold, amount: milestone.amount });

            // Show notification if current user is the creator
            if (targetCreatorId === user?.id) {
              toast.success(`🏆 Creator Reward!`, {
                description: `${getEngagementDescription(milestone)} +${milestone.amount.toLocaleString()} CAMLY`,
                duration: 5000,
              });
            }
          }
        }
      }

      return { success: true, awarded };
    } catch (error) {
      console.error('Failed to check engagement rewards:', error);
      return { success: false, awarded: [] };
    } finally {
      setIsChecking(false);
    }
  }, [user?.id, getGameEngagementStats]);

  return {
    isChecking,
    getGameEngagementStats,
    checkAndAwardEngagementRewards,
    ENGAGEMENT_MILESTONES,
  };
}

// Helper: Get human-readable description for milestone
function getEngagementDescription(milestone: EngagementMilestone): string {
  switch (milestone.threshold) {
    case '10_comments':
      return '🗨️ Game đạt 10+ comments';
    case '50_comments':
      return '🗨️ Game đạt 50+ comments';
    case '100_comments':
      return '🗨️ Game đạt 100+ comments';
    case 'rating_4.5':
      return '⭐ Game đạt rating 4.5+';
    case 'rating_4.8':
      return '⭐ Game đạt rating 4.8+';
    case '1000_plays':
      return '🎮 Game đạt 1,000 lượt chơi';
    case '10000_plays':
      return '🔥 Game viral 10,000+ lượt chơi';
    default:
      return '🏆 Creator milestone achieved';
  }
}
