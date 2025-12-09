import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { games, Game } from "@/data/games";
import { 
  Sparkles, Gamepad2, RefreshCw, Brain, Rocket, 
  Star, Zap, ChevronRight, Heart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface PlayHistory {
  game_id: string;
  play_count: number;
  last_played: string;
}

const GENRE_ICONS: Record<string, typeof Gamepad2> = {
  puzzle: Brain,
  brain: Brain,
  adventure: Rocket,
  casual: Star,
  educational: Zap
};

const GENRE_COLORS: Record<string, string> = {
  puzzle: "from-blue-500 to-cyan-500",
  brain: "from-purple-500 to-indigo-500",
  adventure: "from-orange-500 to-red-500",
  casual: "from-green-500 to-emerald-500",
  educational: "from-pink-500 to-rose-500"
};

// Simple recommendation algorithm
function getSuggestions(
  allGames: Game[], 
  playHistory: PlayHistory[], 
  userAge?: number
): Game[] {
  const playedGameIds = new Set(playHistory.map(p => p.game_id));
  
  // Count category preferences from play history
  const categoryScores: Record<string, number> = {};
  playHistory.forEach(play => {
    const game = allGames.find(g => g.id === play.game_id);
    if (game) {
      categoryScores[game.category] = (categoryScores[game.category] || 0) + play.play_count;
    }
  });
  
  // Filter out already played games
  let unplayedGames = allGames.filter(g => !playedGameIds.has(g.id) && g.playable);
  
  // Age-based filtering
  if (userAge && userAge < 8) {
    unplayedGames = unplayedGames.filter(g => g.difficulty === 'easy');
  }
  
  // Score each game
  const scoredGames = unplayedGames.map(game => {
    let score = 0;
    
    // Prefer categories the user has played before
    score += (categoryScores[game.category] || 0) * 2;
    
    // Slight preference for easy games
    if (game.difficulty === 'easy') score += 1;
    if (game.difficulty === 'medium') score += 0.5;
    
    // Add some randomness to keep suggestions fresh
    score += Math.random() * 2;
    
    return { game, score };
  });
  
  // Sort by score and take top 3
  scoredGames.sort((a, b) => b.score - a.score);
  
  // If no play history, return random selection
  if (playHistory.length === 0) {
    const shuffled = [...unplayedGames].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }
  
  return scoredGames.slice(0, 3).map(s => s.game);
}

interface SmartGameSuggestionsProps {
  variant?: "compact" | "full";
}

export function SmartGameSuggestions({ variant = "full" }: SmartGameSuggestionsProps) {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Fetch user's play history
  const { data: playHistory, isLoading } = useQuery({
    queryKey: ['play-history', user?.id, refreshKey],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('game_sessions')
        .select('game_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching play history:', error);
        return [];
      }
      
      // Count plays per game
      const counts: Record<string, PlayHistory> = {};
      data.forEach(session => {
        if (!counts[session.game_id]) {
          counts[session.game_id] = { 
            game_id: session.game_id, 
            play_count: 0, 
            last_played: '' 
          };
        }
        counts[session.game_id].play_count++;
      });
      
      return Object.values(counts);
    },
    enabled: !!user,
    staleTime: 60000,
  });
  
  // Calculate suggestions (without age-based filtering since no age column)
  const suggestions = useMemo(() => {
    return getSuggestions(games, playHistory || [], undefined);
  }, [playHistory, refreshKey]);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  if (!user) {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="p-6 text-center">
          <Heart className="w-10 h-10 mx-auto mb-3 text-primary/50" />
          <p className="text-muted-foreground">
            Đăng nhập để nhận gợi ý game phù hợp!
          </p>
          <Link to="/auth">
            <Button size="sm" className="mt-3">Đăng nhập</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  
  if (variant === "compact") {
    return (
      <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-card to-purple-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Gợi ý cho bạn
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (
            <AnimatePresence mode="popLayout">
              {suggestions.map((game, index) => {
                const Icon = GENRE_ICONS[game.category] || Gamepad2;
                const gradient = GENRE_COLORS[game.category] || "from-gray-500 to-gray-600";
                
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/games/${game.id}`}>
                      <div className="p-2 rounded-lg border border-muted/50 hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all flex items-center gap-2 group cursor-pointer">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{game.title}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="w-full mt-2 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Gợi ý khác
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-card via-purple-500/5 to-pink-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="font-fredoka flex items-center gap-2 text-xl">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Gợi ý game cho bạn
          <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
            Smart AI
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Dựa trên lịch sử chơi và sở thích của bạn
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-muted/30 rounded-lg text-center">
            <p className="text-lg font-bold text-primary">{playHistory?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Game đã chơi</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg text-center">
            <p className="text-lg font-bold text-purple-500">{suggestions.length}</p>
            <p className="text-xs text-muted-foreground">Gợi ý mới</p>
          </div>
          <div className="p-2 bg-muted/30 rounded-lg text-center">
            <p className="text-lg font-bold text-pink-500">{games.length}</p>
            <p className="text-xs text-muted-foreground">Tổng game</p>
          </div>
        </div>

        {/* Suggested Games Cards */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Thử ngay:</h4>
            <AnimatePresence mode="popLayout">
              {suggestions.map((game, index) => {
                const Icon = GENRE_ICONS[game.category] || Gamepad2;
                const gradient = GENRE_COLORS[game.category] || "from-gray-500 to-gray-600";
                
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/games/${game.id}`}>
                      <div className="p-3 rounded-xl border border-muted/50 hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all flex items-center gap-3 group cursor-pointer">
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold truncate">{game.title}</h5>
                          <p className="text-sm text-muted-foreground truncate">{game.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">
                              {game.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {game.difficulty === 'easy' ? 'Dễ' : game.difficulty === 'medium' ? 'Trung bình' : 'Khó'}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="w-full gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Gợi ý game khác
        </Button>
      </CardContent>
    </Card>
  );
}
