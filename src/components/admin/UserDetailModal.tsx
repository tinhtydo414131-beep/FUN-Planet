import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, 
  Wallet, 
  Mail, 
  Calendar,
  Coins,
  TrendingUp,
  Clock,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { UserResetRewardsModal } from "./UserResetRewardsModal";

interface UserDetailModalProps {
  user: {
    id: string;
    username: string;
    email: string;
    wallet_address: string | null;
    created_at: string;
    total_earned: number;
    pending_amount: number;
    claimed_amount: number;
    isBlocked: boolean;
    wallet_balance?: number;
    camly_balance?: number;
  };
  open: boolean;
  onClose: () => void;
  onDataRefresh?: () => void;
}

interface ClaimHistory {
  id: string;
  claim_date: string;
  amount_claimed: number;
}

export function UserDetailModal({ user, open, onClose, onDataRefresh }: UserDetailModalProps) {
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    if (open) {
      loadClaimHistory();
    }
  }, [open, user.id]);

  const loadClaimHistory = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("daily_claim_logs")
        .select("id, claim_date, amount_claimed")
        .eq("user_id", user.id)
        .order("claim_date", { ascending: false })
        .limit(10);

      setClaimHistory(data || []);
    } catch (error) {
      console.error("Load claim history error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleResetSuccess = () => {
    onDataRefresh?.();
  };

  // Check if balances are out of sync
  const isOutOfSync = user.wallet_balance !== undefined && 
                       user.camly_balance !== undefined && 
                       user.wallet_balance !== user.camly_balance;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription className="sr-only">
              View detailed information about user {user?.username || 'Unknown'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Info */}
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                  {user.isBlocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge className="bg-green-500/20 text-green-500">Active</Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>

                {user.wallet_address && (
                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-xs">
                      {user.wallet_address}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {format(new Date(user.created_at), "dd/MM/yyyy")}</span>
                </div>
              </CardContent>
            </Card>

            {/* Balances with sync status */}
            {(user.wallet_balance !== undefined || user.camly_balance !== undefined) && (
              <Card className={isOutOfSync ? "border-amber-500/50" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium">Balance Status</h4>
                    {isOutOfSync && (
                      <Badge variant="outline" className="text-amber-500 border-amber-500/50">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Out of Sync
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Wallet Balance</p>
                      <p className="font-mono font-bold">{formatNumber(user.wallet_balance || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">CAMLY Balance</p>
                      <p className="font-mono font-bold">{formatNumber(user.camly_balance || 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reward Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card>
                <CardContent className="pt-3 text-center">
                  <Coins className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                  <p className="font-bold">{formatNumber(user.total_earned)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 text-center">
                  <Clock className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="font-bold">{formatNumber(user.pending_amount)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-3 text-center">
                  <TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Claimed</p>
                  <p className="font-bold">{formatNumber(user.claimed_amount)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            <Card className="border-destructive/20">
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3 text-destructive">Admin Actions</h4>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowResetModal(true)}
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset All Rewards
                </Button>
              </CardContent>
            </Card>

            {/* Claim History */}
            <Card>
              <CardContent className="pt-4">
                <h4 className="text-sm font-medium mb-3">Recent Claims</h4>
                {loading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
                ) : claimHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No claims yet</p>
                ) : (
                  <div className="space-y-2">
                    {claimHistory.map((claim) => (
                      <div 
                        key={claim.id}
                        className="flex items-center justify-between py-2 border-b border-border last:border-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(claim.claim_date), "dd/MM/yyyy")}
                        </span>
                        <span className="font-mono text-sm">
                          +{formatNumber(claim.amount_claimed)} CAMLY
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      <UserResetRewardsModal
        open={showResetModal}
        onOpenChange={setShowResetModal}
        user={user ? {
          id: user.id,
          username: user.username,
          wallet_balance: user.wallet_balance,
          camly_balance: user.camly_balance,
          pending_amount: user.pending_amount,
          claimed_amount: user.claimed_amount,
          total_earned: user.total_earned
        } : null}
        onSuccess={handleResetSuccess}
      />
    </>
  );
}
