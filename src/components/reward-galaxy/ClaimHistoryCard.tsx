import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Wallet, 
  Gamepad2, 
  Upload, 
  Users, 
  Gift,
  ExternalLink,
  Loader2,
  Star,
  Check,
  Clock,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Claim {
  id: string;
  claim_type: string;
  amount: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
  claimed_at: string | null;
}

interface ClaimHistoryCardProps {
  claims: Claim[];
  isLoading: boolean;
}

const getClaimIcon = (type: string) => {
  switch (type) {
    case 'first_wallet':
      return <Wallet className="w-6 h-6" />;
    case 'game_completion':
      return <Gamepad2 className="w-6 h-6" />;
    case 'game_upload':
      return <Upload className="w-6 h-6" />;
    case 'referral':
      return <Users className="w-6 h-6" />;
    default:
      return <Gift className="w-6 h-6" />;
  }
};

const getClaimLabel = (type: string) => {
  switch (type) {
    case 'first_wallet':
      return 'Welcome Bonus';
    case 'game_completion':
      return 'Game Play';
    case 'game_upload':
      return 'Upload Reward';
    case 'referral':
      return 'Referral';
    default:
      return 'Reward';
  }
};

const getClaimEmoji = (type: string) => {
  switch (type) {
    case 'first_wallet':
      return '🎉';
    case 'game_completion':
      return '🎮';
    case 'game_upload':
      return '🚀';
    case 'referral':
      return '💝';
    default:
      return '🎁';
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge 
          className="font-bold text-sm px-3 py-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white border-0 shadow-md"
        >
          <Check className="w-4 h-4 mr-1" />
          Hoàn thành
        </Badge>
      );
    case 'pending':
      return (
        <Badge 
          className="font-bold text-sm px-3 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-0 shadow-md"
        >
          <Clock className="w-4 h-4 mr-1" />
          Đang xử lý
        </Badge>
      );
    case 'pending_approval':
      return (
        <Badge 
          className="font-bold text-sm px-3 py-1 bg-gradient-to-r from-orange-400 to-amber-500 text-white border-0 shadow-md"
        >
          <Clock className="w-4 h-4 mr-1" />
          Chờ phụ huynh
        </Badge>
      );
    case 'failed':
      return (
        <Badge 
          className="font-bold text-sm px-3 py-1 bg-gradient-to-r from-red-400 to-rose-500 text-white border-0 shadow-md"
        >
          Thất bại
        </Badge>
      );
    default:
      return null;
  }
};

export const ClaimHistoryCard = ({ claims, isLoading }: ClaimHistoryCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="relative">
        {/* Outer glow - light theme */}
        <motion.div 
          className="absolute -inset-2 rounded-[36px] bg-gradient-to-r from-yellow-300/30 via-pink-300/20 to-blue-300/30 blur-2xl"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Gradient border - light theme */}
        <div className="absolute -inset-[3px] rounded-[34px] bg-gradient-to-br from-yellow-400 via-pink-400 to-blue-400 opacity-70" />
        
        <div 
          className="relative p-8 md:p-10 rounded-[32px] bg-white backdrop-blur-xl border-0 overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(168, 85, 247, 0.12), 0 4px 16px rgba(236, 72, 153, 0.08)'
          }}
        >
          {/* Sparkle decorations */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute pointer-events-none"
              style={{
                left: `${8 + i * 16}%`,
                top: `${15 + (i % 3) * 25}%`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            >
              {i % 2 === 0 ? (
                <Star className="w-4 h-4 text-yellow-400/50 fill-yellow-400/50" />
              ) : (
                <Sparkles className="w-3 h-3 text-pink-400/50" />
              )}
            </motion.div>
          ))}
          
          {/* Header - light theme */}
          <div className="flex items-center gap-4 mb-8">
            <motion.div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #F59E0B)',
                boxShadow: '0 8px 30px rgba(245, 158, 11, 0.4), inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.1)',
              }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 via-transparent to-transparent" />
              <History className="w-8 h-8 text-white relative z-10" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
            </motion.div>
            <div>
              <h3 
                className="text-2xl md:text-3xl font-fredoka font-bold tracking-wide bg-gradient-to-r from-yellow-500 via-pink-500 to-blue-500 bg-clip-text text-transparent"
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                }}
              >
                Lịch Sử Quà Tặng Từ Vũ Trụ
              </h3>
              <p className="text-blue-700/70 text-base md:text-lg font-fredoka font-medium mt-1 leading-relaxed">
                Các phần thưởng con đã nhận được
              </p>
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>
          ) : claims.length === 0 ? (
            <div className="text-center py-16">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Star className="w-20 h-20 text-yellow-400/40 mx-auto mb-5" style={{ filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.3))' }} />
              </motion.div>
              <p className="text-blue-700/70 text-xl md:text-2xl font-fredoka font-semibold">
                Chưa có phần thưởng nào
              </p>
              <p className="text-blue-600/50 text-base md:text-lg font-fredoka mt-2 leading-relaxed">
                Hãy kết nối ví và bắt đầu chơi game!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim, index) => (
                <motion.div
                  key={claim.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-5 rounded-2xl transition-all relative overflow-hidden border border-purple-200/50"
                  style={{
                    background: 'linear-gradient(135deg, rgba(243, 232, 255, 0.7) 0%, rgba(252, 231, 243, 0.5) 100%)',
                  }}
                  whileHover={{ 
                    scale: 1.01,
                    boxShadow: '0 8px 24px rgba(168, 85, 247, 0.15)'
                  }}
                >
                  <div className="flex items-center gap-5">
                    {/* Icon - BIGGER */}
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center relative"
                      style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.2))',
                        boxShadow: '0 4px 15px rgba(168, 85, 247, 0.15)',
                        border: '1px solid rgba(168, 85, 247, 0.3)',
                      }}
                    >
                      <span className="text-3xl">{getClaimEmoji(claim.claim_type)}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-fredoka font-bold text-lg md:text-xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent tracking-wide">
                          {getClaimLabel(claim.claim_type)}
                        </span>
                        {getStatusBadge(claim.status)}
                      </div>
                      <p className="text-sm md:text-base text-blue-600/60 mt-1 font-fredoka font-medium">
                        {format(new Date(claim.created_at), 'dd MMM yyyy, HH:mm', { locale: vi })}
                      </p>
                    </div>

                    {/* Amount - BIGGER */}
                    <div className="text-right">
                      <p 
                        className="text-2xl md:text-3xl font-fredoka font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #FFD700, #FFA500, #FFD700)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                        }}
                      >
                        +{claim.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-600/60 font-medium">CAMLY</p>
                    </div>
                  </div>

                  {/* TX Hash */}
                  {claim.tx_hash && (
                    <a
                      href={`https://bscscan.com/tx/${claim.tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-pink-500 hover:text-pink-600 mt-3 pl-[4.75rem] font-medium transition-colors"
                    >
                      <span className="font-mono truncate">{claim.tx_hash.slice(0, 24)}...</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
