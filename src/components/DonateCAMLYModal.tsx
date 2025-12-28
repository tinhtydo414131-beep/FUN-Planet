import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Textarea } from "./ui/textarea";
import { Gem, Heart, AlertTriangle, Sparkles, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { fireDiamondConfetti } from "./DiamondConfetti";

interface DonateCAMLYModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];
const MIN_AMOUNT = 1000;

export const DonateCAMLYModal = ({ open, onOpenChange, onSuccess }: DonateCAMLYModalProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [donatedAmount, setDonatedAmount] = useState(0);

  useEffect(() => {
    if (open && user) {
      fetchBalance();
    }
  }, [open, user]);

  const fetchBalance = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();
    
    if (data) {
      setBalance(data.wallet_balance || 0);
    }
  };

  const numericAmount = parseInt(amount) || 0;
  const isValidAmount = numericAmount >= MIN_AMOUNT && numericAmount <= balance;

  const handleQuickAmount = (value: number) => {
    if (value <= balance) {
      setAmount(value.toString());
    }
  };

  const handleDonate = async () => {
    if (!user || !isValidAmount) return;
    
    setLoading(true);
    try {
      // 1. Deduct from wallet
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ wallet_balance: balance - numericAmount })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // 2. Log transaction
      const { error: txError } = await supabase
        .from("camly_coin_transactions")
        .insert({
          user_id: user.id,
          amount: -numericAmount,
          transaction_type: "platform_donation",
          description: `Ủng hộ FUN Planet${message ? `: ${message}` : ""}`,
        });

      if (txError) throw txError;

      // 3. Insert donation record
      const { error: donationError } = await supabase
        .from("platform_donations")
        .insert({
          user_id: user.id,
          amount: numericAmount,
          message: message || null,
          is_anonymous: isAnonymous,
        });

      if (donationError) throw donationError;

      // Success!
      setDonatedAmount(numericAmount);
      setShowConfirm(false);
      setShowSuccess(true);
      
      // Fire confetti
      fireDiamondConfetti("rainbow");
      
      // Play success sound
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 528;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        // Audio not supported
      }

      toast.success(`Cảm ơn bạn đã ủng hộ ${numericAmount.toLocaleString()} CAMLY! 💜`);
      
      // Reset and close after delay
      setTimeout(() => {
        setShowSuccess(false);
        setAmount("");
        setMessage("");
        setIsAnonymous(false);
        onOpenChange(false);
        onSuccess?.();
      }, 3000);

    } catch (error: any) {
      console.error("Donation error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !showSuccess) {
      setShowConfirm(false);
      onOpenChange(false);
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 border-2 border-yellow-500/50 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              💎 Ủng hộ FUN Planet
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-white/70">Vui lòng đăng nhập để ủng hộ!</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 border-2 border-yellow-500/50 text-white max-w-md overflow-hidden">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="py-8 text-center relative"
            >
              {/* Flying diamonds */}
              {[...Array(12)].map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl pointer-events-none"
                  initial={{ 
                    x: "50%", 
                    y: "50%",
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}%`,
                    y: `${-50 - Math.random() * 100}%`,
                    opacity: 0,
                    scale: 0.5,
                    rotate: Math.random() * 360,
                  }}
                  transition={{ 
                    duration: 2,
                    delay: i * 0.1,
                    ease: "easeOut",
                  }}
                >
                  💎
                </motion.span>
              ))}
              
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="h-16 w-16 mx-auto text-yellow-400 mb-4" />
              </motion.div>
              
              <motion.h3
                className="text-2xl font-bold bg-gradient-to-r from-yellow-300 via-pink-400 to-cyan-300 bg-clip-text text-transparent"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                ✨ CẢM ƠN BẠN! ✨
              </motion.h3>
              
              <p className="text-lg text-white/90 mt-2">
                Bạn đã ủng hộ{" "}
                <span className="font-bold text-rose-400">
                  {donatedAmount.toLocaleString()} CAMLY
                </span>
              </p>
              <p className="text-white/70 mt-1">cho FUN Planet! 💜</p>
            </motion.div>
          ) : showConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <DialogHeader>
                <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  Xác nhận ủng hộ
                </DialogTitle>
              </DialogHeader>

              <div className="py-6 space-y-4">
                <div className="text-center">
                  <p className="text-white/70 mb-2">Bạn sắp ủng hộ:</p>
                  <div className="flex items-center justify-center gap-2">
                    <Gem className="h-8 w-8 text-rose-400" />
                    <span className="text-3xl font-bold text-white">
                      {numericAmount.toLocaleString()}
                    </span>
                    <span className="text-lg text-white/70">CAMLY</span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-sm text-white/70">Số dư sau khi ủng hộ:</p>
                  <p className="text-xl font-semibold text-white">
                    {(balance - numericAmount).toLocaleString()} CAMLY
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-200">
                    Khoản ủng hộ không thể hoàn lại!
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 border-white/30 text-white hover:bg-white/10"
                    disabled={loading}
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleDonate}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  >
                    {loading ? (
                      <span className="animate-pulse">Đang xử lý...</span>
                    ) : (
                      <>✅ Xác nhận</>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <DialogHeader>
                <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                  <Gem className="h-6 w-6 text-rose-400" />
                  Ủng hộ FUN Planet
                  <Gem className="h-6 w-6 text-rose-400" />
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Balance display */}
                <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl">
                  <span className="text-white/70">Số dư hiện tại:</span>
                  <div className="flex items-center gap-1">
                    <Gem className="h-4 w-4 text-rose-400" />
                    <span className="font-bold text-white">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-sm text-white/70">CAMLY</span>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-sm text-white/70 mb-1 block">
                    💎 Số CAMLY muốn ủng hộ
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nhập số lượng..."
                      className="bg-white/10 border-white/30 text-white placeholder:text-white/40 pr-16"
                      min={MIN_AMOUNT}
                      max={balance}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/50">
                      CAMLY
                    </span>
                  </div>
                  {amount && numericAmount < MIN_AMOUNT && (
                    <p className="text-xs text-rose-400 mt-1">
                      Tối thiểu {MIN_AMOUNT.toLocaleString()} CAMLY
                    </p>
                  )}
                  {amount && numericAmount > balance && (
                    <p className="text-xs text-rose-400 mt-1">
                      Không đủ số dư
                    </p>
                  )}
                </div>

                {/* Quick amounts */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleQuickAmount(value)}
                      disabled={value > balance}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        value <= balance
                          ? "bg-white/10 hover:bg-white/20 text-white"
                          : "bg-white/5 text-white/30 cursor-not-allowed"
                      } ${numericAmount === value ? "ring-2 ring-rose-400" : ""}`}
                    >
                      {value >= 1000000 
                        ? `${value / 1000000}M` 
                        : `${value / 1000}K`}
                    </button>
                  ))}
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm text-white/70 mb-1 block">
                    ✉️ Lời nhắn (tùy chọn)
                  </label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                    placeholder="Gửi lời nhắn đến FUN Planet..."
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/40 resize-none"
                    rows={2}
                  />
                  <p className="text-xs text-white/40 text-right mt-1">
                    {message.length}/200
                  </p>
                </div>

                {/* Anonymous checkbox */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(!!checked)}
                    className="border-white/30 data-[state=checked]:bg-rose-500"
                  />
                  <label
                    htmlFor="anonymous"
                    className="text-sm text-white/70 cursor-pointer"
                  >
                    Ủng hộ ẩn danh
                  </label>
                </div>

                {/* Donate button */}
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!isValidAmount}
                  className="w-full bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 hover:from-rose-600 hover:via-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg font-bold"
                >
                  <Heart className="mr-2 h-5 w-5" />
                  💎 Ủng hộ ngay
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
