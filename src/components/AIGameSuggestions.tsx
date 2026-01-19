import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Sparkles, Gamepad2, RefreshCw, Brain, Rocket, 
  Star, Zap, Heart, Loader2, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface SuggestedGame {
  id: string;
  title: string;
  genre: string;
  difficulty: string;
  description: string;
}

interface PlayerStats {
  gamesPlayed: number;
  favoriteGenres: string[];
  totalProgress: number;
}

const GENRE_ICONS: Record<string, typeof Gamepad2> = {
  puzzle: Brain,
  adventure: Rocket,
  casual: Star,
  educational: Zap
};

const GENRE_COLORS: Record<string, string> = {
  puzzle: "from-blue-500 to-cyan-500",
  adventure: "from-orange-500 to-red-500",
  casual: "from-green-500 to-emerald-500",
  educational: "from-purple-500 to-pink-500"
};

export function AIGameSuggestions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string>("");
  const [suggestedGames, setSuggestedGames] = useState<SuggestedGame[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const fetchSuggestions = async () => {
    if (!user) {
      toast.error("Please login to get personalized suggestions");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-game-suggestions', {
        body: { userId: user.id }
      });

      if (error) throw error;

      setSuggestions(data.suggestions || "");
      setSuggestedGames(data.suggestedGames || []);
      setPlayerStats(data.playerStats || null);
      setHasGenerated(true);

      toast.success("🎮 AI generated your personalized suggestions!");
    } catch (error: any) {
      console.error("Error fetching suggestions:", error);
      if (error.message?.includes('429')) {
        toast.error("Too many requests. Please try again in a moment.");
      } else if (error.message?.includes('402')) {
        toast.error("AI credits exhausted. Please add funds.");
      } else {
        toast.error("Failed to get suggestions. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatSuggestions = (text: string) => {
    // Split by numbered items or bullet points
    const lines = text.split(/\n/).filter(line => line.trim());
    return lines;
  };

  return (
    <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-card via-purple-500/5 to-pink-500/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="font-fredoka flex items-center gap-2 text-xl">
          <Sparkles className="w-6 h-6 text-purple-500" />
          AI Game Suggestions
          <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
            Powered by AI
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Get personalized game recommendations based on your play history
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Player Stats */}
        {playerStats && (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <p className="text-lg font-bold text-primary">{playerStats.gamesPlayed}</p>
              <p className="text-xs text-muted-foreground">Games Played</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <p className="text-lg font-bold text-purple-500">{playerStats.totalProgress}</p>
              <p className="text-xs text-muted-foreground">Progress</p>
            </div>
            <div className="p-2 bg-muted/30 rounded-lg text-center">
              <p className="text-lg font-bold text-pink-500">{playerStats.favoriteGenres.length}</p>
              <p className="text-xs text-muted-foreground">Genres</p>
            </div>
          </div>
        )}

        {/* Generate Button */}
        {!hasGenerated && (
          <Button
            onClick={fetchSuggestions}
            disabled={loading || !user}
            className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing your play history...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Get AI Suggestions
              </>
            )}
          </Button>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {/* AI Suggestions Text */}
        <AnimatePresence>
          {suggestions && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-muted/30 rounded-xl space-y-2"
            >
              {formatSuggestions(suggestions).map((line, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-sm"
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggested Games Cards */}
        {suggestedGames.length > 0 && !loading && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Try These Games:</h4>
            <AnimatePresence>
              {suggestedGames.slice(0, 3).map((game, index) => {
                const Icon = GENRE_ICONS[game.genre] || Gamepad2;
                const gradient = GENRE_COLORS[game.genre] || "from-gray-500 to-gray-600";
                
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={`/games/${game.id}`}>
                      <div className="p-3 rounded-xl border border-muted/50 hover:border-primary/50 bg-muted/20 hover:bg-primary/5 transition-all flex items-center gap-3 group cursor-pointer">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold truncate">{game.title}</h5>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs capitalize">
                              {game.genre}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {game.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Refresh Button */}
        {hasGenerated && !loading && (
          <Button
            variant="outline"
            onClick={fetchSuggestions}
            className="w-full gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Get New Suggestions
          </Button>
        )}

        {/* Not logged in message */}
        {!user && (
          <div className="text-center p-4 bg-muted/30 rounded-xl">
            <Heart className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Login to get personalized game suggestions
            </p>
            <Link to="/auth">
              <Button size="sm" className="mt-2">Login</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
