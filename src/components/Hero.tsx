import { Sparkles, Play } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameAudio } from "@/hooks/useGameAudio";
import { AudioControls } from "./AudioControls";
import { MiniLeaderboard } from "./MiniLeaderboard";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    playClick,
    playPop,
    isSoundEnabled,
    toggleSound
  } = useGameAudio();

  const handlePlayNow = () => {
    playClick();
    navigate('/games');
  };

  return (
    <section className="relative pt-20 sm:pt-28 md:pt-32 pb-8 sm:pb-12 px-2 sm:px-4 overflow-hidden min-h-[85vh] flex flex-col justify-start">
      {/* Background image */}
      <img 
        src="/images/backgrounds/fun-planet-bg.jpg" 
        alt="Fun Planet Background"
        className="absolute inset-0 w-full h-full object-cover z-0"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        style={{ 
          objectPosition: 'center 40%',
          filter: 'contrast(1.05) saturate(1.1) brightness(1.12)',
        }}
      />
      
      {/* Holographic Pastel Gradient Overlay */}
      <div 
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(243,196,251,0.3) 0%, rgba(162,210,255,0.2) 50%, rgba(205,180,219,0.3) 100%)',
        }}
      />
      
      {/* Sparkle particles effect */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(243,196,251,0.6) 50%, transparent 100%)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
      
      {/* Bottom gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-900/20 z-[1] pointer-events-none" />
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Top bar: Logo left, Audio controls, MiniLeaderboard right */}
        <div className="flex items-start justify-between mb-8 sm:mb-12">
          {/* 3D Holographic Logo - Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div 
              className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden"
              style={{
                boxShadow: '0 0 30px rgba(243,196,251,0.6), 0 0 60px rgba(162,210,255,0.4)',
              }}
            >
              <img 
                src="/logo-header-circular.png" 
                alt="Fun Planet"
                className="w-full h-full object-cover animate-pulse"
              />
            </div>
            {/* Holographic glow ring */}
            <div 
              className="absolute -inset-2 rounded-full opacity-60 animate-spin"
              style={{
                background: 'conic-gradient(from 0deg, #F3C4FB, #A2D2FF, #CDB4DB, #98F5E1, #F3C4FB)',
                filter: 'blur(8px)',
                animationDuration: '8s',
              }}
            />
          </motion.div>

          {/* Right side: Audio + MiniLeaderboard */}
          <div className="flex flex-col items-end gap-4">
            <AudioControls isSoundEnabled={isSoundEnabled} onToggleSound={toggleSound} />
            
            {/* MiniLeaderboard - Hidden on mobile, shown on lg+ */}
            <div className="hidden lg:block">
              <MiniLeaderboard />
            </div>
          </div>
        </div>
        
        {/* Center content: Mascot + Title + Play Button */}
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 bg-white/40 backdrop-blur-lg rounded-full border-2 border-white/60 shadow-lg"
          >
            <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-500 animate-pulse" />
            <span className="font-bold text-xs sm:text-base text-purple-700">🌟 {t('hero.badge')}</span>
          </motion.div>

          {/* Planet Mascot */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative mx-auto"
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-32 h-32 sm:w-48 sm:h-48 lg:w-56 lg:h-56 mx-auto"
            >
              {/* Planet body - purple gradient sphere */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'radial-gradient(circle at 30% 30%, #CDB4DB 0%, #9070E0 40%, #7C3AED 80%, #5B21B6 100%)',
                  boxShadow: '0 0 40px rgba(124,58,237,0.5), inset 0 -20px 40px rgba(0,0,0,0.3), inset 0 10px 30px rgba(255,255,255,0.3)',
                }}
              />
              
              {/* Planet shine highlight */}
              <div 
                className="absolute top-4 left-6 w-1/3 h-1/4 rounded-full opacity-60"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, transparent 100%)',
                  filter: 'blur(4px)',
                }}
              />
              
              {/* Game controller on planet */}
              <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 text-3xl sm:text-5xl lg:text-6xl drop-shadow-lg">
                🎮
              </div>
              
              {/* Orbiting stars */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <span className="absolute -top-2 left-1/2 text-xl">⭐</span>
                <span className="absolute top-1/2 -right-2 text-lg">✨</span>
                <span className="absolute -bottom-1 left-1/4 text-xl">🌟</span>
              </motion.div>
            </motion.div>
            
            {/* Glow effect under mascot */}
            <div 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-4 rounded-full opacity-40"
              style={{
                background: 'radial-gradient(ellipse, rgba(124,58,237,0.6) 0%, transparent 70%)',
                filter: 'blur(10px)',
              }}
            />
          </motion.div>

          {/* FUN PLANET Title */}
          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: 0.3 }}
            className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-wider relative"
          >
            {/* Metallic gold shadow */}
            <span 
              className="absolute inset-0"
              style={{ 
                color: 'transparent',
                textShadow: `
                  1px 1px 0 rgba(255,223,0,0.95),
                  2px 2px 0 rgba(230,180,20,0.9),
                  3px 3px 0 rgba(184,134,11,0.75),
                  4px 4px 0 rgba(120,90,30,0.6)
                `,
              }}
              aria-hidden="true"
            >
              FUN PLANET
            </span>
            {/* Main gradient */}
            <span 
              className="relative bg-clip-text text-transparent"
              style={{ 
                backgroundImage: 'linear-gradient(135deg, #FFD700 0%, #FF6BD6 35%, #9070E0 65%, #FFD700 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 8s ease infinite',
                WebkitBackgroundClip: 'text',
              }}
            >
              FUN PLANET
            </span>
          </motion.h1>

          {/* Slogan */}
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.4 }}
            className="text-sm sm:text-base md:text-lg text-white font-bold max-w-xl mx-auto leading-relaxed px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40"
          >
            🚀 {t('hero.slogan')} 💎✨
          </motion.p>

          {/* Giant PLAY NOW Button */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={handlePlayNow}
              onMouseEnter={() => playPop()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              {/* Holographic shimmer border */}
              <div 
                className="absolute -inset-1 rounded-3xl opacity-80 group-hover:opacity-100 transition-opacity"
                style={{
                  background: 'linear-gradient(90deg, #F3C4FB, #A2D2FF, #CDB4DB, #98F5E1, #F3C4FB)',
                  backgroundSize: '200% 100%',
                  animation: 'gradient-shift 3s linear infinite',
                }}
              />
              
              {/* Button body */}
              <div 
                className="relative px-12 sm:px-16 md:px-20 py-5 sm:py-6 md:py-7 rounded-3xl font-black text-xl sm:text-2xl md:text-3xl text-white flex items-center gap-3 sm:gap-4"
                style={{
                  background: 'linear-gradient(135deg, #E879F9 0%, #A855F7 50%, #7C3AED 100%)',
                  boxShadow: '0 10px 40px rgba(168,85,247,0.4), inset 0 2px 0 rgba(255,255,255,0.3)',
                }}
              >
                <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-white" />
                <span>{t('hero.playNow') || 'CHƠI NGAY'}</span>
                <span className="text-2xl sm:text-3xl">🎮</span>
              </div>

              {/* Pulse glow animation */}
              <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 30px rgba(168,85,247,0.4)',
                    '0 0 60px rgba(168,85,247,0.6)',
                    '0 0 30px rgba(168,85,247,0.4)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.button>
          </motion.div>

          {/* MiniLeaderboard - Mobile only (below button) */}
          <div className="block lg:hidden pt-6">
            <MiniLeaderboard />
          </div>
        </div>
      </div>
    </section>
  );
};
