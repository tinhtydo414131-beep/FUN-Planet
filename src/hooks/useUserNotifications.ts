import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { fireDiamondConfetti } from '@/components/DiamondConfetti';
import type { Json } from '@/integrations/supabase/types';

export interface UserNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  data: Json;
  is_read: boolean;
  created_at: string;
}

export function useUserNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle new notification with celebration
  const handleNewNotification = useCallback((notification: UserNotification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    const dataObj = notification.data as Record<string, any> | null;

    // Special handling for game_approved
    if (notification.notification_type === 'game_approved') {
      // Rainbow confetti celebration!
      fireDiamondConfetti('rainbow');
      
      // Show beautiful toast
      const rewardText = dataObj?.reward_amount 
        ? ` +${Number(dataObj.reward_amount).toLocaleString()} CAMLY!`
        : '';
      
      toast.success(`🎉 ${notification.title}`, {
        description: notification.message + rewardText,
        duration: 8000,
      });
    } else if (notification.notification_type === 'game_rejected') {
      toast.error(`❌ ${notification.title}`, {
        description: notification.message,
        duration: 6000,
      });
    } else if (notification.notification_type === 'comment_reply') {
      // Someone replied to user's comment
      toast.info(`💬 ${notification.title}`, {
        description: notification.message,
        duration: 5000,
        action: dataObj?.game_id ? {
          label: 'Xem',
          onClick: () => navigate(`/game/${dataObj.game_id}`),
        } : undefined,
      });
    } else if (notification.notification_type === 'new_game_comment') {
      // New comment on user's game
      toast.info(`💬 ${notification.title}`, {
        description: notification.message,
        duration: 5000,
        action: dataObj?.game_id ? {
          label: 'Xem',
          onClick: () => navigate(`/game/${dataObj.game_id}`),
        } : undefined,
      });
    } else if (notification.notification_type === 'weekly_summary') {
      // Weekly summary celebration with special sound
      import('@/utils/soundEffects').then(({ playWeeklySummarySound }) => {
        playWeeklySummarySound();
      });
      fireDiamondConfetti('rainbow');
      
      const summary = dataObj ? 
        `🎮 ${dataObj.games_played || 0} game • 💎 ${Number(dataObj.camly_earned || 0).toLocaleString()} CAMLY • 🏆 ${dataObj.new_achievements || 0} thành tích` 
        : notification.message;
      
      toast.success(`📊 ${notification.title}`, {
        description: summary,
        duration: 8000,
      });
    } else {
      // Generic notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    }
  }, [navigate]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as UserNotification;
          handleNewNotification(newNotification);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications, handleNewNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
