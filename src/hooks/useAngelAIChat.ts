import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAngelChatStore, ChatMessage } from "@/stores/angelChatStore";

export type { ChatMessage } from "@/stores/angelChatStore";

export interface ChatHistoryGroup {
  date: string;
  label: string;
  messages: ChatMessage[];
}

interface UseAngelAIChatOptions {
  onError?: (error: string) => void;
  userId?: string;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

export function useAngelAIChat(options: UseAngelAIChatOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const retryCountRef = useRef(0);
  
  // Use Zustand store for persistent messages
  const { 
    messages, 
    setMessages, 
    addMessage, 
    updateLastMessage, 
    clearMessages: clearStoreMessages,
    setLastUserId,
    lastUserId,
    lastSyncTime,
    setLastSyncTime,
    isReconnecting,
    setIsReconnecting
  } = useAngelChatStore();

  // Session recovery helper
  const ensureSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError || !refreshData.session) {
          console.warn('Session refresh failed:', refreshError);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error('Session check error:', err);
      return false;
    }
  }, []);

  // Load chat history from database with retry logic
  const loadChatHistory = useCallback(async (userId: string, limit = 50) => {
    // First, check if we have cached messages for this user
    const cachedMessages = useAngelChatStore.getState().getMessagesForUser(userId);
    if (cachedMessages.length > 0 && !historyLoaded) {
      setHistoryLoaded(true);
      // Background sync will update if needed
    }

    try {
      setIsReconnecting(true);
      
      // Ensure we have a valid session
      const hasSession = await ensureSession();
      if (!hasSession && retryCountRef.current < MAX_RETRY_ATTEMPTS) {
        retryCountRef.current++;
        setTimeout(() => loadChatHistory(userId, limit), RETRY_DELAY * retryCountRef.current);
        return cachedMessages;
      }
      
      const { data, error } = await supabase
        .from('angel_ai_chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error loading chat history:', error);
        // Return cached messages on error
        return cachedMessages;
      }

      const loadedMessages: ChatMessage[] = (data || []).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        created_at: msg.created_at,
        id: msg.id
      }));

      // Update store with fresh data
      setMessages(loadedMessages);
      setLastUserId(userId);
      setLastSyncTime(Date.now());
      setHistoryLoaded(true);
      retryCountRef.current = 0;
      
      return loadedMessages;
    } catch (err) {
      console.error('Error loading chat history:', err);
      return cachedMessages;
    } finally {
      setIsReconnecting(false);
    }
  }, [ensureSession, historyLoaded, setIsReconnecting, setLastSyncTime, setLastUserId, setMessages]);

  // Save message to database with retry
  const saveToHistory = useCallback(async (userId: string, message: ChatMessage) => {
    try {
      const hasSession = await ensureSession();
      if (!hasSession) {
        console.warn('No session, message will be saved on next sync');
        return;
      }

      const { error } = await supabase
        .from('angel_ai_chat_history')
        .insert({
          user_id: userId,
          role: message.role,
          content: message.content
        });

      if (error) {
        console.error('Error saving message to history:', error);
      }
    } catch (err) {
      console.error('Error saving message:', err);
    }
  }, [ensureSession]);

  // Get grouped history for display
  const getGroupedHistory = useCallback(async (userId: string): Promise<ChatHistoryGroup[]> => {
    try {
      const { data, error } = await supabase
        .from('angel_ai_chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !data) return [];

      // Group by date
      const grouped: Record<string, ChatMessage[]> = {};
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      data.forEach(msg => {
        const msgDate = new Date(msg.created_at).toDateString();
        if (!grouped[msgDate]) {
          grouped[msgDate] = [];
        }
        grouped[msgDate].push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          created_at: msg.created_at,
          id: msg.id
        });
      });

      // Convert to array with labels
      return Object.entries(grouped).map(([date, msgs]) => {
        let label = date;
        if (date === today) label = "Hôm nay";
        else if (date === yesterday) label = "Hôm qua";
        else {
          const d = new Date(date);
          label = d.toLocaleDateString('vi-VN', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'numeric' 
          });
        }
        return {
          date,
          label,
          messages: msgs.reverse()
        };
      });
    } catch (err) {
      console.error('Error getting grouped history:', err);
      return [];
    }
  }, []);

  // Clear all chat history
  const clearHistory = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase
        .from('angel_ai_chat_history')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing history:', error);
        return false;
      }

      clearStoreMessages();
      return true;
    } catch (err) {
      console.error('Error clearing history:', err);
      return false;
    }
  }, [clearStoreMessages]);

  const sendMessage = useCallback(async (userMessage: string, userId?: string) => {
    if (!userMessage.trim() || isLoading) return;

    setError(null);
    
    // Add user message optimistically
    const userMsg: ChatMessage = { 
      role: "user", 
      content: userMessage.trim(),
      id: crypto.randomUUID()
    };
    addMessage(userMsg);
    setIsLoading(true);

    // Save user message to database
    if (userId) {
      saveToHistory(userId, userMsg);
    }

    let assistantContent = "";

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/angel-ai-chat`;

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          userId 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Có lỗi xảy ra, thử lại nhé! 💫";
        setError(errorMessage);
        options.onError?.(errorMessage);
        setIsLoading(false);
        return;
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      // Add empty assistant message
      addMessage({ role: "assistant", content: "", id: crypto.randomUUID() });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateLastMessage(assistantContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateLastMessage(assistantContent);
            }
          } catch {
            // Ignore partial leftovers
          }
        }
      }

      // Save assistant message to database
      if (userId && assistantContent) {
        saveToHistory(userId, { role: "assistant", content: assistantContent });
      }

    } catch (err) {
      console.error("Angel AI Chat error:", err);
      const errorMessage = "Angel đang bận, thử lại sau nhé! 💫";
      setError(errorMessage);
      options.onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, options, saveToHistory, addMessage, updateLastMessage]);

  const clearMessages = useCallback(() => {
    clearStoreMessages();
    setError(null);
  }, [clearStoreMessages]);

  return {
    messages,
    isLoading,
    error,
    historyLoaded,
    isReconnecting,
    sendMessage,
    clearMessages,
    loadChatHistory,
    clearHistory,
    getGroupedHistory
  };
}
