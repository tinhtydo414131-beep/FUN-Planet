import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CommentVoteButtonsProps {
  commentId: string;
  likesCount: number;
  dislikesCount: number;
  onVoteChange?: () => void;
}

export function CommentVoteButtons({
  commentId,
  likesCount,
  dislikesCount,
  onVoteChange,
}: CommentVoteButtonsProps) {
  const { user } = useAuth();
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [localLikes, setLocalLikes] = useState(likesCount);
  const [localDislikes, setLocalDislikes] = useState(dislikesCount);
  const [isVoting, setIsVoting] = useState(false);

  // Fetch user's existing vote
  useEffect(() => {
    const fetchUserVote = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('uploaded_game_comment_likes')
        .select('vote_type')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setUserVote(data.vote_type as 'like' | 'dislike');
      }
    };

    fetchUserVote();
  }, [commentId, user]);

  // Sync with parent counts
  useEffect(() => {
    setLocalLikes(likesCount);
    setLocalDislikes(dislikesCount);
  }, [likesCount, dislikesCount]);

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để vote');
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      const { data: existingVote } = await supabase
        .from('uploaded_game_comment_likes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingVote) {
        if (existingVote.vote_type === voteType) {
          // Remove vote
          await supabase
            .from('uploaded_game_comment_likes')
            .delete()
            .eq('id', existingVote.id);
          
          setUserVote(null);
          if (voteType === 'like') {
            setLocalLikes(prev => Math.max(0, prev - 1));
          } else {
            setLocalDislikes(prev => Math.max(0, prev - 1));
          }
        } else {
          // Change vote
          await supabase
            .from('uploaded_game_comment_likes')
            .update({ vote_type: voteType })
            .eq('id', existingVote.id);
          
          setUserVote(voteType);
          if (voteType === 'like') {
            setLocalLikes(prev => prev + 1);
            setLocalDislikes(prev => Math.max(0, prev - 1));
          } else {
            setLocalDislikes(prev => prev + 1);
            setLocalLikes(prev => Math.max(0, prev - 1));
          }
        }
      } else {
        // New vote
        await supabase
          .from('uploaded_game_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            vote_type: voteType,
          });
        
        setUserVote(voteType);
        if (voteType === 'like') {
          setLocalLikes(prev => prev + 1);
        } else {
          setLocalDislikes(prev => prev + 1);
        }
      }

      onVoteChange?.();
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Không thể vote. Vui lòng thử lại.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Like Button */}
      <motion.button
        whileTap={{ scale: 1.2 }}
        onClick={() => handleVote('like')}
        disabled={isVoting}
        className={cn(
          'flex items-center gap-1 text-sm transition-colors disabled:opacity-50',
          userVote === 'like'
            ? 'text-green-500'
            : 'text-muted-foreground hover:text-green-500'
        )}
      >
        <motion.div
          animate={userVote === 'like' ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <ThumbsUp
            className={cn(
              'h-4 w-4 transition-all',
              userVote === 'like' && 'fill-green-500'
            )}
          />
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.span
            key={localLikes}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="min-w-[1ch]"
          >
            {localLikes}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Dislike Button */}
      <motion.button
        whileTap={{ scale: 1.2 }}
        onClick={() => handleVote('dislike')}
        disabled={isVoting}
        className={cn(
          'flex items-center gap-1 text-sm transition-colors disabled:opacity-50',
          userVote === 'dislike'
            ? 'text-red-500'
            : 'text-muted-foreground hover:text-red-500'
        )}
      >
        <motion.div
          animate={userVote === 'dislike' ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <ThumbsDown
            className={cn(
              'h-4 w-4 transition-all',
              userVote === 'dislike' && 'fill-red-500'
            )}
          />
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.span
            key={localDislikes}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="min-w-[1ch]"
          >
            {localDislikes}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
