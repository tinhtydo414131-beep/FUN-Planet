import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface ChatHistoryGroup {
  date: string;
  label: string;
  messages: ChatMessage[];
}

interface UseAngelAIChatOptions {
  onError?: (error: string) => void;
  userId?: string;
}

export function useAngelAIChat(options: UseAngelAIChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load chat history from database
  const loadChatHistory = useCallback(async (userId: string, limit = 20) => {
    try {
      const { data, error } = await supabase
        .from('angel_ai_chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error loading chat history:', error);
        return [];
      }

      const loadedMessages: ChatMessage[] = (data || []).map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        created_at: msg.created_at
      }));

      setMessages(loadedMessages);
      setHistoryLoaded(true);
      return loadedMessages;
    } catch (err) {
      console.error('Error loading chat history:', err);
      return [];
    }
  }, []);

  // Save message to database
  const saveToHistory = useCallback(async (userId: string, message: ChatMessage) => {
    try {
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
  }, []);

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
          created_at: msg.created_at
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
          messages: msgs.reverse() // Reverse to show oldest first within group
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

      setMessages([]);
      return true;
    } catch (err) {
      console.error('Error clearing history:', err);
      return false;
    }
  }, []);

  const sendMessage = useCallback(async (userMessage: string, userId?: string) => {
    if (!userMessage.trim() || isLoading) return;

    setError(null);
    
    // Add user message
    const userMsg: ChatMessage = { role: "user", content: userMessage.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
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
          messages: newMessages,
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

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
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
              // Update the last assistant message
              setMessages(prev => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "assistant") {
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent
                  };
                }
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, put back and wait
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
              setMessages(prev => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "assistant") {
                  updated[updated.length - 1] = {
                    role: "assistant",
                    content: assistantContent
                  };
                }
                return updated;
              });
            }
          } catch {
            // Ignore partial leftovers
          }
        }
      }

      // Save assistant message to database after completion
      if (userId && assistantContent) {
        saveToHistory(userId, { role: "assistant", content: assistantContent });
      }

    } catch (err) {
      console.error("Angel AI Chat error:", err);
      const errorMessage = "Angel đang bận, thử lại sau nhé! 💫";
      setError(errorMessage);
      options.onError?.(errorMessage);
      // Remove the empty assistant message if error
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1 || prev[prev.length - 1].content !== ""));
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, options, saveToHistory]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    historyLoaded,
    sendMessage,
    clearMessages,
    loadChatHistory,
    clearHistory,
    getGroupedHistory
  };
}
