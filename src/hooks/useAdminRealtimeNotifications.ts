import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  priority: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface UseAdminRealtimeNotificationsOptions {
  onNewGame?: () => void;
  onSuspiciousActivity?: () => void;
  soundEnabled?: boolean;
}

export const useAdminRealtimeNotifications = (options: UseAdminRealtimeNotificationsOptions = {}) => {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load existing notifications
  const loadNotifications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_realtime_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedData = (data || []) as AdminNotification[];
      setNotifications(typedData);
      setUnreadCount(typedData.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (options.soundEnabled !== false) {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Silently fail if audio can't play
      });
    }
  }, [options.soundEnabled]);

  // Show toast notification
  const showToast = useCallback((notification: AdminNotification) => {
    const variant = notification.priority === 'high' ? 'destructive' : 'default';
    
    toast({
      title: notification.title,
      description: notification.message,
      variant,
    });
  }, [toast]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('admin_realtime_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString(),
        read_by: user.id 
      })
      .eq('id', notificationId);

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from('admin_realtime_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString(),
        read_by: user.id 
      })
      .in('id', unreadIds);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [notifications]);

  // Handle new notification from realtime
  const handleNewNotification = useCallback((payload: { new: AdminNotification }) => {
    const notification = payload.new;
    
    setNotifications(prev => [notification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    playNotificationSound();
    showToast(notification);

    // Trigger callbacks
    if (notification.notification_type === 'new_game' && options.onNewGame) {
      options.onNewGame();
    }
    if (notification.notification_type === 'suspicious_activity' && options.onSuspiciousActivity) {
      options.onSuspiciousActivity();
    }
  }, [playNotificationSound, showToast, options]);

  // Subscribe to realtime notifications
  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_realtime_notifications'
        },
        handleNewNotification
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, handleNewNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  };
};
