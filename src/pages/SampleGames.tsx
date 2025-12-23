import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, X, Maximize2, Gamepad2, Palette, Globe, Heart, Star, Loader2, ExternalLink, RefreshCw, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { haptics } from "@/utils/haptics";
import confetti from "canvas-confetti";

import cover2048 from "@/assets/sample-games/cover-2048.png";
import coverDrawingCanvas from "@/assets/sample-games/cover-drawing-canvas.png";
import coverEcoBuilder from "@/assets/sample-games/cover-eco-builder.png";
import coverGratitudeJournal from "@/assets/sample-games/cover-gratitude-journal.png";
import coverStarExplorer from "@/assets/sample-games/cover-star-explorer.png";

interface SampleGame {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  coverImage: string;
  path: string;
  category: string;
}

const SAMPLE_GAMES: SampleGame[] = [
  {
    id: "2048-puzzle",
    title: "2048 Puzzle",
    description: "Merge tiles to reach 2048! A classic brain teaser.",
    icon: "🧩",
    gradient: "from-purple-500 to-indigo-600",
    coverImage: cover2048,
    path: "/games/2048-puzzle.html",
    category: "Brain"
  },
  {
    id: "drawing-canvas",
    title: "Drawing Canvas",
    description: "Express your creativity with colors and brushes!",
    icon: "🎨",
    gradient: "from-pink-500 to-rose-600",
    coverImage: coverDrawingCanvas,
    path: "/games/drawing-canvas.html",
    category: "Creative"
  },
  {
    id: "eco-builder",
    title: "Eco Builder 3D",
    description: "Build a beautiful eco-friendly world in 3D!",
    icon: "🌍",
    gradient: "from-green-500 to-emerald-600",
    coverImage: coverEcoBuilder,
    path: "/games/eco-builder.html",
    category: "3D Builder"
  },
  {
    id: "gratitude-journal",
    title: "Gratitude Journal",
    description: "Write what you're thankful for and track your happiness!",
    icon: "💖",
    gradient: "from-amber-500 to-orange-600",
    coverImage: coverGratitudeJournal,
    path: "/games/gratitude-journal.html",
    category: "Mindfulness"
  },
  {
    id: "star-explorer",
    title: "Star Explorer",
    description: "Fly through space, collect stars, avoid asteroids!",
    icon: "🚀",
    gradient: "from-blue-500 to-cyan-600",
    coverImage: coverStarExplorer,
    path: "/games/star-explorer.html",
    category: "Adventure"
  }
];

export default function SampleGames() {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<SampleGame | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset states when game changes
  useEffect(() => {
    if (activeGame) {
      setIframeLoading(true);
      setIframeError(false);
      
      // Timeout detection - if iframe doesn't load in 8 seconds, show error
      loadTimeoutRef.current = setTimeout(() => {
        if (iframeLoading) {
          setIframeError(true);
          setIframeLoading(false);
        }
      }, 8000);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [activeGame]);

  const handleIframeLoad = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIframeLoading(false);
  };

  const handleRetry = () => {
    setIframeLoading(true);
    setIframeError(false);
    if (iframeRef.current && activeGame) {
      iframeRef.current.src = activeGame.path + '?t=' + Date.now();
    }
  };

  const handleOpenInNewTab = () => {
    if (activeGame) {
      window.open(activeGame.path, '_blank');
    }
  };

  const handlePlayGame = (game: SampleGame) => {
    haptics.success();
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00D4FF', '#FFD700', '#FF69B4', '#00FF88', '#9B59B6'],
      shapes: ['star'],
    });
    setActiveGame(game);
  };

  const handleCloseGame = () => {
    haptics.light();
    setActiveGame(null);
    setIsFullscreen(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Brain": return <Gamepad2 className="w-4 h-4" />;
      case "Creative": return <Palette className="w-4 h-4" />;
      case "3D Builder": return <Globe className="w-4 h-4" />;
      case "Mindfulness": return <Heart className="w-4 h-4" />;
      case "Adventure": return <Star className="w-4 h-4" />;
      default: return <Gamepad2 className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pb-safe">
      <Navigation />
      
      {/* Fullscreen Game Modal */}
      <AnimatePresence>
        {activeGame && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-50">
              <div className="relative flex items-center justify-between p-4">
                {/* Cover art backdrop */}
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={activeGame.coverImage}
                    alt={`${activeGame.title} cover art`}
                    className="h-full w-full object-cover opacity-60 blur-[2px]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent" />
                </div>

                <div className="relative flex items-center gap-3">
                  <img
                    src={activeGame.coverImage}
                    alt={`${activeGame.title} thumbnail`}
                    className="h-10 w-16 rounded-md object-cover ring-1 ring-white/20"
                    loading="lazy"
                  />
                  <span className="text-3xl" aria-hidden="true">{activeGame.icon}</span>
                  <div>
                    <h2 className="text-white font-bold leading-tight">{activeGame.title}</h2>
                    <p className="text-white/70 text-sm">{activeGame.category}</p>
                  </div>
                </div>

                <div className="relative flex gap-2">
                  <Button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize2 className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={handleCloseGame}
                    className="bg-red-500 hover:bg-red-600 rounded-full"
                    size="icon"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Loading Overlay */}
            {iframeLoading && !iframeError && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black ${isFullscreen ? '' : 'mt-[80px]'}`}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-12 h-12 text-primary" />
                </motion.div>
                <p className="mt-4 text-white/80 text-lg">Loading {activeGame.title}...</p>
                <p className="mt-2 text-white/50 text-sm">Please wait a moment</p>
              </div>
            )}

            {/* Error Fallback UI */}
            {iframeError && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black ${isFullscreen ? '' : 'mt-[80px]'}`}>
                <div className="text-center space-y-6 p-8 max-w-md">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20"
                  >
                    <AlertTriangle className="w-10 h-10 text-yellow-500" />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Game Loading Issue</h3>
                    <p className="text-white/60 text-sm">
                      The game is taking longer than expected to load. This might be due to your connection or browser settings.
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={handleRetry}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    <Button
                      onClick={handleOpenInNewTab}
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in New Tab
                    </Button>
                  </div>
                  
                  <p className="text-white/40 text-xs">
                    Tip: Opening in a new tab often resolves loading issues
                  </p>
                </div>
              </div>
            )}

            {/* Game iframe - optimized for mobile touch */}
            <iframe
              ref={iframeRef}
              src={activeGame.path}
              className={`w-full border-0 ${isFullscreen ? 'h-full' : 'h-[calc(100%-80px)] mt-[80px]'} ${iframeError ? 'hidden' : ''}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              title={activeGame.title}
              onLoad={handleIframeLoad}
              style={{ 
                touchAction: 'manipulation',
                WebkitOverflowScrolling: 'touch',
              }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      <section className="pt-20 md:pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12 space-y-4"
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/games')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Games
            </Button>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 rounded-full border border-yellow-400/30">
              <Star className="w-5 h-5 text-yellow-500 animate-pulse" />
              <span className="text-sm font-bold text-yellow-600">SAMPLE GAMES</span>
              <Star className="w-5 h-5 text-yellow-500 animate-pulse" />
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                5 Sample Games to Inspire You! 🎮
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Play these fun games directly in your browser. No download required!
            </p>
          </motion.div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SAMPLE_GAMES.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/30">
                  {/* Cover Art Header - Clickable */}
                  <div 
                    className="h-32 relative overflow-hidden cursor-pointer"
                    onClick={() => handlePlayGame(game)}
                  >
                    <img
                      src={game.coverImage}
                      alt={`${game.title} cover art`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-35`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                    <motion.div
                      animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute left-4 top-4 text-4xl drop-shadow"
                      aria-hidden="true"
                    >
                      {game.icon}
                    </motion.div>

                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-white/30 rounded-full"
                          style={{
                            left: `${20 + i * 15}%`,
                            top: `${30 + (i % 2) * 40}%`
                          }}
                          animate={{
                            y: [0, -20, 0],
                            opacity: [0.3, 0.7, 0.3]
                          }}
                          transition={{
                            duration: 2 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl">{game.title}</CardTitle>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs text-primary font-medium">
                        {getCategoryIcon(game.category)}
                        {game.category}
                      </span>
                    </div>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <Button
                      onClick={() => handlePlayGame(game)}
                      className={`w-full bg-gradient-to-r ${game.gradient} hover:opacity-90 text-white font-bold py-6 text-lg group-hover:scale-[1.02] transition-transform`}
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Play Now
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <Card className="max-w-2xl mx-auto bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-2xl">Create Your Own Game! 🎮</CardTitle>
                <CardDescription className="text-base">
                  Upload your game and earn 500,000 CAMLY tokens! It's that easy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => navigate('/upload-game')}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-8 py-6 text-lg"
                >
                  Upload Game +500K 💎
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}