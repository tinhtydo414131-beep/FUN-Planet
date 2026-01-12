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
      {/* Background image - optimized for mobile */}
      <img 
        src="/images/backgrounds/fun-planet-bg.jpg" 
        alt="Fun Planet Background"
        className="absolute inset-0 w-full h-full object-cover z-0"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        style={{ 
          objectPosition: 'center 40%',
          filter: 'contrast(1.1) saturate(1.15) brightness(1.05)',
        }}
      />
      
      {/* Mobile-specific darker overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 sm:bg-transparent z-[0] pointer-events-none" />
      
      {/* Cosmic radial gradient - matching pastel theme */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(168,85,247,0.12) 0%, rgba(236,72,153,0.08) 35%, rgba(34,211,238,0.06) 60%, transparent 100%)'
        }}
      />
      
      {/* Animated diamond shimmer overlay */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #FF6BD6 25%, #9070E0 50%, #50B0FF 75%, #FFD700 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 15s ease infinite',
        }}
      />
      
      {/* Enhanced pastel vignette - pink/cyan sides */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-600/8 via-transparent to-cyan-600/8 z-[1] pointer-events-none" />
      
      {/* Bottom gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-900/50 z-[1] pointer-events-none" />
      
      {/* Subtle top glow for golden title visibility */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(255,215,0,0.06) 0%, transparent 45%)'
        }}
      />
      
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
            
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-orbitron font-black tracking-wider relative">
              {/* Metallic gold shadow with enhanced depth */}
              <span 
                className="absolute inset-0"
                style={{ 
                  color: 'transparent',
                  textShadow: `
                    1px 1px 0 rgba(255,223,0,0.95),
                    2px 2px 0 rgba(230,180,20,0.9),
                    3px 3px 0 rgba(184,134,11,0.75),
                    4px 4px 0 rgba(120,90,30,0.6),
                    2px 2px 8px rgba(80,60,20,0.5),
                    4px 4px 14px rgba(40,30,10,0.4)
                  `,
                }}
                aria-hidden="true"
              >
                FUN PLANET
              </span>
              {/* Main animated gradient with extended yellow range */}
              <span 
                className="relative bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #FFDC00 10%, #FFC800 18%, #FFB000 25%, #FF6BD6 35%, #E040A0 45%, #D050C0 55%, #9070E0 65%, #7090F0 72%, #FFE066 82%, #FFCC00 90%, #FFD700 100%)',
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
        }} className="text-xs sm:text-base md:text-lg text-white font-rajdhani font-black max-w-[90vw] sm:max-w-2xl mx-auto leading-relaxed px-3 sm:px-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.4)] bg-gradient-to-r from-purple-600/70 via-pink-600/70 to-cyan-600/70 backdrop-blur-xl rounded-2xl py-2.5 sm:py-4 border border-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.15),0_0_40px_rgba(168,85,247,0.25)]">
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
                  placeholder={t('hero.searchPlaceholder')} 
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
                  className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 font-space font-bold px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm rounded-xl border-2 border-purple-300/50 hover:border-purple-400/70 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(200,180,255,0.95) 0%, rgba(180,160,255,0.9) 50%, rgba(200,190,255,0.95) 100%)',
                    color: '#6D28D9',
                    boxShadow: '0 4px 15px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
                    fontWeight: 700,
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