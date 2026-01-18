import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Play, X, Maximize2, Star, ChevronLeft, ChevronRight, Gamepad2 } from "lucide-react";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { playBloop, playBling, playCardAppear, playSound } = useGameAudio();

  useEffect(() => {
    fetchFeaturedGames();
  }, []);

  const fetchFeaturedGames = async () => {
    try {
      const { data, error } = await supabase
        .from('uploaded_games')
        .select('id, title, thumbnail_path, external_url, category, play_count')
        .eq('status', 'approved')
        .not('external_url', 'is', null)
        .order('play_count', { ascending: false })
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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 240;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Loading skeleton with horizontal layout - mobile optimized
  if (loading) {
    return (
      <section className="py-6 md:py-12 px-2 md:px-4">
        <div 
          className="container mx-auto max-w-6xl bg-white/20 backdrop-blur-lg rounded-2xl md:rounded-3xl p-3 md:p-6 border-2 border-white/30"
        >
          <div className="h-6 md:h-8 bg-white/30 rounded-lg w-32 md:w-48 mb-4 md:mb-6 animate-pulse" />
          <div className="flex gap-3 md:gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[220px] aspect-[3/4] bg-white/30 rounded-xl md:rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (games.length === 0) return null;

  return (
    <>
      <section 
        id="featured-games" 
        className="py-6 md:py-12 px-2 md:px-4"
        role="region"
        aria-label="Featured games section"
      >
        {/* Glassmorphism Container with Holographic Border */}
        <div 
          className="container mx-auto max-w-6xl bg-white/20 backdrop-blur-lg rounded-2xl md:rounded-3xl p-3 md:p-6 border-2 overflow-hidden relative"
          style={{
            borderImage: "linear-gradient(135deg, #F3C4FB, #A2D2FF, #CDB4DB, #F3C4FB) 1"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3 md:mb-6 px-1">
            <motion.h2 
              className="text-base md:text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent flex items-center gap-1.5 md:gap-2"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Gamepad2 className="w-4 h-4 md:w-6 md:h-6 text-purple-500" />
              Featured Games
            </motion.h2>

            {/* Navigation Arrows - Desktop only */}
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full bg-white/40 hover:bg-white/60 text-purple-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full bg-white/40 hover:bg-white/60 text-purple-600"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Horizontal Scroll Container - mobile optimized */}
          <div 
            ref={scrollContainerRef}
            className="flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1 md:-mx-2 md:px-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Built-in Game: Gem Fusion Quest */}
            <motion.div
              className="flex-shrink-0 snap-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => playCardAppear()}
            >
              <div 
                className="relative overflow-hidden rounded-xl md:rounded-2xl w-[140px] sm:w-[160px] md:w-[220px] aspect-[3/4] group bg-white/25 backdrop-blur-sm border-2 border-yellow-400/50 hover:border-yellow-400 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl hover:shadow-yellow-500/20 active:scale-[0.98]"
                onClick={() => {
                  playBling();
                  navigate('/games/gem-fusion-quest');
                }}
                onMouseEnter={() => playBloop()}
              >
                {/* Thumbnail */}
                <img 
                  src={gemFusionThumbnail}
                  alt="Gem Fusion Quest"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* NEW Badge - smaller on mobile */}
                <Badge className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg z-10 text-[8px] md:text-[10px]">
                  ✨ NEW
                </Badge>

                {/* Bottom Info - compact on mobile */}
                <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                  <h3 className="font-bold text-white text-xs md:text-sm truncate mb-0.5 md:mb-1">Gem Fusion Quest</h3>
                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-white/80">
                    <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400" fill="currentColor" />
                    <span>5.0</span>
                    <span className="mx-0.5 hidden sm:inline">•</span>
                    <span className="hidden sm:inline">Puzzle</span>
                  </div>
                </div>

                {/* Play Button - smaller on mobile */}
                <motion.div
                  className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all z-10"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-3 h-3 md:w-5 md:h-5 text-white ml-0.5" fill="white" />
                </motion.div>
              </div>
            </motion.div>

            {/* Database Games */}
            {games.map((game, index) => {
              const isHot = (game.play_count || 0) > 100;
              
              return (
                <motion.div
                  key={game.id}
                  className="flex-shrink-0 snap-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: (index + 1) * 0.05 }}
                  onAnimationComplete={() => playCardAppear()}
                >
                  <div 
                    className="relative overflow-hidden rounded-xl md:rounded-2xl w-[140px] sm:w-[160px] md:w-[220px] aspect-[3/4] group bg-white/25 backdrop-blur-sm border-2 border-white/40 hover:border-purple-300/60 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl active:scale-[0.98]"
                    onClick={() => handlePlayGame(game)}
                    onMouseEnter={() => playBloop()}
                  >
                    {/* Thumbnail */}
                    {getThumbnailUrl(game.thumbnail_path) ? (
                      <img 
                        src={getThumbnailUrl(game.thumbnail_path)!}
                        alt={game.title}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                        <Gamepad2 className="w-8 h-8 md:w-12 md:h-12 text-white/50" />
                      </div>
                    )}
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* HOT Badge for popular games - smaller on mobile */}
                    {isHot && (
                      <Badge className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg z-10 text-[8px] md:text-[10px]">
                        🔥
                      </Badge>
                    )}

                    {/* Bottom Info - compact on mobile */}
                    <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3">
                      <h3 className="font-bold text-white text-xs md:text-sm truncate mb-0.5 md:mb-1">{game.title}</h3>
                      <div className="flex items-center gap-1 text-[10px] md:text-xs text-white/80">
                        <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-400" fill="currentColor" />
                        <span>4.8</span>
                        {game.category && (
                          <>
                            <span className="mx-0.5 hidden sm:inline">•</span>
                            <span className="capitalize hidden sm:inline">{game.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Play Button - smaller on mobile */}
                    <motion.div
                      className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all z-10"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-3 h-3 md:w-5 md:h-5 text-white ml-0.5" fill="white" />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}

            {/* View All Card */}
            <motion.div
              className="flex-shrink-0 snap-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div 
                className="relative overflow-hidden rounded-xl md:rounded-2xl w-[140px] sm:w-[160px] md:w-[220px] aspect-[3/4] bg-gradient-to-br from-purple-400/30 to-pink-400/30 backdrop-blur-sm border-2 border-dashed border-purple-300/60 hover:border-purple-400 transition-all duration-300 cursor-pointer flex items-center justify-center group"
                onClick={() => {
                  playSound(523.25, 0.1, 'sine');
                  navigate('/games');
                }}
              >
                <div className="text-center">
                  <motion.div
                    className="w-10 h-10 md:w-14 md:h-14 mx-auto mb-2 md:mb-3 rounded-full bg-white/40 flex items-center justify-center group-hover:bg-white/60 transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                  >
                    <ChevronRight className="w-5 h-5 md:w-7 md:h-7 text-purple-600" />
                  </motion.div>
                  <span className="font-bold text-purple-700 text-xs md:text-sm">Xem Tất Cả</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Mobile scroll fade indicator - positioned outside scroll container */}
          <div className="absolute right-0 top-16 bottom-8 w-8 bg-gradient-to-l from-white/40 to-transparent pointer-events-none md:hidden rounded-r-2xl" />
        </div>
      </section>

      {/* Game Play Modal */}
      {selectedGame && (
        <Dialog open={!!selectedGame} onOpenChange={() => closeGame()}>
          <DialogContent 
            className={`${isFullscreen ? 'max-w-[100vw] h-[100vh] m-0 rounded-none' : 'max-w-5xl h-[80vh]'} p-0 overflow-hidden bg-gradient-to-br from-purple-900 to-pink-900`}
          >
            <DialogTitle className="sr-only">{selectedGame.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Playing {selectedGame.title} - {selectedGame.category} game
            </DialogDescription>
              
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-pink-400" />
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
