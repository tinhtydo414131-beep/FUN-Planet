import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ban, Loader2 } from "lucide-react";

interface UserBlockModalProps {
  user: {
    id: string;
    username: string;
    email: string;
    wallet_address: string | null;
  };
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BLOCK_REASONS = [
  { value: "multiple_wallets", label: "Multiple Wallets / Multi-account" },
  { value: "fraud", label: "Fraud / Scam" },
  { value: "abuse", label: "System Abuse" },
  { value: "bot", label: "Bot / Automation" },
  { value: "other", label: "Other" }
];

export function UserBlockModal({ user, open, onClose, onSuccess }: UserBlockModalProps) {
  const [reason, setReason] = useState("");
  const [evidence, setEvidence] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setLoading(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      if (!adminUser) {
        toast.error("Not authenticated");
        return;
      }

      // Insert block record
      const { error } = await supabase
        .from("admin_blocked_users")
        .upsert({
          user_id: user.id,
          blocked_by: adminUser.id,
          reason: reason,
          evidence: { note: evidence, wallet: user.wallet_address },
          status: "blocked"
        }, {
          onConflict: "user_id"
        });

      if (error) throw error;

      // Log suspicious activity
      await supabase
        .from("suspicious_activity_logs")
        .insert({
          user_id: user.id,
          activity_type: reason,
          details: { 
            blocked: true, 
            reason: reason,
            evidence: evidence,
            wallet: user.wallet_address 
          },
          risk_score: 100,
          reviewed: true,
          reviewed_by: adminUser.id,
          action_taken: "blocked"
        });

      toast.success(`Blocked user: ${user.username}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Block user error:", error);
      toast.error(error.message || "Failed to block user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-500">
            <Ban className="h-5 w-5" />
            Block User
          </DialogTitle>
          <DialogDescription>
            This will prevent the user from claiming rewards and accessing certain features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="font-medium">{user.username}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.wallet_address && (
              <p className="text-xs font-mono text-muted-foreground">
                {user.wallet_address.slice(0, 10)}...{user.wallet_address.slice(-8)}
              </p>
            )}
          </div>

          {/* Reason Select */}
          <div className="space-y-2">
            <Label>Block Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Evidence */}
          <div className="space-y-2">
            <Label>Evidence / Notes</Label>
            <Textarea
              placeholder="Describe the evidence or reason for blocking..."
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleBlock}
            disabled={loading || !reason}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Ban className="h-4 w-4 mr-2" />
            )}
            Block User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
