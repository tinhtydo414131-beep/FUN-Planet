import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Conversation } from '@/hooks/usePrivateMessages';
import { MessageCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  loading,
  onSelectConversation,
  selectedConversationId
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(conv =>
    conv.other_user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Search Bar */}
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <AnimatePresence>
          {filteredConversations.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 px-4 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center mb-4">
                <MessageCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Chưa có cuộc trò chuyện</h3>
              <p className="text-muted-foreground text-sm">
                Bắt đầu nhắn tin với bạn bè ngay!
              </p>
            </motion.div>
          ) : (
            <div className="divide-y divide-border/30">
              {filteredConversations.map((conversation, index) => (
                <motion.button
                  key={conversation.conversation_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectConversation(conversation)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-accent/50 transition-all duration-200 active:scale-[0.98] ${
                    selectedConversationId === conversation.conversation_id 
                      ? 'bg-accent' 
                      : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-14 w-14 ring-2 ring-background shadow-lg">
                      <AvatarImage src={conversation.other_user.avatar_url || ''} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-lg font-bold">
                        {conversation.other_user.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Online indicator could go here */}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-semibold truncate ${
                        conversation.unread_count > 0 ? 'text-foreground' : 'text-foreground/80'
                      }`}>
                        {conversation.other_user.username}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {conversation.last_message && formatDistanceToNow(
                          new Date(conversation.last_message.created_at),
                          { addSuffix: false, locale: vi }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={`text-sm truncate ${
                        conversation.unread_count > 0 
                          ? 'text-foreground font-medium' 
                          : 'text-muted-foreground'
                      }`}>
                        {conversation.last_message?.message_type === 'image' 
                          ? '📷 Đã gửi ảnh'
                          : conversation.last_message?.message_type === 'sticker'
                          ? '🎨 Đã gửi sticker'
                          : conversation.last_message?.message || 'Bắt đầu cuộc trò chuyện'}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  );
};
