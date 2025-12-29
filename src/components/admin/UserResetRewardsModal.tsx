import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserResetRewardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    username: string;
    wallet_balance?: number;
    camly_balance?: number;
    pending_amount?: number;
    claimed_amount?: number;
    total_earned?: number;
  } | null;
  onSuccess: () => void;
}

export function UserResetRewardsModal({ open, onOpenChange, user, onSuccess }: UserResetRewardsModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleReset = async () => {
    if (!user || confirmText !== "RESET") return;

    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user?.id) {
        toast.error("Not authenticated");
        return;
      }

      const { data, error } = await supabase.rpc("admin_reset_user_rewards", {
        p_target_user_id: user.id,
        p_admin_user_id: session.session.user.id,
        p_reason: reason || "Admin reset from dashboard"
      });

      if (error) {
        console.error("Reset error:", error);
        toast.error("Failed to reset rewards: " + error.message);
        return;
      }

      const result = data as { success: boolean; error?: string; username?: string; previous_balances?: Record<string, number> };
      
      if (result?.success) {
        toast.success(`Successfully reset all rewards for ${user.username}`);
        onSuccess();
        onOpenChange(false);
        setReason("");
        setConfirmText("");
      } else {
        toast.error(result?.error || "Failed to reset rewards");
      }
    } catch (err) {
      console.error("Reset error:", err);
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num?: number) => {
    if (num === undefined || num === null) return "0";
    return num.toLocaleString();
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Reset All Rewards
          </DialogTitle>
          <DialogDescription>
            This will reset ALL rewards for <strong>{user.username}</strong> to 0. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current balances */}
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
            <p className="text-sm font-medium text-destructive">Current Balances (will be reset to 0):</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Wallet Balance:</div>
              <div className="font-mono">{formatNumber(user.wallet_balance)}</div>
              <div>CAMLY Balance:</div>
              <div className="font-mono">{formatNumber(user.camly_balance)}</div>
              <div>Pending Amount:</div>
              <div className="font-mono">{formatNumber(user.pending_amount)}</div>
              <div>Claimed Amount:</div>
              <div className="font-mono">{formatNumber(user.claimed_amount)}</div>
              <div>Total Earned:</div>
              <div className="font-mono">{formatNumber(user.total_earned)}</div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for reset</Label>
            <Input
              id="reason"
              placeholder="e.g., Fraud detected, duplicate rewards, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="confirm">Type "RESET" to confirm</Label>
            <Input
              id="confirm"
              placeholder="RESET"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
              className="font-mono"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReset} 
            disabled={loading || confirmText !== "RESET"}
          >
            {loading ? (
              <>
                <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Rewards
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
