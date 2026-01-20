import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Home, Clock, Calendar, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useTouchFeedback } from "@/hooks/useTouchFeedback";

interface GameSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  games: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    genre: string;
  };
}

// Session Card component with touch feedback
const SessionCard = ({ session, navigate, formatDuration }: { 
  session: GameSession; 
  navigate: (path: string) => void;
  formatDuration: (seconds: number) => string;
}) => {
  const { triggerFeedback } = useTouchFeedback({ type: 'gameAction' });
  
  return (
    <Card 
      className="touch-card touch-glow border-2 border-primary/20 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer"
      onClick={() => {
        triggerFeedback('gameAction');
        navigate(`/game/${session.games.id}`);
      }}
    >
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Thumbnail */}
          <div className="relative w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 border-2 border-primary/30">
            {session.games.thumbnail_url ? (
              <img
                src={session.games.thumbnail_url}
                alt={session.games.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-5xl">
                🎮
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3 w-full">
            <h3 className="text-2xl font-fredoka font-bold text-primary">
              {session.games.title}
            </h3>
            
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="font-comic text-sm">
                  {formatDistanceToNow(new Date(session.started_at), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-5 h-5 text-secondary" />
                <span className="font-comic text-sm">
                  {formatDuration(session.duration_seconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-comic text-sm">
                {session.games.genre}
              </span>
            </div>
          </div>

          {/* Play Again Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              triggerFeedback('gameAction');
              navigate(`/game/${session.games.id}`);
            }}
            className="font-fredoka font-bold bg-gradient-to-r from-primary to-secondary hover:shadow-lg w-full sm:w-auto"
          >
            <Play className="mr-2 w-4 h-4" />
            Chơi Lại
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function RecentlyPlayed() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchRecentSessions();
  }, [user, navigate]);

  const fetchRecentSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("game_sessions")
        .select(`
          id,
          started_at,
          ended_at,
          duration_seconds,
          games:game_id (
            id,
            title,
            thumbnail_url,
            genre
          )
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSessions(data as GameSession[] || []);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      toast.error("Không thể tải lịch sử chơi game!");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-2xl font-fredoka text-primary">Đang tải lịch sử...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <Navigation />
      
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Back Button */}
          <div className="mb-8">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="lg"
              className="font-fredoka font-bold"
            >
              <Home className="mr-2 w-5 h-5" />
              Về Trang Chủ
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-12 space-y-4 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-fredoka font-bold text-primary">
              🕐 Lịch Sử Chơi Game
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground font-comic max-w-2xl mx-auto">
              Xem lại những game bạn đã chơi và thời gian chơi của bạn!
            </p>
          </div>

          {/* Sessions List */}
          {sessions.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎮</div>
              <p className="text-2xl font-fredoka text-muted-foreground mb-2">
                Chưa có lịch sử chơi game!
              </p>
              <p className="text-lg font-comic text-muted-foreground mb-6">
                Hãy bắt đầu chơi game để xem lịch sử tại đây
              </p>
              <Button
                onClick={() => navigate("/games")}
                className="font-fredoka font-bold text-lg px-8 py-6 bg-gradient-to-r from-primary to-secondary"
              >
                <Play className="mr-2" />
                Khám Phá Game
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <SessionCard 
                  key={session.id}
                  session={session} 
                  navigate={navigate} 
                  formatDuration={formatDuration}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
