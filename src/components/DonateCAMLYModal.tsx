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
        <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-slate-600/50 text-white max-w-md p-0">
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                <span className="text-pink-400">💎</span>
                Ủng hộ FUN Planet
                <span className="text-pink-400">💎</span>
              </DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <p className="text-white/70">Vui lòng đăng nhập để ủng hộ!</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 border border-slate-600/50 text-white max-w-md overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="py-8 px-6 text-center relative"
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
              className="p-6"
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

                <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-slate-600/50">
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
                    className="flex-1 border-slate-500/50 text-white hover:bg-slate-700/50 bg-slate-800/50"
                    disabled={loading}
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleDonate}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 hover:from-pink-600 hover:via-rose-500 hover:to-pink-600"
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
              className="p-6"
            >
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-8" /> {/* Spacer */}
                <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
                  <span className="text-pink-400">💎</span>
                  <span className="text-white font-bold">Ủng hộ FUN Planet</span>
                  <span className="text-pink-400">💎</span>
                </DialogTitle>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                >
                  <X className="h-4 w-4 text-white/70" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Balance display - improved card */}
                <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-600/50">
                  <span className="text-white/80 font-medium">Số dư hiện tại:</span>
                  <div className="flex items-center gap-1.5 bg-slate-700/80 px-3 py-1.5 rounded-lg">
                    <span className="text-pink-400">💎</span>
                    <span className="font-bold text-white">
                      {balance.toLocaleString()}
                    </span>
                    <span className="text-white/80 text-sm">CAMLY</span>
                  </div>
                </div>

                {/* Amount input - with CAMLY icon */}
                <div>
                  <label className="text-sm text-white/80 mb-2 flex items-center gap-1.5">
                    <span className="text-pink-400">💎</span>
                    Số CAMLY muốn ủng hộ
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Nhập số lượng..."
                      className="bg-slate-800/80 border-slate-600/50 text-white placeholder:text-white/40 pr-24 h-12 rounded-xl focus:border-pink-500/50 focus:ring-pink-500/20"
                      min={MIN_AMOUNT}
                      max={balance}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-white/70">
                      <span className="text-pink-400 text-sm">💎</span>
                      <span className="text-sm font-medium">CAMLY</span>
                    </div>
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

                {/* Quick amounts - simplified buttons */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      onClick={() => handleQuickAmount(value)}
                      disabled={value > balance}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        value <= balance
                          ? numericAmount === value
                            ? "bg-pink-500/30 border-pink-500/50 text-pink-300"
                            : "bg-slate-700/60 hover:bg-slate-600/80 border-slate-500/30 text-white/90"
                          : "bg-slate-800/30 border-slate-600/20 text-white/30 cursor-not-allowed"
                      }`}
                    >
                      {value >= 1000000 
                        ? `${value / 1000000}M` 
                        : `${value / 1000}K`}
                    </button>
                  ))}
                </div>

                {/* Message - improved textarea */}
                <div>
                  <label className="text-sm text-white/80 mb-2 flex items-center gap-1.5">
                    <span>✉️</span>
                    Lời nhắn (tùy chọn)
                  </label>
                  <div className="relative">
                    <Textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value.slice(0, 200))}
                      placeholder="Gửi lời nhắn đến FUN Planet..."
                      className="bg-slate-800/80 border-slate-600/50 text-white placeholder:text-white/40 resize-none rounded-xl focus:border-pink-500/50 focus:ring-pink-500/20 pb-6"
                      rows={3}
                    />
                    <p className="absolute bottom-2 right-3 text-xs text-white/40">
                      {message.length}/200
                    </p>
                  </div>
                </div>

                {/* Anonymous option - radio style */}
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    isAnonymous 
                      ? "border-pink-500 bg-pink-500" 
                      : "border-slate-500 bg-transparent group-hover:border-slate-400"
                  }`}>
                    {isAnonymous && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-sm text-white/80">
                    Ủng hộ ẩn danh
                  </span>
                </div>

                {/* Donate button - gradient with glow */}
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!isValidAmount}
                  className="w-full bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 hover:from-pink-600 hover:via-rose-500 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed py-4 text-lg font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all hover:shadow-pink-500/40"
                >
                  <span className="mr-2">💎</span>
                  Ủng hộ ngay
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
