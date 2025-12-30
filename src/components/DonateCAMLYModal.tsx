import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Gem, Heart, AlertTriangle, Sparkles, X, Wallet, Link2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { fireDiamondConfetti } from "./DiamondConfetti";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { ethers } from "ethers";
import { CAMLY_CONTRACT_ADDRESS, DONATION_WALLET_ADDRESS, CAMLY_ABI } from "@/lib/web3";

interface DonateCAMLYModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const QUICK_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];
const MIN_AMOUNT = 1000;
const CAMLY_DECIMALS = 3;

type DonationType = "internal" | "onchain";

export const DonateCAMLYModal = ({ open, onOpenChange, onSuccess }: DonateCAMLYModalProps) => {
  const { user } = useAuth();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [balance, setBalance] = useState(0);
  const [onchainBalance, setOnchainBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [donatedAmount, setDonatedAmount] = useState(0);
  const [donationType, setDonationType] = useState<DonationType>("internal");
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      fetchBalance();
      if (isConnected && address) {
        fetchOnchainBalance();
      }
    }
  }, [open, user, isConnected, address]);

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

  const fetchOnchainBalance = async () => {
    if (!window.ethereum || !address) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, CAMLY_ABI, provider);
      const balanceWei = await contract.balanceOf(address);
      const balanceFormatted = parseFloat(ethers.formatUnits(balanceWei, CAMLY_DECIMALS));
      setOnchainBalance(Math.floor(balanceFormatted));
    } catch (error) {
      console.error("Error fetching on-chain balance:", error);
    }
  };

  const numericAmount = parseInt(amount) || 0;
  const currentBalance = donationType === "internal" ? balance : onchainBalance;
  const isValidAmount = numericAmount >= MIN_AMOUNT && numericAmount <= currentBalance;

  const handleQuickAmount = (value: number) => {
    if (value <= currentBalance) {
      setAmount(value.toString());
    }
  };

  const handleOnchainDonate = async () => {
    if (!address || !window.ethereum) {
      toast.error("Vui lòng kết nối ví trước!");
      return;
    }

    // Check if on BSC mainnet (56)
    if (chainId !== 56) {
      toast.info("Đang chuyển sang BSC Mainnet...");
      try {
        await switchChain({ chainId: 56 });
      } catch (error) {
        toast.error("Không thể chuyển mạng. Vui lòng chuyển thủ công sang BSC.");
        return;
      }
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CAMLY_CONTRACT_ADDRESS, CAMLY_ABI, signer);

      const amountWei = ethers.parseUnits(numericAmount.toString(), CAMLY_DECIMALS);

      toast.info("Vui lòng xác nhận giao dịch trong ví... 🦊");

      const tx = await contract.transfer(DONATION_WALLET_ADDRESS, amountWei);
      toast.success("Giao dịch đã gửi! Đang chờ xác nhận... ⏳");

      const receipt = await tx.wait();
      const finalTxHash = receipt.hash || tx.hash;
      setTxHash(finalTxHash);

      // Log on-chain donation to database
      const { error: donationError } = await supabase
        .from("platform_donations")
        .insert({
          user_id: user?.id,
          amount: numericAmount,
          message: message || null,
          is_anonymous: isAnonymous,
          is_onchain: true,
          tx_hash: finalTxHash,
          wallet_address: address,
          donation_type: "onchain",
        });

      if (donationError) console.error("Error logging donation:", donationError);

      // Log transaction
      if (user) {
        await supabase.from("camly_coin_transactions").insert({
          user_id: user.id,
          amount: -numericAmount,
          transaction_type: "onchain_donation",
          description: `On-chain donation to FUN Planet - TX: ${finalTxHash.slice(0, 10)}...`,
        });
      }

      // Success!
      setDonatedAmount(numericAmount);
      setShowConfirm(false);
      setShowSuccess(true);
      fireDiamondConfetti("rainbow");
      playSuccessSound();

      toast.success(`🎉 Ủng hộ on-chain ${numericAmount.toLocaleString()} CAMLY thành công!`);

      setTimeout(() => {
        resetAndClose();
      }, 5000);

    } catch (error: any) {
      console.error("On-chain donation error:", error);
      if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        toast.error("Giao dịch đã bị hủy");
      } else {
        toast.error("Lỗi giao dịch: " + (error.message || "Vui lòng thử lại!"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInternalDonate = async () => {
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
          is_onchain: false,
          donation_type: "internal",
        });

      if (donationError) throw donationError;

      // Success!
      setDonatedAmount(numericAmount);
      setShowConfirm(false);
      setShowSuccess(true);
      fireDiamondConfetti("rainbow");
      playSuccessSound();

      toast.success(`Cảm ơn bạn đã ủng hộ ${numericAmount.toLocaleString()} CAMLY! 💜`);
      
      setTimeout(() => {
        resetAndClose();
      }, 3000);

    } catch (error: any) {
      console.error("Donation error:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async () => {
    if (donationType === "onchain") {
      await handleOnchainDonate();
    } else {
      await handleInternalDonate();
    }
  };

  const playSuccessSound = () => {
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
  };

  const resetAndClose = () => {
    setShowSuccess(false);
    setAmount("");
    setMessage("");
    setIsAnonymous(false);
    setTxHash(null);
    setDonationType("internal");
    onOpenChange(false);
    onSuccess?.();
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
        <DialogContent className="bg-gradient-to-br from-pink-600 via-purple-700 to-orange-500 border border-white/20 text-white max-w-md p-0">
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
      <DialogContent className="bg-gradient-to-br from-pink-600 via-purple-700 to-orange-500 border border-white/20 text-white max-w-md overflow-hidden p-0">
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

              {txHash && (
                <a
                  href={`https://bscscan.com/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-slate-800/50 rounded-lg text-sm text-emerald-400 hover:bg-slate-700/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Xem giao dịch trên BSCScan
                </a>
              )}
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

                {/* Donation Type Indicator */}
                <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                  donationType === "onchain" 
                    ? "bg-emerald-500/20 border border-emerald-500/30" 
                    : "bg-blue-500/20 border border-blue-500/30"
                }`}>
                  {donationType === "onchain" ? (
                    <>
                      <Link2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm text-emerald-300">On-chain (Giao dịch thực)</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-blue-300">Internal (Số dư nội bộ)</span>
                    </>
                  )}
                </div>

                {donationType === "onchain" && (
                  <div className="bg-slate-800/80 rounded-xl p-3 text-center border border-slate-600/50">
                    <p className="text-xs text-white/50">Gửi đến ví:</p>
                    <p className="text-xs font-mono text-emerald-400 break-all">
                      {DONATION_WALLET_ADDRESS}
                    </p>
                  </div>
                )}

                <div className="bg-slate-800/80 rounded-xl p-4 text-center border border-slate-600/50">
                  <p className="text-sm text-white/70">Số dư sau khi ủng hộ:</p>
                  <p className="text-xl font-semibold text-white">
                    {(currentBalance - numericAmount).toLocaleString()} CAMLY
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <p className="text-sm text-yellow-200">
                    {donationType === "onchain" 
                      ? "Giao dịch on-chain không thể hoàn lại!"
                      : "Khoản ủng hộ không thể hoàn lại!"}
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
                <div className="w-8" />
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
                {/* Donation Type Toggle */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-xl">
                  <button
                    onClick={() => setDonationType("internal")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      donationType === "internal"
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg"
                        : "text-white/60 hover:text-white/80"
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    Internal
                  </button>
                  <button
                    onClick={() => setDonationType("onchain")}
                    disabled={!isConnected}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      donationType === "onchain"
                        ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg"
                        : isConnected
                          ? "text-white/60 hover:text-white/80"
                          : "text-white/30 cursor-not-allowed"
                    }`}
                  >
                    <Link2 className="h-4 w-4" />
                    On-chain
                  </button>
                </div>

                {!isConnected && donationType === "internal" && (
                  <p className="text-xs text-center text-white/50">
                    💡 Kết nối ví để mở khóa gửi on-chain token thực
                  </p>
                )}

                {/* Balance display */}
                <div className="flex items-center justify-between p-3 bg-slate-800/80 rounded-xl border border-slate-600/50">
                  <span className="text-white/80 font-medium flex items-center gap-2">
                    {donationType === "onchain" ? (
                      <>
                        <Link2 className="h-4 w-4 text-emerald-400" />
                        On-chain:
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 text-blue-400" />
                        Số dư nội bộ:
                      </>
                    )}
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-700/80 px-3 py-1.5 rounded-lg">
                    <span className="text-pink-400">💎</span>
                    <span className="font-bold text-white">
                      {currentBalance.toLocaleString()}
                    </span>
                    <span className="text-white/80 text-sm">CAMLY</span>
                  </div>
                </div>

                {/* Amount input */}
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
                      max={currentBalance}
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
                  {amount && numericAmount > currentBalance && (
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
                      disabled={value > currentBalance}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        value <= currentBalance
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

                {/* Message */}
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

                {/* Anonymous option */}
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

                {/* Donate button */}
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={!isValidAmount || (donationType === "onchain" && !isConnected)}
                  className={`w-full py-4 text-lg font-bold rounded-xl shadow-lg transition-all ${
                    donationType === "onchain"
                      ? "bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 hover:from-emerald-600 hover:via-cyan-500 hover:to-emerald-600 shadow-emerald-500/30 hover:shadow-emerald-500/40"
                      : "bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 hover:from-pink-600 hover:via-rose-500 hover:to-pink-600 shadow-pink-500/30 hover:shadow-pink-500/40"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Heart className="h-5 w-5 mr-2" />
                  {donationType === "onchain" ? "Gửi On-chain" : "Ủng hộ"}
                </Button>

                {donationType === "onchain" && (
                  <p className="text-xs text-center text-white/50">
                    🔗 Giao dịch thực trên BSC Mainnet đến ví{" "}
                    <span className="font-mono text-emerald-400/70">
                      {DONATION_WALLET_ADDRESS.slice(0, 6)}...{DONATION_WALLET_ADDRESS.slice(-4)}
                    </span>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
