import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  message: string;
  created_at: string;
  room_id: string;
  sender_id: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
  room?: {
    name: string | null;
    room_type: string;
  };
}

export function useMessageSearch(userId: string | undefined) {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchMessages = useCallback(async (query: string) => {
    if (!query.trim() || !userId) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // First get all room IDs the user is a member of
      const { data: memberships } = await supabase
        .from("chat_room_members")
        .select("room_id")
        .eq("user_id", userId);

      const roomIds = memberships?.map(m => m.room_id) || [];

      if (roomIds.length === 0) {
        setSearchResults([]);
        return;
      }

      // Search messages in those rooms
      const { data: messages, error } = await supabase
        .from("chat_messages")
        .select(`
          id,
          message,
          created_at,
          room_id,
          sender_id,
          profiles!chat_messages_sender_id_fkey(username, avatar_url),
          chat_rooms!chat_messages_room_id_fkey(name, room_type)
        `)
        .in("room_id", roomIds)
        .ilike("message", `%${query}%`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedResults: SearchResult[] = (messages || []).map((m: any) => ({
        id: m.id,
        message: m.message,
        created_at: m.created_at,
        room_id: m.room_id,
        sender_id: m.sender_id,
        sender: m.profiles,
        room: m.chat_rooms,
      }));

      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Error searching messages:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [userId]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchMessages,
    clearSearch,
  };
}
