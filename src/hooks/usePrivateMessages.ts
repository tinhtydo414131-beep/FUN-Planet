import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PrivateMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  message_type: string;
  attachment_url?: string;
  reply_to_id?: string;
  is_read: boolean;
  created_at: string;
  sender?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  reply_to?: PrivateMessage;
}

export interface Conversation {
  conversation_id: string;
  other_user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_message?: PrivateMessage;
  unread_count: number;
}

// Generate consistent conversation ID from two user IDs
export const generateConversationId = (userId1: string, userId2: string): string => {
  const sorted = [userId1, userId2].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

export const usePrivateMessages = (currentUserId: string | null) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const { toast } = useToast();

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!currentUserId) return;

    try {
      // Get all unique conversations for this user
      const { data: messages, error } = await supabase
        .from('private_messages')
        .select('*')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation_id and get last message + unread count
      const conversationMap = new Map<string, { messages: any[]; unread: number }>();
      
      messages?.forEach((msg) => {
        if (!conversationMap.has(msg.conversation_id)) {
          conversationMap.set(msg.conversation_id, { messages: [], unread: 0 });
        }
        const conv = conversationMap.get(msg.conversation_id)!;
        conv.messages.push(msg);
        if (!msg.is_read && msg.receiver_id === currentUserId) {
          conv.unread++;
        }
      });

      // Get other users' profiles
      const otherUserIds = new Set<string>();
      messages?.forEach((msg) => {
        const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        otherUserIds.add(otherId);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(otherUserIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Build conversation list
      const convList: Conversation[] = [];
      let unreadTotal = 0;

      conversationMap.forEach((data, convId) => {
        const lastMsg = data.messages[0];
        const otherId = lastMsg.sender_id === currentUserId ? lastMsg.receiver_id : lastMsg.sender_id;
        const otherUser = profileMap.get(otherId);
        
        if (otherUser) {
          convList.push({
            conversation_id: convId,
            other_user: otherUser,
            last_message: lastMsg,
            unread_count: data.unread
          });
          unreadTotal += data.unread;
        }
      });

      // Sort by last message time
      convList.sort((a, b) => {
        const timeA = a.last_message?.created_at || '';
        const timeB = b.last_message?.created_at || '';
        return timeB.localeCompare(timeA);
      });

      setConversations(convList);
      setTotalUnread(unreadTotal);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!currentUserId) return;

    fetchConversations();

    const channel = supabase
      .channel('private_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages',
          filter: `receiver_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('New private message:', payload);
          fetchConversations();
          
          // Vibrate on new message (mobile)
          if (payload.eventType === 'INSERT' && navigator.vibrate) {
            navigator.vibrate(200);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'private_messages',
          filter: `sender_id=eq.${currentUserId}`
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, fetchConversations]);

  return {
    conversations,
    loading,
    totalUnread,
    refreshConversations: fetchConversations
  };
};

export const usePrivateChat = (currentUserId: string | null, otherUserId: string | null) => {
  const [messages, setMessages] = useState<PrivateMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const conversationId = currentUserId && otherUserId 
    ? generateConversationId(currentUserId, otherUserId)
    : null;

  // Fetch messages for this conversation
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = new Set(data?.map(m => m.sender_id) || []);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', Array.from(senderIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const messagesWithSenders = data?.map(msg => ({
        ...msg,
        sender: profileMap.get(msg.sender_id)
      })) || [];

      setMessages(messagesWithSenders);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;

    await supabase
      .from('private_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', currentUserId)
      .eq('is_read', false);
  }, [conversationId, currentUserId]);

  // Send a message
  const sendMessage = async (message: string, messageType = 'text', attachmentUrl?: string, replyToId?: string) => {
    if (!currentUserId || !otherUserId || !conversationId) return false;

    setSending(true);
    try {
      const { error } = await supabase
        .from('private_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: otherUserId,
          message,
          message_type: messageType,
          attachment_url: attachmentUrl,
          reply_to_id: replyToId
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi tin nhắn",
        variant: "destructive"
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    const channel = supabase
      .channel(`private_chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'private_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('New message in chat:', payload);
          
          // Get sender profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new as PrivateMessage,
            sender: profile
          };

          setMessages(prev => [...prev, newMessage]);
          
          // Mark as read if we're the receiver
          if (payload.new.receiver_id === currentUserId) {
            markAsRead();
          }
        }
      )
      .subscribe();

    // Mark existing unread messages as read
    markAsRead();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, fetchMessages, markAsRead, currentUserId]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    refreshMessages: fetchMessages
  };
};
