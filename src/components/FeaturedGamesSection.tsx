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
    };
    return emojis[category] || "🎮";
  };

  if (loading) {
    return (
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-video bg-muted animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <>
      <section id="featured-games" className="py-12 sm:py-16 px-4 bg-gradient-to-b from-[#F0E4F7] via-[#E8F4FD] to-white">
        <div className="container mx-auto max-w-7xl">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-400/30 to-purple-400/30 rounded-full mb-4 backdrop-blur-sm border border-white/50">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              <span className="font-bold text-sm text-purple-700">HOT TODAY</span>
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            </div>
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
              style={{
                background: 'linear-gradient(135deg, #E879F9 0%, #A855F7 50%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Today's Featured Games 🎮
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Play instantly without leaving the page! No downloads required.
            </p>
          </motion.div>

          {/* Games Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Gem Fusion Quest - Built-in Game Featured */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Card
                className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={() => navigate('/games/gem-fusion-quest')}
                style={{
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(15px)',
                  border: '2px solid transparent',
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), linear-gradient(135deg, #F3C4FB, #A2D2FF, #CDB4DB)',
                  backgroundOrigin: 'border-box',
                  backgroundClip: 'padding-box, border-box',
                  boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15)',
                }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden rounded-t-2xl">
                  <img 
                    src={gemFusionThumbnail}
                    alt="Gem Fusion Quest"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  
                  {/* Sparkle effects */}
                  <Sparkles className="absolute top-4 left-4 w-6 h-6 text-yellow-300 animate-pulse z-10" />
                  <Sparkles className="absolute bottom-4 right-4 w-5 h-5 text-white animate-pulse delay-300 z-10" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Play Button - Always visible, holographic */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-xl"
                      style={{
                        background: 'linear-gradient(135deg, #F3C4FB 0%, #A2D2FF 50%, #CDB4DB 100%)',
                        boxShadow: '0 0 20px rgba(243, 196, 251, 0.6)',
                      }}
                    >
                      <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" />
                    </motion.div>
                  </div>

                  {/* NEW Badge */}
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-lg font-bold">
                    ✨ NEW
                  </Badge>

                  {/* Match-3 Badge */}
                  <Badge className="absolute top-2 right-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white border-0 shadow-lg">
                    🧩 Match-3
                  </Badge>
                </div>

                {/* Game Title */}
                <div className="p-3 sm:p-4">
                  <h3 className="font-bold text-sm sm:text-base text-gray-800">Gem Fusion Quest</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>5.0</span>
                    <Users className="w-3 h-3 ml-2" />
                    <span>150 levels</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-300 hover:scale-105"
                  onClick={() => handlePlayGame(game)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(15px)',
                    border: '2px solid transparent',
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.6), rgba(255,255,255,0.6)), linear-gradient(135deg, rgba(243, 196, 251, 0.5), rgba(162, 210, 255, 0.5), rgba(205, 180, 219, 0.5))',
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'padding-box, border-box',
                    boxShadow: '0 8px 32px rgba(168, 85, 247, 0.1)',
                  }}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden rounded-t-2xl">
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
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Play Button - Always visible, holographic */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-xl"
                        style={{
                          background: 'linear-gradient(135deg, #F3C4FB 0%, #A2D2FF 50%, #CDB4DB 100%)',
                          boxShadow: '0 0 20px rgba(243, 196, 251, 0.5)',
                        }}
                      >
                        <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-0.5" />
                      </motion.div>
                    </div>

                    {/* Category Badge */}
                    <Badge className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-gray-700 border-0">
                      {getCategoryEmoji(game.category)} {game.category}
                    </Badge>

                    {/* Hot Badge for first 3 */}
                    {index < 3 && (
                      <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-400 to-pink-400 text-white border-0">
                        🔥 HOT
                      </Badge>
                    )}
                  </div>

                  {/* Game Title */}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-sm sm:text-base truncate text-gray-800">{game.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>4.8</span>
                      <Users className="w-3 h-3 ml-2" />
                      <span>{Math.floor(Math.random() * 500) + 100}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8 sm:mt-10"
          >
            <Button
              size="lg"
              onClick={() => document.getElementById('games-gallery')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-bold rounded-full"
              style={{
                background: 'linear-gradient(135deg, #F3C4FB 0%, #A2D2FF 50%, #CDB4DB 100%)',
                color: '#6D28D9',
                border: '2px solid white',
                boxShadow: '0 8px 32px rgba(168, 85, 247, 0.25)',
              }}
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
