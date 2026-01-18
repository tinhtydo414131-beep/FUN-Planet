import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Play, X, Maximize2, Star, Users, Flame, Sparkles } from "lucide-react";
import { GamePreviewPlaceholder } from "@/components/GamePreviewPlaceholder";
import { useGameAudio } from "@/hooks/useGameAudio";
import gemFusionThumbnail from "@/assets/games/gem-fusion-quest-thumbnail.png";

interface FeaturedGame {
  id: string;
  title: string;
  thumbnail_path: string | null;
  external_url: string | null;
  play_count?: number;
  category: string;
}

export function FeaturedGamesSection() {
  const navigate = useNavigate();
  const [games, setGames] = useState<FeaturedGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<FeaturedGame | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { playBloop, playBling, playCardAppear } = useGameAudio();

  useEffect(() => {
    fetchFeaturedGames();
  }, []);

  const fetchFeaturedGames = async () => {
    try {
      const { data, error } = await supabase
        .from('uploaded_games')
        .select('id, title, thumbnail_path, external_url, category')
        .eq('status', 'approved')
        .not('external_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(8);

      if (!error && data) {
        setGames(data as FeaturedGame[]);
      }
    } catch (error) {
      console.error('Error fetching featured games:', error);
    } finally {
      setLoading(false);
    }
  };

  const getThumbnailUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('/')) return path;
    const { data } = supabase.storage.from('uploaded-games').getPublicUrl(path);
    return data.publicUrl;
  };

  const handlePlayGame = (game: FeaturedGame) => {
    playBling();
    setSelectedGame(game);
  };

  const closeGame = () => {
    setSelectedGame(null);
    setIsFullscreen(false);
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      puzzle: "🧩",
      adventure: "🗺️",
      casual: "🎮",
      educational: "📚",
      action: "⚡",
      racing: "🏎️",
      creative: "🎨",
      brain: "🧠",
    };
    return emojis[category] || "🎮";
  };

  // Educational badges based on category
  const getEducationalBadge = (category: string, playCount?: number) => {
    const badges: Record<string, { emoji: string; label: string; gradient: string }> = {
      educational: { emoji: "📚", label: "Học tốt", gradient: "from-green-500 to-emerald-500" },
      puzzle: { emoji: "🧠", label: "Rèn luyện tư duy", gradient: "from-purple-500 to-indigo-500" },
      brain: { emoji: "🧠", label: "Rèn luyện tư duy", gradient: "from-purple-500 to-indigo-500" },
      creative: { emoji: "🎨", label: "Sáng tạo", gradient: "from-pink-500 to-rose-500" },
    };
    
    return badges[category] || null;
  };

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video bg-muted animate-pulse rounded-[28px] min-h-[180px]" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <>
      <section id="featured-games" className="py-16 px-4 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-pink-500/20 rounded-full mb-4">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              <span className="font-bold text-sm">HOT TODAY</span>
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent mb-4">
              Today's Featured Games 🎮
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Play instantly without leaving the page! No downloads, no registration required.
            </p>
          </motion.div>

          {/* Games Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Gem Fusion Quest - Built-in Game Featured */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onAnimationComplete={() => playCardAppear()}
            >
              <Card
                className="group relative overflow-hidden rounded-[28px] border-2 border-yellow-400/50 hover:border-yellow-400 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/20 hover:scale-105 min-h-[180px] md:min-h-[220px] bg-white/25 backdrop-blur-sm"
                onClick={() => {
                  playBling();
                  navigate('/games/gem-fusion-quest');
                }}
                onMouseEnter={() => playBloop()}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden rounded-[24px]">
                  <img 
                    src={gemFusionThumbnail}
                    alt="Gem Fusion Quest"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Glassmorphism overlay on hover */}
                  <div className="absolute inset-0 bg-white/25 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]" />
                  
                  {/* Sparkle effects */}
                  <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-300 animate-pulse z-10" />
                  <Sparkles className="absolute bottom-4 right-4 w-5 h-5 text-white animate-pulse delay-300 z-10" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  {/* Play Button - Always Visible with Pulse Glow */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    <motion.div
                      animate={{
                        boxShadow: [
                          "0 0 20px rgba(236, 72, 153, 0.4)",
                          "0 0 40px rgba(168, 85, 247, 0.6)",
                          "0 0 20px rgba(236, 72, 153, 0.4)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 
                        flex items-center justify-center shadow-2xl
                        hover:scale-110 transition-transform duration-300 cursor-pointer pointer-events-auto"
                    >
                      <Play className="w-8 h-8 text-white ml-1" fill="white" />
                    </motion.div>
                  </div>

                  {/* NEW Badge */}
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg z-10">
                    ✨ NEW
                  </Badge>

                  {/* Match-3 Badge */}
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg z-10">
                    🧩 Match-3
                  </Badge>

                  {/* Educational Badge */}
                  <Badge className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0 shadow-lg text-xs z-10">
                    🧠 Rèn luyện tư duy
                  </Badge>
                </div>

                {/* Game Title */}
                <div className="p-3 bg-card rounded-b-[24px]">
                  <h3 className="font-bold text-sm md:text-base">Gem Fusion Quest</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>5.0</span>
                    <Users className="w-3 h-3 ml-2" />
                    <span>150 levels</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {games.map((game, index) => {
              const educationalBadge = getEducationalBadge(game.category);
              const isHot = index < 3;
              
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onAnimationComplete={() => playCardAppear()}
                >
                  <Card
                    className="group relative overflow-hidden rounded-[28px] border-2 border-transparent hover:border-primary/50 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:scale-105 min-h-[180px] md:min-h-[220px] bg-white/25 backdrop-blur-sm"
                    onClick={() => handlePlayGame(game)}
                    onMouseEnter={() => playBloop()}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden rounded-[24px]">
                      {getThumbnailUrl(game.thumbnail_path) ? (
                        <img
                          src={getThumbnailUrl(game.thumbnail_path)!}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <GamePreviewPlaceholder title={game.title} category={game.category} />
                      )}
                      
                      {/* Glassmorphism overlay on hover */}
                      <div className="absolute inset-0 bg-white/25 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[24px]" />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      
                      {/* Play Button - Always Visible with Pulse Glow */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <motion.div
                          animate={{
                            boxShadow: [
                              "0 0 20px rgba(236, 72, 153, 0.4)",
                              "0 0 40px rgba(168, 85, 247, 0.6)",
                              "0 0 20px rgba(236, 72, 153, 0.4)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 
                            flex items-center justify-center shadow-2xl
                            hover:scale-110 transition-transform duration-300 cursor-pointer pointer-events-auto"
                        >
                          <Play className="w-8 h-8 text-white ml-1" fill="white" />
                        </motion.div>
                      </div>

                      {/* Category Badge */}
                      <Badge className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm z-10">
                        {getCategoryEmoji(game.category)} {game.category}
                      </Badge>

                      {/* Hot Badge for first 3 */}
                      {isHot && (
                        <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 z-10">
                          🔥 HOT
                        </Badge>
                      )}

                      {/* Educational Badge */}
                      {educationalBadge && (
                        <Badge className={`absolute bottom-2 left-2 bg-gradient-to-r ${educationalBadge.gradient} text-white border-0 shadow-lg text-xs z-10`}>
                          {educationalBadge.emoji} {educationalBadge.label}
                        </Badge>
                      )}
                    </div>

                    {/* Game Title */}
                    <div className="p-3 bg-card rounded-b-[24px]">
                      <h3 className="font-bold text-sm md:text-base truncate">{game.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>4.8</span>
                        <Users className="w-3 h-3 ml-2" />
                        <span>{Math.floor(Math.random() * 500) + 100}</span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* View All Button */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById('games-gallery')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-6 text-lg font-bold border-2 hover:bg-primary/10"
            >
              View All Games →
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Game Play Modal */}
      {selectedGame && (
        <Dialog open={!!selectedGame} onOpenChange={() => closeGame()}>
          <DialogContent 
            className={`${isFullscreen ? 'max-w-[100vw] h-[100vh] m-0 rounded-none' : 'max-w-5xl h-[80vh]'} p-0 overflow-hidden`}
          >
            <DialogTitle className="sr-only">{selectedGame.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Playing {selectedGame.title} - {selectedGame.category} game
            </DialogDescription>
              
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-bold text-lg">{selectedGame.title}</h3>
                  <Badge className="bg-green-500 text-white">PLAYING</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={closeGame}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Game Iframe */}
            {selectedGame.external_url && (
              <iframe
                src={selectedGame.external_url}
                className="w-full h-full border-0"
                title={selectedGame.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}