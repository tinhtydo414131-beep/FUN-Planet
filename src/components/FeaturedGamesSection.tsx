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

  // Loading skeleton with NEW horizontal layout
  if (loading) {
    return (
      <section className="py-4 md:py-8 px-2 md:px-4">
        <div className="container mx-auto max-w-6xl py-4 md:py-8">
          <div className="h-6 md:h-8 bg-white/30 rounded-lg w-32 md:w-48 mb-4 md:mb-6 animate-pulse" />
          <div className="flex gap-3 md:gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[280px] h-[90px] sm:h-[100px] md:h-[120px] bg-white/30 rounded-xl md:rounded-2xl animate-pulse" />
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
        className="py-4 md:py-8 px-2 md:px-4"
        role="region"
        aria-label="Featured games section"
      >
        {/* Seamless container - cards float on holographic background */}
        <div className="container mx-auto max-w-6xl py-4 md:py-8 overflow-hidden relative">
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
        className="flex gap-3 md:gap-4 overflow-x-auto pb-3 md:pb-4 snap-x snap-mandatory scrollbar-hide -mx-1 px-1 md:-mx-2 md:px-2 overscroll-x-contain"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
            {/* Built-in Game: Gem Fusion Quest - NEW Horizontal Layout */}
            <motion.div
              className="flex-shrink-0 snap-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => playCardAppear()}
            >
              <div 
                className="relative flex items-center rounded-2xl md:rounded-3xl w-[200px] sm:w-[220px] md:w-[280px] h-[90px] sm:h-[100px] md:h-[120px] bg-white/40 backdrop-blur-sm border border-pink-200/60 hover:border-pink-300/80 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group active:scale-[0.98]"
                style={{
                  boxShadow: '0 8px 24px rgba(243, 196, 251, 0.25), inset 0 1px 0 rgba(255,255,255,0.4)'
                }}
                onClick={() => {
                  playBling();
                  navigate('/games/gem-fusion-quest');
                }}
                onMouseEnter={() => playBloop()}
              >
                {/* Left: Thumbnail + Info */}
                <div className="flex-1 flex items-center gap-2 md:gap-3 p-2 md:p-3 overflow-hidden">
                  {/* Thumbnail - small, rounded */}
                  <div className="relative flex-shrink-0">
                    <img 
                      src={gemFusionThumbnail}
                      alt="Gem Fusion Quest"
                      className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-xl md:rounded-2xl transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* NEW Badge */}
                    <Badge className="absolute -top-1 -left-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg text-[7px] md:text-[9px] px-1.5 py-0">
                      ✨ NEW
                    </Badge>
                  </div>
                  
                  {/* Info */}
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-bold text-gray-800 text-[11px] sm:text-xs md:text-sm truncate mb-0.5">Gem Fusion Quest</h3>
                    <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-gray-600">
                      <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-500" fill="currentColor" />
                      <span>5.0</span>
                    </div>
                    <span className="text-[8px] sm:text-[9px] md:text-[10px] text-purple-600 font-medium">Puzzle</span>
                  </div>
                </div>

                {/* Right: Circular Play Button */}
                <div className="flex-shrink-0 pr-2 md:pr-3">
                  <motion.div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" fill="white" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Database Games - NEW Horizontal Layout */}
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
                    className="relative flex items-center rounded-2xl md:rounded-3xl w-[200px] sm:w-[220px] md:w-[280px] h-[90px] sm:h-[100px] md:h-[120px] bg-white/40 backdrop-blur-sm border border-pink-200/60 hover:border-pink-300/80 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer group active:scale-[0.98]"
                    style={{
                      boxShadow: '0 8px 24px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255,255,255,0.4)'
                    }}
                    onClick={() => handlePlayGame(game)}
                    onMouseEnter={() => playBloop()}
                  >
                    {/* Left: Thumbnail + Info */}
                    <div className="flex-1 flex items-center gap-2 md:gap-3 p-2 md:p-3 overflow-hidden">
                      {/* Thumbnail - small, rounded */}
                      <div className="relative flex-shrink-0">
                        {getThumbnailUrl(game.thumbnail_path) ? (
                          <img 
                            src={getThumbnailUrl(game.thumbnail_path)!}
                            alt={game.title}
                            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-xl md:rounded-2xl transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-300 to-pink-300 rounded-xl md:rounded-2xl flex items-center justify-center">
                            <Gamepad2 className="w-6 h-6 md:w-8 md:h-8 text-white/60" />
                          </div>
                        )}
                        
                        {/* HOT Badge */}
                        {isHot && (
                          <Badge className="absolute -top-1 -left-1 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg text-[7px] md:text-[9px] px-1.5 py-0">
                            🔥 HOT
                          </Badge>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex flex-col justify-center min-w-0">
                        <h3 className="font-bold text-gray-800 text-[11px] sm:text-xs md:text-sm truncate mb-0.5">{game.title}</h3>
                        <div className="flex items-center gap-1 text-[9px] sm:text-[10px] md:text-xs text-gray-600">
                          <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-500" fill="currentColor" />
                          <span>4.8</span>
                        </div>
                        {game.category && (
                          <span className="text-[8px] sm:text-[9px] md:text-[10px] text-purple-600 font-medium capitalize">{game.category}</span>
                        )}
                      </div>
                    </div>

                    {/* Right: Circular Play Button */}
                    <div className="flex-shrink-0 pr-2 md:pr-3">
                      <motion.div
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-4 h-4 md:w-5 md:h-5 text-white ml-0.5" fill="white" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* View All Card - NEW Horizontal Layout */}
            <motion.div
              className="flex-shrink-0 snap-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div 
                className="relative flex items-center justify-center rounded-2xl md:rounded-3xl w-[200px] sm:w-[220px] md:w-[280px] h-[90px] sm:h-[100px] md:h-[120px] bg-gradient-to-br from-purple-400/20 to-pink-400/20 backdrop-blur-sm border-2 border-dashed border-pink-300/60 hover:border-pink-400 transition-all duration-300 cursor-pointer group"
                onClick={() => {
                  playSound(523.25, 0.1, 'sine');
                  navigate('/games');
                }}
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <motion.div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-pink-500/80 to-purple-500/80 flex items-center justify-center group-hover:from-pink-500 group-hover:to-purple-500 transition-all shadow-md group-hover:shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                  >
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </motion.div>
                  <span className="font-bold text-purple-700 text-xs md:text-sm">Xem Tất Cả</span>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Removed: Mobile scroll fade - cards float freely on holographic background */}
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
