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
      
      {/* Minimal gradient overlay - video fully visible */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 z-[1]" />
      {/* Subtle side vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/10 via-transparent to-purple-900/10 z-[1]" />
      
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
            
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-orbitron font-black tracking-wider relative">
              {/* Subtle dark shadow for clarity */}
              <span 
                className="absolute inset-0"
                style={{ 
                  color: 'transparent',
                  textShadow: `
                    1px 1px 0 rgba(80,40,100,0.6),
                    2px 2px 0 rgba(60,30,80,0.5),
                    3px 3px 0 rgba(40,20,60,0.4),
                    2px 2px 6px rgba(0,0,0,0.5),
                    4px 4px 12px rgba(0,0,0,0.3)
                  `,
                }}
                aria-hidden="true"
              >
                FUN PLANET
              </span>
              {/* Main animated gradient with yellow - no glow */}
              <span 
                className="relative bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #FFC000 8%, #FFB000 15%, #FF6BD6 25%, #E040A0 35%, #D050C0 45%, #9070E0 55%, #7090F0 65%, #50B0FF 75%, #40D0FF 85%, #FFE066 95%, #FFD700 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 8s ease infinite',
                  WebkitBackgroundClip: 'text',
                }}
              >
                FUN PLANET
              </span>
              {/* Glossy shine overlay */}
              <span 
                className="absolute inset-0 bg-clip-text text-transparent pointer-events-none"
                style={{ 
                  backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 20%, transparent 50%, rgba(255,255,255,0.2) 80%, rgba(255,255,255,0.5) 100%)',
                  WebkitBackgroundClip: 'text',
                }}
                aria-hidden="true"
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


          {/* Search bar - Glossy white with pink-blue gradient border */}
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
              {/* Pink-blue gradient border */}
              <div 
                className="absolute -inset-[2px] rounded-2xl opacity-90 group-hover:opacity-100 transition duration-300"
                style={{
                  background: 'linear-gradient(90deg, #E040A0 0%, #C060C0 25%, #9070E0 50%, #70A0F0 75%, #50B0FF 100%)',
                }}
              />
              <div 
                className="relative rounded-xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,245,255,0.92) 50%, rgba(255,255,255,0.95) 100%)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Search icon - outline style only */}
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 z-10" strokeWidth={1.5} />
                <Input 
                  type="text" 
                  placeholder={`${t('hero.searchPlaceholder')} 🔍`} 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-9 sm:pl-12 pr-20 sm:pr-28 py-4 sm:py-6 text-sm sm:text-base font-rajdhani font-medium bg-transparent border-0 rounded-xl shadow-none focus:ring-0 focus:border-0"
                  style={{
                    color: 'transparent',
                    backgroundImage: 'linear-gradient(90deg, #E040A0 0%, #9070E0 50%, #50B0FF 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                />
                {/* Placeholder styling override */}
                <style>{`
                  .search-gradient-input::placeholder {
                    background: linear-gradient(90deg, #E040A0 0%, #9070E0 50%, #50B0FF 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                  }
                `}</style>
                <Button 
                  type="submit" 
                  onMouseEnter={() => playPop()} 
                  onClick={() => playClick()} 
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 font-space font-bold px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm rounded-xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(235,230,255,0.95) 0%, rgba(220,225,255,0.9) 50%, rgba(235,240,255,0.95) 100%)',
                    color: '#7C3AED',
                    boxShadow: '0 2px 10px rgba(124,58,237,0.15)',
                  }}
                >
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