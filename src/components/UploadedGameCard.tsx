import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Star, Download, User, Gem } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import GameDeleteModal from "@/components/GameDeleteModal";
import { useGameTrash } from "@/hooks/useGameTrash";
import { GamePreviewPlaceholder } from "@/components/GamePreviewPlaceholder";
import { GAME_CATEGORY_MULTIPLIERS, GameCategory } from "@/config/playtimeRewards";

// Category badge config with multiplier display
const getCategoryBadge = (category: string) => {
  const multiplier = GAME_CATEGORY_MULTIPLIERS[category as GameCategory] || GAME_CATEGORY_MULTIPLIERS.default;
  const configs: Record<string, { emoji: string; label: string; color: string }> = {
    educational: { emoji: "📚", label: "Học Vui", color: "bg-emerald-500/20 text-emerald-700 border-emerald-500/50" },
    brain: { emoji: "🧠", label: "Thông Minh", color: "bg-purple-500/20 text-purple-700 border-purple-500/50" },
    puzzle: { emoji: "🧩", label: "Puzzle", color: "bg-blue-500/20 text-blue-700 border-blue-500/50" },
    kindness: { emoji: "💖", label: "Yêu Thương", color: "bg-pink-500/20 text-pink-700 border-pink-500/50" },
    creative: { emoji: "🎨", label: "Sáng Tạo", color: "bg-orange-500/20 text-orange-700 border-orange-500/50" },
    creativity: { emoji: "🎨", label: "Sáng Tạo", color: "bg-orange-500/20 text-orange-700 border-orange-500/50" },
    casual: { emoji: "🎮", label: "Giải Trí", color: "bg-gray-500/20 text-gray-700 border-gray-500/50" },
    adventure: { emoji: "🗺️", label: "Phiêu Lưu", color: "bg-amber-500/20 text-amber-700 border-amber-500/50" },
  };
  const config = configs[category] || configs.casual;
  return { ...config, multiplier };
};

interface UploadedGame {
  id: string;
  title: string;
  description: string | null;
  category: string;
  thumbnail_path: string | null;
  play_count: number;
  download_count: number;
  rating: number | null;
  user_id: string;
  status: string;
}

interface GameAuthor {
  username: string;
  avatar_url: string | null;
  wallet_address: string | null;
}

interface UploadedGameCardProps {
  game: UploadedGame;
  onDeleted?: () => void;
}

export const UploadedGameCard = ({ game, onDeleted }: UploadedGameCardProps) => {
  const { user } = useAuth();
  const [author, setAuthor] = useState<GameAuthor | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { moveToTrash, isDeleting } = useGameTrash();

  const isOwner = user?.id === game.user_id;

  useEffect(() => {
    fetchAuthor();
  }, [game.user_id]);

  const fetchAuthor = async () => {
    if (!game.user_id) return;

    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, wallet_address')
      .eq('id', game.user_id)
      .maybeSingle();

    if (data) {
      setAuthor(data);
    }
  };

  const getThumbnailUrl = (path: string) => {
    const { data } = supabase.storage
      .from('uploaded-games')
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getAuthorDisplay = () => {
    if (!author) return 'Loading...';
    if (author.username) return author.username;
    if (author.wallet_address) return shortenAddress(author.wallet_address);
    return 'Anonymous';
  };

  const handleDeleteConfirm = async (reason: string, detail: string) => {
    if (!user) return;
    
    const success = await moveToTrash(game.id, reason, detail, user.id);
    if (success) {
      setShowDeleteModal(false);
      onDeleted?.();
    }
  };

  return (
    <>
      <Card className="group overflow-hidden border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-xl rounded-2xl relative">
        {/* Delete Button for Owner */}
        {isOwner && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="absolute top-3 left-3 z-10 p-2 rounded-full bg-amber-500/90 hover:bg-amber-600 text-white shadow-lg transition-all hover:scale-110"
            title="Đưa vào thùng rác"
          >
            <Gem className="w-4 h-4" />
          </button>
        )}

        <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
          {game.thumbnail_path ? (
            <img
              src={getThumbnailUrl(game.thumbnail_path)}
              alt={game.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <GamePreviewPlaceholder title={game.title} category={game.category} />
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant={game.status === 'approved' ? 'default' : 'secondary'}
              className={game.status === 'approved' ? 'bg-green-500' : ''}
            >
              {game.status === 'approved' ? '✅ Live' : '⏳ Pending'}
            </Badge>
          </div>

          {/* Stats */}
          <div className="absolute bottom-3 left-3 flex gap-2">
            <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Play className="w-3 h-3" />
              {game.play_count}
            </div>
            <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Download className="w-3 h-3" />
              {game.download_count}
            </div>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {game.title}
          </h3>
          
          {/* Author Info - Key Feature */}
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Tạo bởi:</span>
            <span className="font-semibold text-primary truncate">
              {getAuthorDisplay()}
            </span>
          </div>

          {game.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {game.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {(() => {
              const badge = getCategoryBadge(game.category);
              return (
                <Badge variant="outline" className={`text-xs border ${badge.color}`}>
                  {badge.emoji} {badge.label}
                  {badge.multiplier > 1 && (
                    <span className="ml-1 font-bold text-green-600">×{badge.multiplier}</span>
                  )}
                </Badge>
              );
            })()}
            {game.rating && game.rating > 0 && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{game.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <Link to={`/game-details/${game.id}`} className="block">
            <Button className="w-full bg-gradient-to-r from-primary to-secondary">
              <Play className="w-4 h-4 mr-2" />
              Play Now
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <GameDeleteModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
        gameTitle={game.title}
      />
    </>
  );
};