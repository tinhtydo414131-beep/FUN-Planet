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
        className="py-4 md:py-8 px-2 md:px-4"
        role="region"
        aria-label="Featured games section"
      >
        {/* Subtle Container with holographic border - matching unified background */}
        <div 
          className="container mx-auto max-w-6xl bg-white/25 backdrop-blur-sm rounded-2xl md:rounded-3xl p-3 md:p-6 border-2 overflow-hidden relative"
          style={{
            borderImage: 'linear-gradient(135deg, #F3C4FB, #A2D2FF, #CDB4DB, #F3C4FB) 1',
            boxShadow: '0 8px 32px rgba(243, 196, 251, 0.15)',
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
            {/* Built-in Game: Gem Fusion Quest - 3D Cube Style */}
            <motion.div
              className="flex-shrink-0 snap-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={() => playCardAppear()}
            >
              <div 
                className="relative group cursor-pointer"
                style={{ 
                  transform: 'rotateX(3deg) rotateY(-2deg)',
                  transformStyle: 'preserve-3d'
                }}
                onClick={() => {
                  playBling();
                  navigate('/games/gem-fusion-quest');
                }}
                onMouseEnter={() => playBloop()}
              >
                {/* Front Face - Main Card */}
                <div 
                  className="relative overflow-hidden rounded-2xl md:rounded-3xl w-[140px] sm:w-[160px] md:w-[200px] aspect-[3/4] bg-white/30 backdrop-blur-sm border-2 border-pink-300/60 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:border-pink-400/80 active:scale-[0.98]"
                  style={{
                    boxShadow: '0 8px 24px rgba(243, 196, 251, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)'
                  }}
                >
                  {/* Thumbnail */}
                  <img 
                    src={gemFusionThumbnail}
                    alt="Gem Fusion Quest"
                    className="absolute inset-2 md:inset-3 w-[calc(100%-16px)] md:w-[calc(100%-24px)] h-[55%] object-cover rounded-xl md:rounded-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                  
                  {/* NEW Badge */}
                  <Badge className="absolute top-3 left-3 md:top-4 md:left-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg z-10 text-[8px] md:text-[10px]">
                    ✨ NEW
                  </Badge>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-white/80 to-white/40 backdrop-blur-sm">
                    <h3 className="font-bold text-gray-800 text-xs md:text-sm truncate mb-1">Gem Fusion Quest</h3>
                    <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 mb-2">
                      <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-500" fill="currentColor" />
                      <span>5.0</span>
                      <span className="mx-0.5">•</span>
                      <span>Puzzle</span>
                    </div>
                    
                    {/* Play Button - Below info */}
                    <motion.div
                      className="w-full h-7 md:h-9 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Play className="w-3 h-3 md:w-4 md:h-4 text-white mr-1" fill="white" />
                      <span className="text-white text-[10px] md:text-xs font-semibold">Chơi ngay</span>
                    </motion.div>
                  </div>
                </div>

                {/* Right Side Face - 3D Depth */}
                <div 
                  className="absolute top-0 -right-1.5 md:-right-2 w-1.5 md:w-2 h-full origin-left rounded-r-xl"
                  style={{ 
                    background: 'linear-gradient(to bottom, rgba(243,196,251,0.4), rgba(162,210,255,0.3))',
                  }}
                />

                {/* Bottom Face - 3D Depth */}
                <div 
                  className="absolute -bottom-1.5 md:-bottom-2 left-0 w-full h-1.5 md:h-2 origin-top rounded-b-xl"
                  style={{ 
                    background: 'linear-gradient(to right, rgba(243,196,251,0.3), rgba(162,210,255,0.4))',
                  }}
                />

                {/* Floating Shadow */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-3 bg-pink-400/20 blur-lg rounded-full" />
              </div>
            </motion.div>

            {/* Database Games - 3D Cube Style */}
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
                    className="relative group cursor-pointer"
                    style={{ 
                      transform: 'rotateX(3deg) rotateY(-2deg)',
                      transformStyle: 'preserve-3d'
                    }}
                    onClick={() => handlePlayGame(game)}
                    onMouseEnter={() => playBloop()}
                  >
                    {/* Front Face - Main Card */}
                    <div 
                      className="relative overflow-hidden rounded-2xl md:rounded-3xl w-[140px] sm:w-[160px] md:w-[200px] aspect-[3/4] bg-white/30 backdrop-blur-sm border-2 border-purple-200/60 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:border-purple-300/80 active:scale-[0.98]"
                      style={{
                        boxShadow: '0 8px 24px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255,255,255,0.4)'
                      }}
                    >
                      {/* Thumbnail - Inset style */}
                      {getThumbnailUrl(game.thumbnail_path) ? (
                        <img 
                          src={getThumbnailUrl(game.thumbnail_path)!}
                          alt={game.title}
                          className="absolute inset-2 md:inset-3 w-[calc(100%-16px)] md:w-[calc(100%-24px)] h-[55%] object-cover rounded-xl md:rounded-2xl transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-2 md:inset-3 w-[calc(100%-16px)] md:w-[calc(100%-24px)] h-[55%] bg-gradient-to-br from-purple-300 to-pink-300 rounded-xl md:rounded-2xl flex items-center justify-center">
                          <Gamepad2 className="w-8 h-8 md:w-10 md:h-10 text-white/60" />
                        </div>
                      )}
                      
                      {/* HOT Badge */}
                      {isHot && (
                        <Badge className="absolute top-3 left-3 md:top-4 md:left-4 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg z-10 text-[8px] md:text-[10px]">
                          🔥 HOT
                        </Badge>
                      )}

                      {/* Bottom Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-white/80 to-white/40 backdrop-blur-sm">
                        <h3 className="font-bold text-gray-800 text-xs md:text-sm truncate mb-1">{game.title}</h3>
                        <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-600 mb-2">
                          <Star className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-500" fill="currentColor" />
                          <span>4.8</span>
                          {game.category && (
                            <>
                              <span className="mx-0.5">•</span>
                              <span className="capitalize">{game.category}</span>
                            </>
                          )}
                        </div>
                        
                        {/* Play Button - Below info */}
                        <motion.div
                          className="w-full h-7 md:h-9 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Play className="w-3 h-3 md:w-4 md:h-4 text-white mr-1" fill="white" />
                          <span className="text-white text-[10px] md:text-xs font-semibold">Chơi ngay</span>
                        </motion.div>
                      </div>
                    </div>

                    {/* Right Side Face - 3D Depth */}
                    <div 
                      className="absolute top-0 -right-1.5 md:-right-2 w-1.5 md:w-2 h-full origin-left rounded-r-xl"
                      style={{ 
                        background: 'linear-gradient(to bottom, rgba(168,85,247,0.3), rgba(236,72,153,0.2))',
                      }}
                    />

                    {/* Bottom Face - 3D Depth */}
                    <div 
                      className="absolute -bottom-1.5 md:-bottom-2 left-0 w-full h-1.5 md:h-2 origin-top rounded-b-xl"
                      style={{ 
                        background: 'linear-gradient(to right, rgba(168,85,247,0.2), rgba(236,72,153,0.3))',
                      }}
                    />

                    {/* Floating Shadow */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[85%] h-3 bg-purple-400/15 blur-lg rounded-full" />
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
