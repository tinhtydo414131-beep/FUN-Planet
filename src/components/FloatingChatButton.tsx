import { MessageCircle, GripVertical } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useDraggable } from "@/hooks/useDraggable";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const FloatingChatButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadCount } = useUnreadMessages();
  
  const {
    position,
    isDragging,
    isLongPressing,
    handleMouseDown,
    handleLongPressStart,
    handleLongPressEnd,
    handleLongPressMove,
    elementRef,
    style
  } = useDraggable({
    storageKey: "floating_chat_position",
    defaultPosition: { x: -80, y: -180 },
    longPressDelay: 300
  });

  // Hide on game pages and chat page
  const hideOnPaths = ['/game/', '/lovable-game/', '/chat', '/messages'];
  const shouldHide = hideOnPaths.some(path => location.pathname.startsWith(path));
  if (shouldHide) return null;

  const handleClick = () => {
    if (!isDragging) {
      navigate("/chat");
    }
  };

  return (
    <div className="md:hidden">
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            ref={elementRef as any}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={handleLongPressStart}
            onTouchEnd={handleLongPressEnd}
            onTouchMove={handleLongPressMove}
            className={cn(
              "fixed bottom-24 right-4 z-40 group touch-none",
              "w-14 h-14 rounded-full",
              "bg-gradient-to-r from-purple-500 to-pink-500",
              "shadow-lg shadow-purple-500/30",
              "flex items-center justify-center",
              "transition-all duration-200",
              isDragging && "scale-110 shadow-2xl shadow-purple-500/50",
              isLongPressing && "scale-105"
            )}
            style={style}
            whileHover={{ scale: isDragging ? 1.1 : 1.05 }}
            whileTap={{ scale: isDragging ? 1.1 : 0.95 }}
            animate={{
              boxShadow: isDragging 
                ? "0 0 30px rgba(168, 85, 247, 0.6)" 
                : "0 10px 25px rgba(168, 85, 247, 0.3)"
            }}
          >
            {/* Drag handle - always visible */}
            <div
              onMouseDown={handleMouseDown}
              className={cn(
                "absolute -top-1 -left-1 w-6 h-6 rounded-full",
                "bg-background/90 backdrop-blur-sm border border-border/50",
                "flex items-center justify-center cursor-grab active:cursor-grabbing",
                "opacity-70 hover:opacity-100 transition-opacity",
                "shadow-sm"
              )}
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>

            {/* Chat icon */}
            <MessageCircle className="w-6 h-6 text-white" strokeWidth={2.5} />

            {/* Unread badge */}
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}

            {/* Pulsing ring when has unread */}
            {unreadCount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 -z-10"
              />
            )}
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="left" className="bg-background/95 backdrop-blur-sm border-border">
          {isDragging ? (
            <p className="text-sm">Đang kéo...</p>
          ) : (
            <p className="text-sm">💬 Tin nhắn {unreadCount > 0 && `(${unreadCount} mới)`}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
