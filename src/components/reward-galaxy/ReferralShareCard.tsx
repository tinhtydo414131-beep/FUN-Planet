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
  ExternalLink,
  Sparkles,
  Star
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
      className="mb-12"
    >
      <div className="relative">
        {/* Outer glow */}
        <motion.div 
          className="absolute -inset-2 rounded-[36px] bg-gradient-to-r from-pink-500/40 via-purple-500/30 to-pink-500/40 blur-2xl"
          animate={{ opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Gradient border */}
        <div className="absolute -inset-[3px] rounded-[34px] bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 opacity-80" />
        
        <div className="relative p-8 md:p-10 rounded-[32px] bg-gradient-to-br from-pink-500/25 via-purple-500/25 to-blue-500/25 backdrop-blur-xl border-0 overflow-hidden">
          {/* Decorative elements - BIGGER */}
          <div className="absolute top-5 right-5 flex gap-3">
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Heart className="w-8 h-8 text-pink-400 fill-pink-400" style={{ filter: 'drop-shadow(0 0 12px #FF69B4)' }} />
            </motion.div>
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
              <Heart className="w-6 h-6 text-pink-300 fill-pink-300" style={{ filter: 'drop-shadow(0 0 8px #FF69B4)' }} />
            </motion.div>
          </div>
          
          {/* Sparkle decorations */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            >
              {i % 2 === 0 ? (
                <Sparkles className="w-4 h-4 text-yellow-400" style={{ filter: 'drop-shadow(0 0 6px #FFD700)' }} />
              ) : (
                <Star className="w-3 h-3 text-pink-300 fill-pink-300" />
              )}
            </motion.div>
          ))}

          <div className="flex items-center gap-4 mb-8">
            {/* Icon - BIGGER with 3D effect */}
            <motion.div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #FF69B4, #A855F7)',
                boxShadow: '0 8px 30px rgba(255, 105, 180, 0.5), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2)',
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              <Users className="w-8 h-8 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
            </motion.div>
            <div>
              {/* Title - gradient, BIGGER */}
              <h3 
                className="text-2xl md:text-3xl font-fredoka font-bold tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF, #FF69B4, #FFFFFF)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              >
                Mời Bạn Bè - Nhận 25,000 CAMLY Mỗi Người!
              </h3>
              <p className="text-white/70 text-base md:text-lg font-fredoka font-medium mt-1 leading-relaxed">Chia sẻ link mời và lan tỏa niềm vui cùng FUN Planet</p>
            </div>
          </div>

          {/* Stats - BIGGER */}
          <div className="grid grid-cols-2 gap-5 mb-8">
            <motion.div 
              className="p-5 rounded-2xl text-center relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(96, 165, 250, 0.3)',
                boxShadow: '0 4px 20px rgba(96, 165, 250, 0.15)',
              }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex items-center justify-center gap-2 text-blue-300 mb-2">
                <Users className="w-6 h-6" />
                <span className="text-base md:text-lg font-fredoka font-semibold">Bạn đã mời</span>
              </div>
              <p 
                className="text-4xl font-fredoka font-bold text-white"
                style={{ textShadow: '0 0 20px rgba(96, 165, 250, 0.5)' }}
              >
                {totalReferrals}
              </p>
            </motion.div>
            <motion.div 
              className="p-5 rounded-2xl text-center relative overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '2px solid rgba(251, 191, 36, 0.3)',
                boxShadow: '0 4px 20px rgba(251, 191, 36, 0.15)',
              }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex items-center justify-center gap-2 text-amber-300 mb-2">
                <Coins className="w-6 h-6" />
                <span className="text-base md:text-lg font-fredoka font-semibold">Đã kiếm được</span>
              </div>
              <p 
                className="text-4xl font-fredoka font-bold"
                style={{
                  background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 15px rgba(255,215,0,0.5))',
                }}
              >
                {referralEarnings.toLocaleString()}
              </p>
            </motion.div>
          </div>

          {/* Referral Code Display - enhanced */}
          <div 
            className="p-5 rounded-2xl mb-6 relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            <p className="text-sm text-white/60 mb-2 font-medium">Mã mời của con</p>
            <div className="flex items-center justify-between">
              <span 
                className="text-3xl font-mono font-bold tracking-widest"
                style={{
                  background: 'linear-gradient(135deg, #A855F7, #EC4899, #A855F7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 0 10px rgba(168, 85, 247, 0.5))',
                }}
              >
                {referralCode || '--------'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-white/80 hover:text-white hover:bg-white/15"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-400" />
                ) : (
                  <Copy className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Referral Link - enhanced */}
          <div 
            className="p-5 rounded-2xl mb-8"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25), rgba(236, 72, 153, 0.25))',
              border: '2px solid rgba(168, 85, 247, 0.4)',
              boxShadow: '0 4px 20px rgba(168, 85, 247, 0.2)',
            }}
          >
            <p className="text-sm text-white/60 mb-2 font-medium">🔗 Link mời thần kỳ của con</p>
            <div className="flex items-center gap-3">
              <p className="flex-1 text-base font-mono text-white/90 truncate">
                {referralLink || 'Đang tạo link...'}
              </p>
              <Button
                onClick={handleCopy}
                className="shrink-0 font-bold text-lg px-6 py-3 h-auto"
                style={{
                  background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                  boxShadow: '0 6px 25px rgba(168, 85, 247, 0.4)',
                }}
              >
                {copied ? <Check className="w-5 h-5 mr-2" /> : <Copy className="w-5 h-5 mr-2" />}
                {copied ? 'Đã copy!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          {/* Share Buttons - BIGGER */}
          <div className="space-y-4">
            <p className="text-base text-white/70 text-center font-medium">Chia sẻ nhanh tới bạn bè</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={shareToTelegram}
                className="font-bold text-lg px-6 py-3 h-auto"
                style={{
                  background: 'linear-gradient(135deg, #0088cc, #0077b5)',
                  boxShadow: '0 6px 25px rgba(0, 136, 204, 0.4)',
                }}
              >
                <Send className="w-5 h-5 mr-2" />
                Telegram
              </Button>
              <Button
                onClick={shareToZalo}
                className="font-bold text-lg px-6 py-3 h-auto"
                style={{
                  background: 'linear-gradient(135deg, #0068ff, #0058dd)',
                  boxShadow: '0 6px 25px rgba(0, 104, 255, 0.4)',
                }}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Zalo
              </Button>
              <Button
                onClick={shareToFacebook}
                className="font-bold text-lg px-6 py-3 h-auto"
                style={{
                  background: 'linear-gradient(135deg, #1877f2, #166fe5)',
                  boxShadow: '0 6px 25px rgba(24, 119, 242, 0.4)',
                }}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Facebook
              </Button>
            </div>
          </div>

          {/* Flying hearts animation */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${15 + i * 13}%`,
                bottom: 0,
              }}
              animate={{
                y: [0, -120],
                x: [0, (Math.random() - 0.5) * 60],
                opacity: [0, 1, 0],
                scale: [0.5, 1.2, 0.5],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                delay: i * 0.7,
              }}
            >
              <Heart className="w-5 h-5 text-pink-400 fill-pink-400" style={{ filter: 'drop-shadow(0 0 8px #FF69B4)' }} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
