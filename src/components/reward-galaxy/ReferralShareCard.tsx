import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Check, 
  Share2, 
  Users, 
  Coins, 
  Heart,
  MessageCircle,
  Send,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralShareCardProps {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  referralEarnings: number;
  onCopyLink: () => void;
}

export const ReferralShareCard = ({
  referralCode,
  referralLink,
  totalReferrals,
  referralEarnings,
  onCopyLink,
}: ReferralShareCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopyLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToTelegram = () => {
    const text = `🎮 Chơi game cùng mình tại FUN Planet và nhận 50,000 Camly coin miễn phí!\n\n🎁 Dùng link mời của mình: ${referralLink}\n\n🚀 Nhanh lên nào!`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareToZalo = () => {
    window.open(`https://zalo.me/share?url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="mb-10"
    >
      <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20 backdrop-blur-xl border border-white/20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <Heart className="w-6 h-6 text-pink-400 fill-pink-400" />
          </motion.div>
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
            <Heart className="w-5 h-5 text-pink-300 fill-pink-300" />
          </motion.div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-fredoka font-bold text-white">Mời Bạn Bè - Nhận 25,000 Camly coin Mỗi Người!</h3>
            <p className="text-white/60 text-sm">Chia sẻ link mời và lan tỏa niềm vui cùng FUN Planet</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-white/10 text-center">
            <div className="flex items-center justify-center gap-2 text-blue-300 mb-1">
              <Users className="w-5 h-5" />
              <span className="text-sm">Bạn đã mời</span>
            </div>
            <p className="text-3xl font-bold text-white">{totalReferrals}</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 text-center">
            <div className="flex items-center justify-center gap-2 text-amber-300 mb-1">
              <Coins className="w-5 h-5" />
              <span className="text-sm">Đã kiếm được</span>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
              {referralEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Referral Code Display */}
        <div className="p-4 rounded-2xl bg-white/10 border border-white/20 mb-6">
          <p className="text-xs text-white/60 mb-2">Mã mời của con</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-mono font-bold tracking-widest text-purple-300">
              {referralCode || '--------'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-400" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/30 mb-6">
          <p className="text-xs text-white/60 mb-2">🔗 Link mời thần kỳ của con</p>
          <div className="flex items-center gap-2">
            <p className="flex-1 text-sm font-mono text-white/90 truncate">
              {referralLink || 'Đang tạo link...'}
            </p>
            <Button
              onClick={handleCopy}
              className="shrink-0 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Đã copy!' : 'Copy Link'}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <p className="text-sm text-white/70 text-center">Chia sẻ nhanh tới bạn bè</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              onClick={shareToTelegram}
              className="bg-[#0088cc] hover:bg-[#0077b5] text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Telegram
            </Button>
            <Button
              onClick={shareToZalo}
              className="bg-[#0068ff] hover:bg-[#0058dd] text-white"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Zalo
            </Button>
            <Button
              onClick={shareToFacebook}
              className="bg-[#1877f2] hover:bg-[#166fe5] text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Facebook
            </Button>
          </div>
        </div>

        {/* Flying hearts animation */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${20 + i * 15}%`,
              bottom: 0,
            }}
            animate={{
              y: [0, -100],
              x: [0, (Math.random() - 0.5) * 50],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.8,
            }}
          >
            <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
