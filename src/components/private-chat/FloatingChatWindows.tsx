import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { X, Minus, MessageCircle } from 'lucide-react';
import { PrivateChatView } from './PrivateChatView';
import { cn } from '@/lib/utils';

export interface ChatWindow {
  id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  minimized: boolean;
}

interface FloatingChatWindowsProps {
  currentUserId: string;
  windows: ChatWindow[];
  onClose: (userId: string) => void;
  onToggleMinimize: (userId: string) => void;
}

export const FloatingChatWindows: React.FC<FloatingChatWindowsProps> = ({
  currentUserId,
  windows,
  onClose,
  onToggleMinimize
}) => {
  // Position windows from right to left
  const getWindowPosition = (index: number) => {
    return {
      right: 20 + (index * 340) // 320px width + 20px gap
    };
  };

  return (
    <div className="fixed bottom-0 z-50 hidden md:block pointer-events-none">
      <AnimatePresence>
        {windows.map((window, index) => {
          const position = getWindowPosition(index);
          
          return (
            <motion.div
              key={window.id}
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.8 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{ right: position.right }}
              className="fixed bottom-0 pointer-events-auto"
            >
              {window.minimized ? (
                // Minimized state - just avatar bubble
                <motion.button
                  onClick={() => onToggleMinimize(window.user.id)}
                  className="relative mb-4 group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="h-14 w-14 ring-4 ring-background shadow-xl cursor-pointer">
                    <AvatarImage src={window.user.avatar_url || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-lg">
                      {window.user.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Close button on hover */}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(window.user.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  {/* Name tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {window.user.username}
                  </div>
                </motion.button>
              ) : (
                // Expanded chat window
                <div className="w-[320px] shadow-2xl rounded-t-xl overflow-hidden border border-border">
                  {/* Custom header with minimize/close */}
                  <div className="flex items-center justify-between p-2 bg-gradient-to-r from-pink-500 to-purple-500">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 ring-2 ring-white/30">
                        <AvatarImage src={window.user.avatar_url || ''} />
                        <AvatarFallback className="bg-white/20 text-white text-sm">
                          {window.user.username[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white text-sm">
                        {window.user.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-white hover:bg-white/20"
                        onClick={() => onToggleMinimize(window.user.id)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-white hover:bg-white/20"
                        onClick={() => onClose(window.user.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Chat content */}
                  <div className="h-[400px]">
                    <PrivateChatView
                      currentUserId={currentUserId}
                      otherUser={window.user}
                      isFullscreen={false}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Global chat windows state manager
import { create } from 'zustand';

interface ChatWindowsStore {
  windows: ChatWindow[];
  openChat: (user: { id: string; username: string; avatar_url: string | null }) => void;
  closeChat: (userId: string) => void;
  toggleMinimize: (userId: string) => void;
}

export const useChatWindows = create<ChatWindowsStore>((set, get) => ({
  windows: [],
  
  openChat: (user) => {
    const { windows } = get();
    const existing = windows.find(w => w.user.id === user.id);
    
    if (existing) {
      // If already open, just maximize it
      set({
        windows: windows.map(w => 
          w.user.id === user.id ? { ...w, minimized: false } : w
        )
      });
    } else {
      // Open new window (max 3 windows)
      const newWindow: ChatWindow = {
        id: user.id,
        user,
        minimized: false
      };
      
      set({
        windows: [...windows.slice(-2), newWindow] // Keep last 2 + new one
      });
    }
  },
  
  closeChat: (userId) => {
    set({
      windows: get().windows.filter(w => w.user.id !== userId)
    });
  },
  
  toggleMinimize: (userId) => {
    set({
      windows: get().windows.map(w =>
        w.user.id === userId ? { ...w, minimized: !w.minimized } : w
      )
    });
  }
}));
