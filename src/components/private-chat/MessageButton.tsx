import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useChatWindows } from './FloatingChatWindows';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MessageButtonProps {
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  variant?: 'default' | 'outline' | 'ghost' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

export const MessageButton: React.FC<MessageButtonProps> = ({
  user,
  variant = 'default',
  size = 'default',
  className,
  showText = true
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { openChat } = useChatWindows();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (isMobile) {
      // On mobile, navigate to chat page
      navigate(`/messages?user=${user.id}`);
    } else {
      // On desktop, open floating chat window
      openChat(user);
    }
  };

  if (variant === 'icon') {
    return (
      <Button
        onClick={handleClick}
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 hover:from-pink-500/30 hover:to-purple-500/30",
          className
        )}
      >
        <MessageCircle className="h-4 w-4 text-pink-500" />
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={cn(
        "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white",
        className
      )}
    >
      <MessageCircle className="h-4 w-4" />
      {showText && <span className="ml-2">Nhắn tin</span>}
    </Button>
  );
};
