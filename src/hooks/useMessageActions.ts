import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useMessageActions(userId: string | undefined) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const startEditing = useCallback((messageId: string, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditContent(currentContent);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingMessageId(null);
    setEditContent("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingMessageId || !editContent.trim() || !userId) return false;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .update({ message: editContent.trim() })
        .eq("id", editingMessageId)
        .eq("sender_id", userId);

      if (error) throw error;

      toast.success("Message updated");
      cancelEditing();
      return true;
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Couldn't update message");
      return false;
    }
  }, [editingMessageId, editContent, userId, cancelEditing]);

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!userId) return false;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", userId);

      if (error) throw error;

      toast.success("Message deleted");
      return true;
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Couldn't delete message");
      return false;
    }
  }, [userId]);

  return {
    editingMessageId,
    editContent,
    setEditContent,
    startEditing,
    cancelEditing,
    saveEdit,
    deleteMessage,
  };
}
