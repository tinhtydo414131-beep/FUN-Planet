import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Search, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGameAudio } from "@/hooks/useGameAudio";
import { AudioControls } from "./AudioControls";
import { FunPlanetUnifiedBoard } from "./FunPlanetUnifiedBoard";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";

export const Hero = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const {
    playClick,
    playPop,
    isSoundEnabled,
    toggleSound
  } = useGameAudio();

  // Mobile and reduced motion detection for video optimization
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/games?search=${encodeURIComponent(search)}`);
    }
  };
  const scrollToFeaturedGames = () => {
    document.getElementById('featured-games')?.scrollIntoView({
      behavior: 'smooth'
    });
  };

  return <section className="relative pt-20 sm:pt-28 md:pt-32 pb-8 sm:pb-12 px-3 sm:px-4 overflow-hidden min-h-screen flex flex-col justify-start">
      {/* Video background for desktop, image fallback for mobile */}
      {!isMobile && !prefersReducedMotion ? (
        <video 
          autoPlay 
          muted 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
          style={{ 
            objectPosition: 'center center',
            filter: 'contrast(1.15) saturate(1.2) brightness(1.05)',
          }}
        >
          <source src="/videos/homepage-bg.mp4" type="video/mp4" />
        </video>
      ) : (
        <img 
          src="/images/backgrounds/toa_thap.jpg" 
          alt="Fantasy Background"
          className="absolute inset-0 w-full h-full object-cover z-0"
          loading="eager"
          style={{ 
            objectPosition: 'center 35%',
            filter: 'contrast(1.15) saturate(1.25) brightness(1.0)',
          }}
        />
      )}
      
      {/* Enhanced gradient overlay - lighter for video visibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-[1]" />
      {/* Side vignette effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-transparent to-purple-900/30 z-[1]" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Audio controls */}
          <div className="flex justify-end mb-2">
            <AudioControls isSoundEnabled={isSoundEnabled} onToggleSound={toggleSound} />
          </div>
          
          {/* Badge - Enhanced with glow */}
          <motion.div initial={{
          opacity: 0,
          y: -20
        }} animate={{
          opacity: 1,
          y: 0
        }} className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-gradient-to-r from-purple-600/95 via-pink-600/95 to-cyan-600/95 backdrop-blur-lg rounded-full border-2 border-white/60 shadow-[0_0_30px_rgba(168,85,247,0.5)]">
            <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />
            <span className="font-space text-xs sm:text-base font-black text-white drop-shadow-lg">🌟 {t('hero.badge')}</span>
          </motion.div>

          {/* Logo with diamonds */}
          <motion.div initial={{
          opacity: 0,
          scale: 0.9
        }} animate={{
          opacity: 1,
          scale: 1
        }} transition={{
          delay: 0.2
        }} className="flex items-center justify-center gap-3 sm:gap-6 md:gap-8">
            <motion.div animate={{
            rotate: 360
          }} transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}>
              
            </motion.div>
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-orbitron font-black tracking-wider">
              <span 
                className="bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: 'linear-gradient(to bottom, #FF69B4, #FF8DC7, #87CEEB, #40E0D0, #FFD700)',
                  textShadow: `
                    0 1px 0 rgba(255,180,220,0.9),
                    0 2px 0 rgba(255,160,200,0.85),
                    0 3px 0 rgba(255,140,180,0.8),
                    0 4px 0 rgba(255,120,160,0.75),
                    0 5px 0 rgba(240,100,140,0.7),
                    0 6px 0 rgba(220,80,120,0.65),
                    0 7px 0 rgba(200,60,100,0.6),
                    0 8px 0 rgba(180,40,80,0.5),
                    0 10px 15px rgba(0,0,0,0.4),
                    0 15px 30px rgba(255,105,180,0.3),
                    0 0 60px rgba(255,215,0,0.5)
                  `,
                  WebkitTextStroke: '1px rgba(255,255,255,0.2)',
                }}
              >
                FUN PLANET
              </span>
            </h1>
            
            
          </motion.div>

          {/* Slogan - Enhanced glassmorphism */}
          <motion.p initial={{
          opacity: 0
        }} animate={{
          opacity: 1
        }} transition={{
          delay: 0.3
        }} className="text-sm sm:text-lg md:text-xl text-white font-rajdhani font-black max-w-2xl mx-auto leading-relaxed px-4 sm:px-6 drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)] bg-gradient-to-r from-purple-600/85 via-pink-600/85 to-cyan-600/85 backdrop-blur-xl rounded-2xl py-3 sm:py-5 border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.3),0_0_60px_rgba(168,85,247,0.3)]">
            🚀 {t('hero.slogan')} 💎✨
          </motion.p>


          {/* Search bar - Enhanced glow effect */}
          <motion.form initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }} onSubmit={handleSearch} className="max-w-xl mx-auto px-2 sm:px-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-300" />
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-purple-400 group-hover:text-cyan-400 transition-colors z-10" />
                <Input type="text" placeholder={`${t('hero.searchPlaceholder')} 🔍`} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 sm:pl-12 pr-20 sm:pr-28 py-4 sm:py-6 text-sm sm:text-base font-rajdhani font-medium bg-black/40 backdrop-blur-xl border-2 border-white/30 focus:border-cyan-400 rounded-xl shadow-lg text-white placeholder:text-white/50 focus:ring-4 focus:ring-cyan-400/30" />
                <Button type="submit" onMouseEnter={() => playPop()} onClick={() => playClick()} className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 font-space font-bold px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:shadow-[0_0_30px_rgba(168,85,247,0.7)] transition-all">
                  {t('hero.searchButton')} 🚀
                </Button>
              </div>
            </div>
          </motion.form>


          {/* Unified Board: Honor + Legends + Top Ranking */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.5
        }} className="pt-4 sm:pt-6 w-full max-w-5xl mx-auto px-0 sm:px-2">
            <FunPlanetUnifiedBoard />
          </motion.div>

          {/* Scroll indicator */}
          <motion.div initial={{
          opacity: 0
        }} animate={{
          opacity: 1,
          y: [0, 10, 0]
        }} transition={{
          delay: 1,
          y: {
            duration: 1.5,
            repeat: Infinity
          }
        }} className="pt-8">
            <button onClick={scrollToFeaturedGames} className="text-white/60 hover:text-white transition-colors">
              <span className="block text-sm mb-2">{t('hero.scrollToPlay')}</span>
              <span className="text-3xl">↓</span>
            </button>
          </motion.div>
        </div>
      </div>
    </section>;
};