import { useState } from 'react';
import { Bell, Check, CheckCheck, Gamepad2, AlertTriangle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminNotification, useAdminRealtimeNotifications } from '@/hooks/useAdminRealtimeNotifications';
import { formatDistanceToNow } from 'date-fns';

interface AdminRealtimeBellProps {
  onNavigateToTab?: (tab: string) => void;
  onRefreshStats?: () => void;
}

export const AdminRealtimeBell = ({ onNavigateToTab, onRefreshStats }: AdminRealtimeBellProps) => {
  const [open, setOpen] = useState(false);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useAdminRealtimeNotifications({
    onNewGame: onRefreshStats,
    onSuspiciousActivity: onRefreshStats,
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_game':
        return <Gamepad2 className="h-4 w-4 text-blue-500" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'large_claim':
        return <Coins className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTabForNotification = (type: string): string => {
    switch (type) {
      case 'new_game':
        return 'games';
      case 'suspicious_activity':
        return 'fraud';
      case 'large_claim':
        return 'rewards';
      default:
        return 'overview';
    }
  };

  const handleNotificationClick = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    const tab = getTabForNotification(notification.notification_type);
    onNavigateToTab?.(tab);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          aria-label="Notifications"
        >
          <Bell className={cn(
            "h-5 w-5 transition-colors",
            unreadCount > 0 && "text-primary animate-pulse"
          )} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Admin Notifications</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left p-3 hover:bg-accent transition-colors flex gap-3",
                    !notification.is_read && "bg-accent/50"
                  )}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.notification_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-sm truncate",
                        !notification.is_read && "font-semibold"
                      )}>
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {notification.is_read && (
                    <Check className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
