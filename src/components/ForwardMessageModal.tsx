import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Forward, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversation {
  roomId: string;
  name: string;
  avatarUrl?: string | null;
  isGroup: boolean;
}

interface ForwardMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: {
    text: string;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
    attachmentName?: string | null;
    senderName?: string;
  } | null;
  conversations: Conversation[];
  userId: string;
  currentRoomId: string;
}

export function ForwardMessageModal({
  open,
  onOpenChange,
  message,
  conversations,
  userId,
  currentRoomId,
}: ForwardMessageModalProps) {
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [forwarding, setForwarding] = useState(false);

  const availableConversations = conversations.filter(c => c.roomId !== currentRoomId);

  const toggleRoom = (roomId: string) => {
    setSelectedRooms(prev =>
      prev.includes(roomId)
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const handleForward = async () => {
    if (!message || selectedRooms.length === 0) return;

    setForwarding(true);
    try {
      const forwardedText = message.senderName 
        ? `↩️ Forwarded from ${message.senderName}:\n${message.text}`
        : `↩️ Forwarded:\n${message.text}`;

      const inserts = selectedRooms.map(roomId => ({
        room_id: roomId,
        sender_id: userId,
        message: forwardedText,
        is_read: false,
        attachment_url: message.attachmentUrl || null,
        attachment_type: message.attachmentType || null,
        attachment_name: message.attachmentName || null,
      }));

      const { error } = await supabase
        .from("chat_messages")
        .insert(inserts);

      if (error) throw error;

      toast.success(`Message forwarded to ${selectedRooms.length} conversation${selectedRooms.length > 1 ? 's' : ''}`);
      setSelectedRooms([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error forwarding message:", error);
      toast.error("Failed to forward message");
    } finally {
      setForwarding(false);
    }
  };

  const handleClose = () => {
    setSelectedRooms([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-fredoka">
            <Forward className="w-5 h-5 text-primary" />
            Forward Message
          </DialogTitle>
        </DialogHeader>

        {message && (
          <div className="p-3 bg-muted rounded-lg mb-4">
            <p className="text-sm text-muted-foreground mb-1">Message to forward:</p>
            <p className="text-sm line-clamp-3">{message.text}</p>
            {message.attachmentName && (
              <p className="text-xs text-primary mt-1">📎 {message.attachmentName}</p>
            )}
          </div>
        )}

        <ScrollArea className="h-[300px] -mx-6 px-6">
          {availableConversations.length > 0 ? (
            <div className="space-y-2">
              {availableConversations.map((conv) => (
                <button
                  key={conv.roomId}
                  onClick={() => toggleRoom(conv.roomId)}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                    selectedRooms.includes(conv.roomId)
                      ? "bg-primary/10 border-2 border-primary/30"
                      : "hover:bg-muted border-2 border-transparent"
                  }`}
                >
                  <div className="relative">
                    {conv.isGroup ? (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <Avatar className="w-10 h-10 border-2 border-primary/20">
                        <AvatarImage src={conv.avatarUrl || undefined} />
                        <AvatarFallback className="bg-primary/20 text-primary font-bold">
                          {conv.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{conv.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {conv.isGroup ? "Group" : "Private"}
                    </p>
                  </div>
                  {selectedRooms.includes(conv.roomId) && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mb-4 opacity-30" />
              <p>No other conversations available</p>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleForward}
            disabled={forwarding || selectedRooms.length === 0}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {forwarding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Forwarding...
              </>
            ) : (
              <>
                <Forward className="w-4 h-4 mr-2" />
                Forward ({selectedRooms.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
