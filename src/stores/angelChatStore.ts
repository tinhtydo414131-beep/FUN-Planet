import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  id?: string;
}

interface AngelChatState {
  messages: ChatMessage[];
  lastUserId: string | null;
  lastSyncTime: number | null;
  isReconnecting: boolean;
  
  // Actions
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setLastUserId: (userId: string | null) => void;
  setLastSyncTime: (time: number) => void;
  setIsReconnecting: (value: boolean) => void;
  
  // Helpers
  getMessagesForUser: (userId: string) => ChatMessage[];
}

export const useAngelChatStore = create<AngelChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      lastUserId: null,
      lastSyncTime: null,
      isReconnecting: false,
      
      setMessages: (messages) => set({ messages, lastSyncTime: Date.now() }),
      
      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, { ...message, id: message.id || crypto.randomUUID() }] 
      })),
      
      updateLastMessage: (content) => set((state) => {
        const updated = [...state.messages];
        if (updated.length > 0 && updated[updated.length - 1]?.role === "assistant") {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content
          };
        }
        return { messages: updated };
      }),
      
      clearMessages: () => set({ messages: [], lastSyncTime: null }),
      
      setLastUserId: (userId) => set({ lastUserId: userId }),
      
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      
      setIsReconnecting: (value) => set({ isReconnecting: value }),
      
      getMessagesForUser: (userId) => {
        const state = get();
        // Only return cached messages if they belong to the same user
        if (state.lastUserId === userId) {
          return state.messages;
        }
        return [];
      },
    }),
    {
      name: 'angel-chat-storage',
      partialize: (state) => ({
        messages: state.messages.slice(-100), // Keep last 100 messages
        lastUserId: state.lastUserId,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);
