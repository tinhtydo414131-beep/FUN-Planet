import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send, Copy, Check, AlertTriangle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { ethers } from "ethers";

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientId: string;
  recipientUsername: string;
  recipientAvatar?: string | null;
  recipientWalletAddress?: string | null;
}

// Token contracts on BSC
const TOKEN_CONTRACTS = {
  USDT: '0x55d398326f99059fF775485246999027B3197955',
  CAMLY: '0x82D49D4c302a7092A5572d477E2Fd4c069CF2e83',
};

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export function TransferModal({ 
  open, 
  onOpenChange, 
  recipientId, 
  recipientUsername,
  recipientAvatar,
  recipientWalletAddress 
}: TransferModalProps) {
  const [amount, setAmount] = useState("");
  const [tokenType, setTokenType] = useState("CAMLY");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const isOnChainToken = tokenType !== "CAMLY";
  const needsWallet = isOnChainToken && !recipientWalletAddress;

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Vui lòng đăng nhập để chuyển tiền");
        return;
      }

      if (tokenType === "CAMLY") {
        // Internal CAMLY transfer via RPC
        const { data: result, error } = await supabase.rpc('process_p2p_transfer', {
          p_sender_id: user.id,
          p_recipient_id: recipientId,
          p_amount: parseFloat(amount),
          p_token_type: 'CAMLY',
          p_notes: notes || null
        });

        if (error) throw error;

        const transferResult = result as { success: boolean; error?: string; recipient_username?: string };
        
        if (transferResult?.success) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          toast.success(`🎉 Đã gửi ${parseFloat(amount).toLocaleString()} CAMLY thành công!`);
          setAmount("");
          setNotes("");
          onOpenChange(false);
        } else {
          toast.error(transferResult?.error || "Transfer failed");
        }
      } else {
        // On-chain transfer (USDT/BNB)
        if (!recipientWalletAddress) {
          toast.error("Người nhận chưa kết nối ví BSC");
          return;
        }

        if (typeof window.ethereum === 'undefined') {
          toast.error("Vui lòng cài đặt MetaMask để gửi token on-chain");
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const senderAddress = await signer.getAddress();

        let txHash: string;

        if (tokenType === "BNB") {
          // Native BNB transfer
          const tx = await signer.sendTransaction({
            to: recipientWalletAddress,
            value: ethers.parseEther(amount)
          });
          await tx.wait();
          txHash = tx.hash;
        } else {
          // ERC20 token transfer (USDT)
          const contractAddress = TOKEN_CONTRACTS[tokenType as keyof typeof TOKEN_CONTRACTS];
          if (!contractAddress) {
            toast.error("Token không được hỗ trợ");
            return;
          }

          const contract = new ethers.Contract(contractAddress, ERC20_ABI, signer);
          const decimals = await contract.decimals();
          const tx = await contract.transfer(
            recipientWalletAddress,
            ethers.parseUnits(amount, decimals)
          );
          await tx.wait();
          txHash = tx.hash;
        }

        // Record on-chain transaction in database
        await supabase.from("wallet_transactions").insert({
          from_user_id: user.id,
          to_user_id: recipientId,
          amount: parseFloat(amount),
          token_type: tokenType,
          transaction_type: 'p2p_transfer',
          status: 'completed',
          transaction_hash: txHash,
          notes: notes || null
        });

        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        toast.success(`🎉 Đã gửi ${amount} ${tokenType} thành công!`);
        setAmount("");
        setNotes("");
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Transfer error:", error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error("Giao dịch đã bị hủy");
      } else {
        toast.error(error.message || "Failed to process transfer");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-primary" />
            Gửi Token
          </DialogTitle>
          <DialogDescription>
            Chuyển token đến {recipientUsername}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage src={recipientAvatar || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {recipientUsername.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{recipientUsername}</p>
              {recipientWalletAddress ? (
                <p className="text-xs text-muted-foreground font-mono">
                  {`${recipientWalletAddress.slice(0, 6)}...${recipientWalletAddress.slice(-4)}`}
                </p>
              ) : (
                <p className="text-xs text-amber-500 flex items-center gap-1">
                  <Wallet className="w-3 h-3" />
                  Chưa kết nối ví
                </p>
              )}
            </div>
          </div>

          {/* Token Type */}
          <div className="space-y-2">
            <Label htmlFor="token">Loại Token</Label>
            <Select value={tokenType} onValueChange={setTokenType} disabled={loading}>
              <SelectTrigger id="token">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CAMLY">🪙 CAMLY (Nội bộ)</SelectItem>
                <SelectItem value="USDT">💵 USDT (On-chain)</SelectItem>
                <SelectItem value="BNB">⚡ BNB (On-chain)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warning for on-chain without wallet */}
          {needsWallet && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Không thể gửi {tokenType}</p>
                <p className="text-xs mt-1">Người nhận chưa kết nối ví BSC. Bạn chỉ có thể gửi CAMLY (nội bộ).</p>
              </div>
            </div>
          )}

          {/* Info for on-chain tokens */}
          {isOnChainToken && !needsWallet && (
            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-600">
              <Wallet className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Giao dịch On-chain</p>
                <p className="text-xs mt-1">Bạn sẽ cần xác nhận giao dịch qua MetaMask và trả phí gas.</p>
              </div>
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Số lượng</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={loading || needsWallet}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (Tùy chọn)</Label>
            <Input
              id="notes"
              placeholder="Thêm tin nhắn..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading || needsWallet}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={loading || !amount || needsWallet}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gửi {amount && `${amount} ${tokenType}`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
