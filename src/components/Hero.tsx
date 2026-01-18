import { Sparkles, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameAudio } from "@/hooks/useGameAudio";
import { AudioControls } from "./AudioControls";
import { MiniLeaderboard } from "./MiniLeaderboard";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import planetMascot from "@/assets/planet-mascot-floating.png";

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
    <section 
      className="hero-gradient-bg relative pt-12 sm:pt-20 md:pt-24 pb-4 sm:pb-10 px-2 sm:px-4 overflow-hidden min-h-[70vh] sm:min-h-[85vh] flex flex-col"
      role="banner"
      aria-label={t('hero.mainBanner', 'FUN Planet - Chơi game vui vẻ')}
    >
      {/* Animated Stars Pattern */}
      <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <span className="text-white text-opacity-60" style={{ fontSize: `${6 + Math.random() * 10}px` }}>
              ✦
            </span>
          </motion.div>
        ))}
      </div>
      
      {/* Sparkle particles effect */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
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

      {/* Audio Controls - Fixed top right */}
      <div className="absolute top-4 right-4 z-30">
        <AudioControls isSoundEnabled={isSoundEnabled} onToggleSound={toggleSound} />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10 flex-1 flex flex-col justify-center">
        {/* Main 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Logo + Play Portal */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4 sm:gap-6 order-1 lg:order-1"
          >
            {/* Circular Logo with Glow */}
            <motion.div 
              className="relative w-20 h-20 sm:w-24 sm:h-24"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <div 
                className="w-full h-full rounded-full overflow-hidden"
                style={{
                  boxShadow: '0 0 30px rgba(243,196,251,0.6), 0 0 60px rgba(162,210,255,0.4)',
                }}
              >
                <img 
                  src="/logo-header-circular.png" 
                  alt="Fun Planet"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Glow ring */}
              <div 
                className="absolute -inset-2 rounded-full opacity-50 animate-spin"
                style={{
                  background: 'conic-gradient(from 0deg, #F3C4FB, #A2D2FF, #CDB4DB, #98F5E1, #F3C4FB)',
                  filter: 'blur(6px)',
                  animationDuration: '12s',
                }}
              />
            </motion.div>

            {/* Play Portal - Holographic Circle - Touch target min 176px */}
            <motion.div 
              className="relative w-44 h-44 sm:w-52 sm:h-52 lg:w-56 lg:h-56"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Outer glow ring - animated */}
              <motion.div 
                className="absolute -inset-3 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{
                  background: 'conic-gradient(from 0deg, #F3C4FB, #A2D2FF, #98F5E1, #CDB4DB, #F3C4FB)',
                  filter: 'blur(12px)',
                  opacity: 0.7,
                }}
              />
              
              {/* Inner circle - glassmorphism button */}
              <button 
                onClick={handlePlayNow}
                onMouseEnter={() => playPop()}
                className="relative w-full h-full rounded-full flex flex-col items-center justify-center transition-all cursor-pointer"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(243,196,251,0.7) 60%, rgba(162,210,255,0.5) 100%)',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 0 60px rgba(243,196,251,0.8), inset 0 0 40px rgba(255,255,255,0.6), 0 10px 40px rgba(168,85,247,0.3)',
                }}
              >
                <motion.span 
                  className="text-3xl sm:text-4xl lg:text-5xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #E879F9 0%, #A855F7 50%, #7C3AED 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 10px rgba(168,85,247,0.3)',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  CHƠI
                </motion.span>
                <motion.span 
                  className="text-3xl sm:text-4xl lg:text-5xl font-black"
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 50%, #E879F9 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 10px rgba(168,85,247,0.3)',
                  }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                >
                  NGAY
                </motion.span>
                
                {/* Play icon */}
                <Play className="w-6 h-6 sm:w-8 sm:h-8 mt-2 text-purple-600 fill-purple-500" />
              </button>

              {/* Pulse glow animation */}
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{
                  boxShadow: [
                    '0 0 40px rgba(243,196,251,0.4)',
                    '0 0 80px rgba(243,196,251,0.7)',
                    '0 0 40px rgba(243,196,251,0.4)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
          </motion.div>

          {/* CENTER COLUMN: Mascot + Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center order-2 lg:order-2"
          >
            {/* 3D FUN PLANET Title */}
            <motion.h1 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              transition={{ delay: 0.3 }}
              className="text-3xl xs:text-4xl sm:text-5xl lg:text-7xl font-black tracking-wider relative mb-4 text-center"
            >
              {/* Holographic shadow - pink/blue theme */}
              <span 
                className="absolute inset-0"
                style={{ 
                  color: 'transparent',
                  textShadow: `
                    1px 1px 0 rgba(243, 196, 251, 0.95),
                    2px 2px 0 rgba(162, 210, 255, 0.9),
                    3px 3px 0 rgba(205, 180, 219, 0.75),
                    4px 4px 0 rgba(144, 112, 224, 0.6)
                  `,
                }}
                aria-hidden="true"
              >
                FUN PLANET
              </span>
              {/* Main holographic gradient - pink/blue */}
              <span 
                className="relative bg-clip-text text-transparent"
                style={{ 
                  backgroundImage: 'linear-gradient(135deg, #F3C4FB 0%, #A2D2FF 35%, #CDB4DB 65%, #9070E0 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-shift 8s ease infinite',
                  WebkitBackgroundClip: 'text',
                }}
              >
                FUN PLANET
              </span>
            </motion.h1>

            {/* Planet Mascot - Floating */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-40 h-40 xs:w-48 xs:h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 mx-auto"
              >
                <img 
                  src={planetMascot}
                  alt="Fun Planet Mascot"
                  className="w-full h-full object-contain"
                  style={{
                    filter: 'drop-shadow(0 0 50px rgba(168,85,247,0.5)) drop-shadow(0 0 25px rgba(243,196,251,0.6))',
                  }}
                />
                
                {/* Orbiting sparkles */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0"
                >
                  <span className="absolute -top-2 left-1/2 text-xl sm:text-2xl">✨</span>
                  <span className="absolute top-1/2 -right-2 text-lg sm:text-xl">⭐</span>
                  <span className="absolute bottom-0 left-1/4 text-lg">🌟</span>
                </motion.div>
              </motion.div>
              
              {/* Pulsating glow under mascot */}
              <motion.div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-2/3 h-8 rounded-full"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                  scale: [1, 1.15, 1],
                }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  background: 'radial-gradient(ellipse, rgba(168,85,247,0.6) 0%, rgba(243,196,251,0.4) 50%, transparent 70%)',
                  filter: 'blur(15px)',
                }}
              />
            </motion.div>

            {/* Badge + Slogan */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-3 mt-4"
            >
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 bg-white/40 backdrop-blur-lg rounded-full border-2 border-white/60 shadow-lg">
                <Sparkles className="w-3 h-3 sm:w-5 sm:h-5 text-yellow-500 animate-pulse" />
                <span className="font-bold text-xs sm:text-base text-purple-700">🌟 {t('hero.badge')}</span>
              </div>
              
              <p className="text-sm sm:text-base text-white font-bold max-w-md mx-auto leading-relaxed px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40">
                🚀 {t('hero.slogan')} 💎✨
              </p>
            </motion.div>
          </motion.div>

          {/* RIGHT COLUMN: MiniLeaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex justify-center lg:justify-end order-3 w-full lg:w-auto"
          >
            <MiniLeaderboard />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
