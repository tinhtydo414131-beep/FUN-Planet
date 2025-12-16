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
  Clock
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
      return <Wallet className="w-5 h-5" />;
    case 'game_completion':
      return <Gamepad2 className="w-5 h-5" />;
    case 'game_upload':
      return <Upload className="w-5 h-5" />;
    case 'referral':
      return <Users className="w-5 h-5" />;
    default:
      return <Gift className="w-5 h-5" />;
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
        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
          <Check className="w-3 h-3 mr-1" />
          Hoàn thành
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Đang xử lý
        </Badge>
      );
    case 'pending_approval':
      return (
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          <Clock className="w-3 h-3 mr-1" />
          Chờ phụ huynh
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
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
      <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-fredoka font-bold text-white">Lịch Sử Quà Tặng Từ Vũ Trụ</h3>
            <p className="text-white/60 text-sm">Các phần thưởng con đã nhận được</p>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Star className="w-16 h-16 text-yellow-400/30 mx-auto mb-4" />
            </motion.div>
            <p className="text-white/50 text-lg">Chưa có phần thưởng nào</p>
            <p className="text-white/30 text-sm mt-1">Hãy kết nối ví và bắt đầu chơi game!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim, index) => (
              <motion.div
                key={claim.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-white/80">
                    <span className="text-2xl">{getClaimEmoji(claim.claim_type)}</span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">
                        {getClaimLabel(claim.claim_type)}
                      </span>
                      {getStatusBadge(claim.status)}
                    </div>
                    <p className="text-xs text-white/50 mt-1">
                      {format(new Date(claim.created_at), 'dd MMM yyyy, HH:mm', { locale: vi })}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                      +{claim.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-white/50">CAMLY</p>
                  </div>
                </div>

                {/* TX Hash */}
                {claim.tx_hash && (
                  <a
                    href={`https://bscscan.com/tx/${claim.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 mt-2 pl-16"
                  >
                    <span className="font-mono truncate">{claim.tx_hash.slice(0, 20)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Decorative stars */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute pointer-events-none"
            style={{
              left: `${10 + i * 20}%`,
              top: `${20 + (i % 3) * 30}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          >
            <Star className="w-3 h-3 text-yellow-400/30 fill-yellow-400/30" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
