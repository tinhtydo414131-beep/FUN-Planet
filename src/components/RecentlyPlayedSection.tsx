import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Clock, Play, ChevronRight, Gamepad2 } from "lucide-react";
import { useRecentlyPlayed } from "@/hooks/useRecentlyPlayed";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { vi, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  }
};

interface RecentGameCardProps {
  game: {
    id: string;
    gameId: string;
    title: string;
    thumbnailUrl: string | null;
    category: string;
    playedAt: string;
  };
  onClick: () => void;
}

function RecentGameCard({ game, onClick }: RecentGameCardProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'vi' ? vi : enUS;
  
  const timeAgo = formatDistanceToNow(new Date(game.playedAt), { 
    addSuffix: true, 
    locale 
  });

  const getCategoryEmoji = (category: string) => {
    const categoryLower = category?.toLowerCase() || '';
    if (categoryLower.includes('puzzle') || categoryLower.includes('brain')) return '🧩';
    if (categoryLower.includes('adventure')) return '🗺️';
    if (categoryLower.includes('creative') || categoryLower.includes('art')) return '🎨';
    if (categoryLower.includes('educational') || categoryLower.includes('learning')) return '📚';
    return '🎮';
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="
        flex-shrink-0 
        w-[120px] h-[150px] md:w-[140px] md:h-[170px]
        rounded-2xl
        bg-white/40 backdrop-blur-lg
        border border-white/50
        shadow-[0_8px_32px_rgba(243,196,251,0.15)]
        hover:shadow-[0_12px_40px_rgba(243,196,251,0.25)]
        transition-all duration-300
        cursor-pointer
        overflow-hidden
        group
        relative
      "
    >
      {/* Thumbnail */}
      <div className="relative w-full h-[80px] md:h-[95px] overflow-hidden bg-gradient-to-br from-pink-100 to-blue-100">
        {game.thumbnailUrl ? (
          <img 
            src={game.thumbnailUrl} 
            alt={game.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {getCategoryEmoji(game.category)}
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="
            w-10 h-10 
            rounded-full 
            bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400
            flex items-center justify-center
            shadow-[0_0_20px_rgba(243,196,251,0.5)]
            animate-pulse
          ">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-2 bg-white/60 h-[70px] md:h-[75px] flex flex-col justify-between">
        <p className="text-xs md:text-sm font-medium text-foreground line-clamp-2 leading-tight">
          {game.title}
        </p>
        <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span className="truncate">{timeAgo}</span>
        </div>
      </div>

      {/* Holographic border effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent, rgba(243,196,251,0.1), rgba(162,210,255,0.1), transparent)',
        }}
      />
    </motion.div>
  );
}

function RecentGameSkeleton() {
  return (
    <div className="flex-shrink-0 w-[120px] h-[150px] md:w-[140px] md:h-[170px] rounded-2xl overflow-hidden">
      <Skeleton className="w-full h-[80px] md:h-[95px] bg-gradient-to-br from-pink-100/50 to-blue-100/50" />
      <div className="p-2 space-y-2">
        <Skeleton className="h-4 w-full bg-pink-100/50" />
        <Skeleton className="h-3 w-2/3 bg-blue-100/50" />
      </div>
    </div>
  );
}

export function RecentlyPlayedSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { recentGames, loading, hasRecentGames } = useRecentlyPlayed();

  // Don't show section if no user or no games
  if (!user && !hasRecentGames) return null;
  if (!loading && !hasRecentGames) return null;

  return (
    <section className="py-6 md:py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              {t('home.recentlyPlayed', 'Chơi gần đây')}
            </h2>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/recently-played")}
            className="text-muted-foreground hover:text-primary gap-1 text-sm"
          >
            {t('common.viewAll', 'Xem tất cả')}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Games Grid/Scroll */}
        {loading ? (
          <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible">
            {[...Array(4)].map((_, i) => (
              <RecentGameSkeleton key={i} />
            ))}
          </div>
        ) : hasRecentGames ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex gap-3 md:gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-4 md:overflow-visible"
          >
            {recentGames.map((game) => (
              <RecentGameCard
                key={game.id}
                game={game}
                onClick={() => navigate(`/game/${game.gameId}`)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="
              text-center py-8 
              bg-white/30 backdrop-blur-sm 
              rounded-2xl border border-white/40
              shadow-[0_4px_20px_rgba(243,196,251,0.1)]
            "
          >
            <Gamepad2 className="w-12 h-12 mx-auto text-purple-300 mb-3" />
            <p className="text-muted-foreground mb-4">
              {t('home.noRecentGames', 'Chưa chơi game nào! 🎮')}
            </p>
            <Button
              onClick={() => navigate("/games")}
              className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 text-white hover:opacity-90"
            >
              {t('home.exploreNow', 'Khám phá ngay')}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
