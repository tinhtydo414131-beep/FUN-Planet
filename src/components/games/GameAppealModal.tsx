import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageSquare, AlertCircle } from "lucide-react";

interface GameAppealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  gameTitle: string;
  rejectionNote: string | null;
  userId: string;
  onSuccess?: () => void;
}

export function GameAppealModal({
  open,
  onOpenChange,
  gameId,
  gameTitle,
  rejectionNote,
  userId,
  onSuccess,
}: GameAppealModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasExistingAppeal, setHasExistingAppeal] = useState(false);

  // Check for existing appeal when modal opens
  const checkExistingAppeal = async () => {
    const { data } = await supabase
      .from("game_appeals")
      .select("id, status")
      .eq("game_id", gameId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setHasExistingAppeal(true);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do khiếu nại");
      return;
    }

    if (reason.length < 20) {
      toast.error("Lý do khiếu nại cần ít nhất 20 ký tự");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("game_appeals").insert({
        game_id: gameId,
        user_id: userId,
        reason: reason.trim(),
        status: "pending",
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Bạn đã gửi khiếu nại cho game này rồi!");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Khiếu nại đã được gửi! Admin sẽ xem xét trong 24-48h.");
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Submit appeal error:", error);
      toast.error("Không thể gửi khiếu nại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Khiếu nại Game bị Từ chối
          </DialogTitle>
          <DialogDescription>
            Nếu bạn cho rằng game bị từ chối không đúng, hãy gửi khiếu nại để admin xem xét lại.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Game info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">{gameTitle}</p>
          </div>

          {/* Rejection reason */}
          {rejectionNote && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-destructive">Lý do bị từ chối:</p>
                  <p className="text-xs text-destructive/80 mt-1">{rejectionNote}</p>
                </div>
              </div>
            </div>
          )}

          {/* Appeal reason */}
          <div>
            <p className="text-sm font-medium mb-2">Lý do khiếu nại của bạn:</p>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Giải thích tại sao bạn cho rằng quyết định từ chối là không đúng... (ít nhất 20 ký tự)"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {reason.length}/500
            </p>
          </div>

          {/* Guidelines */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>💡 <strong>Lưu ý:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>Mỗi game chỉ được khiếu nại 1 lần</li>
              <li>Admin sẽ xem xét trong 24-48 giờ</li>
              <li>Nếu được chấp nhận, game sẽ được duyệt lại</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || reason.length < 20}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Gửi Khiếu nại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
