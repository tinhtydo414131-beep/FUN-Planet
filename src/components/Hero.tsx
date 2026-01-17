import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGameAudio } from "@/hooks/useGameAudio";
import { AudioControls } from "./AudioControls";
import { MiniLeaderboard } from "./MiniLeaderboard";
import { HolographicPlayButton } from "./HolographicPlayButton";
import { CategoryIslands } from "./CategoryIslands";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

// Use the generated mascot
const mascotPlanet = "/images/mascot-planet.png";
const funPlanetLogo = "/logo-header-circular.png";

export const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    isSoundEnabled,
    toggleSound
  } = useGameAudio();

  const handlePlayNow = () => {
    navigate("/games");
  };

  return (
    <section className="relative pt-20 sm:pt-24 md:pt-28 pb-8 sm:pb-12 px-3 sm:px-4 overflow-hidden min-h-screen flex flex-col">
      {/* Holographic pastel background */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #E8D5F2 0%, #C9E4F6 25%, #F0E4F7 50%, #D4E5F7 75%, #E8D5F2 100%)',
        }}
      />
      
      {/* Animated gradient overlay */}
      <motion.div 
        className="absolute inset-0 z-[1] opacity-50"
        style={{
          background: 'linear-gradient(135deg, rgba(243, 196, 251, 0.4) 0%, rgba(162, 210, 255, 0.4) 50%, rgba(205, 180, 219, 0.4) 100%)',
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      
      {/* Floating decorative elements */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {/* Floating stars */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl sm:text-3xl"
            style={{
              left: `${10 + (i * 12)}%`,
              top: `${15 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 3 + i * 0.5,
              delay: i * 0.3,
              repeat: Infinity,
            }}
          >
            {['✨', '⭐', '💫', '🌟', '✨', '⭐', '💫', '🌟'][i]}
          </motion.div>
        ))}
      </div>
      
      <div className="container mx-auto max-w-7xl relative z-10 flex-1 flex flex-col">
        {/* Top bar: Logo left, Audio controls right */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          {/* Fun Planet Logo - Top Left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <img 
              src={funPlanetLogo}
              alt="Fun Planet"
              className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 border-white/50 shadow-lg"
              style={{
                boxShadow: '0 0 20px rgba(243, 196, 251, 0.5)',
              }}
            />
            <div className="hidden sm:block">
              <h1 
                className="text-xl sm:text-2xl md:text-3xl font-black"
                style={{
                  background: 'linear-gradient(135deg, #E879F9, #A855F7, #3B82F6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                FUN PLANET
              </h1>
            </div>
          </motion.div>
          
          {/* Audio controls */}
          <AudioControls isSoundEnabled={isSoundEnabled} onToggleSound={toggleSound} />
        </div>

        {/* Main Hero Content */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          {/* Left Section: Mascot + Play Button */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center lg:items-start gap-4 sm:gap-6 order-2 lg:order-1"
          >
            {/* Mascot Planet */}
            <motion.div
              className="relative"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Glow effect behind mascot */}
              <div 
                className="absolute inset-0 blur-2xl opacity-50"
                style={{
                  background: 'radial-gradient(circle, rgba(243, 196, 251, 0.8) 0%, rgba(162, 210, 255, 0.4) 50%, transparent 70%)',
                  transform: 'scale(1.3)',
                }}
              />
              <img
                src={mascotPlanet}
                alt="Fun Planet Mascot"
                className="relative z-10 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 object-contain drop-shadow-2xl"
              />
              
              {/* Sparkle decorations */}
              <motion.div
                className="absolute -top-2 -right-2 text-2xl"
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                ✨
              </motion.div>
              <motion.div
                className="absolute -bottom-2 -left-2 text-xl"
                animate={{ rotate: -360, scale: [1, 1.3, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                💫
              </motion.div>
            </motion.div>
            
            {/* Play Now Button */}
            <HolographicPlayButton onClick={handlePlayNow} size="lg" />
            
            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center lg:text-left text-sm sm:text-base text-purple-700 font-semibold max-w-xs"
            >
              🚀 {t('hero.slogan', 'Play, Learn, and Earn Rewards!')} 💎
            </motion.p>
          </motion.div>

          {/* Center Section: Mobile only - shows category islands */}
          <div className="order-3 lg:hidden w-full mt-4">
            <CategoryIslands />
          </div>

          {/* Right Section: Mini Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="order-1 lg:order-2"
          >
            <MiniLeaderboard />
          </motion.div>
        </div>

        {/* Category Islands - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="hidden lg:block mt-8"
        >
          <CategoryIslands />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 1, y: { duration: 1.5, repeat: Infinity } }}
          className="text-center mt-6 sm:mt-8"
        >
          <button 
            onClick={() => document.getElementById('featured-games')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-purple-600/70 hover:text-purple-600 transition-colors"
          >
            <span className="block text-sm mb-1">{t('hero.scrollToPlay', 'Scroll to see games')}</span>
            <span className="text-2xl">↓</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};
