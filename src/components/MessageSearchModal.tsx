import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MessageCircle, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMessageSearch } from "@/hooks/useMessageSearch";
import { useDebounce } from "@/hooks/useDebounce";

interface MessageSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | undefined;
  onSelectResult: (roomId: string) => void;
}

export function MessageSearchModal({
  open,
  onOpenChange,
  userId,
  onSelectResult,
}: MessageSearchModalProps) {
  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    searchMessages,
    clearSearch,
  } = useMessageSearch(userId);

  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery) {
      searchMessages(debouncedQuery);
    }
  }, [debouncedQuery, searchMessages]);

  useEffect(() => {
    if (!open) {
      clearSearch();
    }
  }, [open, clearSearch]);

  const handleSelect = (roomId: string) => {
    onSelectResult(roomId);
    onOpenChange(false);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-fredoka">
            <Search className="w-5 h-5 text-primary" />
            Search Messages
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in all conversations..."
            className="pl-10"
            autoFocus
          />
        </div>

        <ScrollArea className="h-[400px] -mx-6 px-6">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result.room_id)}
                  className="w-full p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={result.sender?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                        {result.sender?.username?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {result.sender?.username || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(result.created_at), "MMM d, HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {highlightMatch(result.message, searchQuery)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {result.room?.room_type === "group" ? (
                          <Users className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <MessageCircle className="w-3 h-3 text-muted-foreground" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {result.room?.room_type === "group" ? result.room.name || "Group" : "Private"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Search className="w-12 h-12 mb-4 opacity-30" />
              <p>No messages found</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-4 opacity-30" />
              <p>Start typing to search messages</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
