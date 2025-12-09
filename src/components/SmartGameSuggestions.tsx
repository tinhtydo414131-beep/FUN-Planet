import { useState, useMemo } from "react";
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
  Star, Zap, ChevronRight, Heart, Smile, Frown, Meh, PartyPopper
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface PlayHistory {
  game_id: string;
  play_count: number;
  last_played: string;
  duration_seconds?: number;
}

interface MoodAnalysis {
  mood: 'happy' | 'calm' | 'energetic' | 'neutral';
  score: number;
  reason: string;
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

const MOOD_ICONS = {
  happy: PartyPopper,
  calm: Meh,
  energetic: Zap,
  neutral: Smile
};

const MOOD_COLORS = {
  happy: "text-yellow-500",
  calm: "text-blue-500",
  energetic: "text-orange-500",
  neutral: "text-gray-500"
};

// Simple mood detection from play patterns
function detectMood(playHistory: PlayHistory[]): MoodAnalysis {
  if (playHistory.length === 0) {
    return { mood: 'neutral', score: 0.5, reason: 'Chưa có dữ liệu chơi' };
  }

  // Analyze play patterns
  const totalPlays = playHistory.reduce((sum, p) => sum + p.play_count, 0);
  const avgDuration = playHistory.reduce((sum, p) => sum + (p.duration_seconds || 0), 0) / playHistory.length;
  const recentPlays = playHistory.filter(p => {
    const playDate = new Date(p.last_played);
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return playDate > dayAgo;
  }).length;

  // High activity = energetic
  if (recentPlays > 3 && avgDuration > 300) {
    return { mood: 'energetic', score: 0.85, reason: 'Bạn đang chơi rất hăng hái!' };
  }
  
  // Moderate activity with longer sessions = calm/focused
  if (avgDuration > 600) {
    return { mood: 'calm', score: 0.7, reason: 'Bạn thích chơi tập trung' };
  }

  // Many short sessions = happy/casual
  if (totalPlays > 5 && avgDuration < 300) {
    return { mood: 'happy', score: 0.75, reason: 'Bạn đang vui vẻ khám phá!' };
  }

  return { mood: 'neutral', score: 0.5, reason: 'Tiếp tục khám phá nhé!' };
}

// Enhanced recommendation with mood
function getSuggestions(
  allGames: Game[], 
  playHistory: PlayHistory[], 
  mood: MoodAnalysis
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
  
  // Mood-based filtering
  if (mood.mood === 'energetic') {
    // Prefer adventure, action games
    unplayedGames = unplayedGames.filter(g => 
      g.category === 'adventure' || g.difficulty === 'medium' || g.difficulty === 'hard'
    );
  } else if (mood.mood === 'calm') {
    // Prefer puzzle, brain games
    unplayedGames = unplayedGames.filter(g => 
      g.category === 'puzzle' || g.category === 'brain' || g.difficulty === 'easy'
    );
  } else if (mood.mood === 'happy') {
    // Prefer casual, fun games
    unplayedGames = unplayedGames.filter(g => 
      g.category === 'casual' || g.difficulty === 'easy'
    );
  }

  // Fallback if too few games
  if (unplayedGames.length < 3) {
    unplayedGames = allGames.filter(g => !playedGameIds.has(g.id) && g.playable);
  }
  
  // Score each game
  const scoredGames = unplayedGames.map(game => {
    let score = 0;
    
    // Prefer categories the user has played before
    score += (categoryScores[game.category] || 0) * 2;
    
    // Mood-based scoring
    if (mood.mood === 'energetic' && (game.category === 'adventure' || game.difficulty === 'hard')) {
      score += 3;
    }
    if (mood.mood === 'calm' && (game.category === 'puzzle' || game.difficulty === 'easy')) {
      score += 3;
    }
    if (mood.mood === 'happy' && game.category === 'casual') {
      score += 3;
    }
    
    // Add some randomness
    score += Math.random() * 2;
    
    return { game, score };
  });
  
  scoredGames.sort((a, b) => b.score - a.score);
  
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
  
  // Fetch user's play history with duration
  const { data: playHistory, isLoading } = useQuery({
    queryKey: ['play-history', user?.id, refreshKey],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('game_sessions')
        .select('game_id, duration_seconds, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        console.error('Error fetching play history:', error);
        return [];
      }
      
      const counts: Record<string, PlayHistory> = {};
      data.forEach(session => {
        if (!counts[session.game_id]) {
          counts[session.game_id] = { 
            game_id: session.game_id, 
            play_count: 0, 
            last_played: session.created_at,
            duration_seconds: 0
          };
        }
        counts[session.game_id].play_count++;
        counts[session.game_id].duration_seconds = (counts[session.game_id].duration_seconds || 0) + (session.duration_seconds || 0);
      });
      
      return Object.values(counts);
    },
    enabled: !!user,
    staleTime: 60000,
  });
  
  // Detect mood from play patterns
  const mood = useMemo(() => {
    return detectMood(playHistory || []);
  }, [playHistory]);
  
  // Calculate suggestions based on mood
  const suggestions = useMemo(() => {
    return getSuggestions(games, playHistory || [], mood);
  }, [playHistory, mood, refreshKey]);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const MoodIcon = MOOD_ICONS[mood.mood];
  
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
            <MoodIcon className={`w-4 h-4 ml-auto ${MOOD_COLORS[mood.mood]}`} />
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
            Mood AI
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Dựa trên cảm xúc và lịch sử chơi của bạn
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mood indicator */}
        <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full bg-white/50 ${MOOD_COLORS[mood.mood]}`}>
              <MoodIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Mood: {mood.mood.charAt(0).toUpperCase() + mood.mood.slice(1)}</p>
              <p className="text-xs text-muted-foreground">{mood.reason}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-purple-500">{Math.round(mood.score * 100)}%</p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
          </div>
        </div>

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
