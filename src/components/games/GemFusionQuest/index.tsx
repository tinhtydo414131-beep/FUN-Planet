import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Pause, RotateCcw, Star, Heart } from 'lucide-react';
import { MainMenuScene } from './scenes/MainMenuScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { GamePlayScene } from './scenes/GamePlayScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { useGemFusionStore } from './store';
import { useGemFusionSync } from './hooks/useGemFusionSync';
import { useIsMobile } from '@/hooks/use-mobile';
import { LandscapePrompt } from '@/components/LandscapePrompt';

interface GemFusionQuestProps {
  onBack?: () => void;
}

export const GemFusionQuest: React.FC<GemFusionQuestProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameReady, setGameReady] = useState(false);
  const [currentScene, setCurrentScene] = useState<string>('MainMenu');
  const [isPaused, setIsPaused] = useState(false);
  const isMobile = useIsMobile();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  
  // Sync game progress with Supabase
  useGemFusionSync();
  
  const { 
    soundEnabled, 
    toggleSound, 
    lives, 
    stars, 
  } = useGemFusionStore();
  
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    
    // Dynamic sizing - Phaser handles all centering
    const headerHeight = 56;
    const availableWidth = window.innerWidth;
    const availableHeight = window.innerHeight - headerHeight;
    
    const gameWidth = Math.min(480, availableWidth);
    const gameHeight = Math.min(850, availableHeight);
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: gameWidth,
      height: gameHeight,
      transparent: true,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      input: {
        touch: {
          capture: true,
        },
      },
      scene: [MainMenuScene, WorldMapScene, GamePlayScene, LevelCompleteScene],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
    };
    
    gameRef.current = new Phaser.Game(config);

    // Ensure Phaser canvas never sits above the React header (fixes "Back" button not clickable on some devices)
    window.setTimeout(() => {
      const canvas = containerRef.current?.querySelector('canvas') as HTMLCanvasElement | null;
      if (canvas) {
        canvas.style.position = 'relative';
        canvas.style.zIndex = '1';
      }
    }, 0);
    
    // Listen for scene changes
    gameRef.current.events.on('ready', () => {
      setGameReady(true);
      
      // Add custom event for scene tracking
      gameRef.current?.scene.scenes.forEach((scene) => {
        scene.events.on('create', () => {
          setCurrentScene(scene.scene.key);
        });
      });
    });
    
    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);
  
  const handlePause = () => {
    if (gameRef.current && currentScene === 'GamePlay') {
      const scene = gameRef.current.scene.getScene('GamePlay');
      if (scene) {
        if (isPaused) {
          scene.scene.resume();
        } else {
          scene.scene.pause();
        }
        setIsPaused(!isPaused);
      }
    }
  };
  
  const handleRestart = () => {
    if (gameRef.current && currentScene === 'GamePlay') {
      const scene = gameRef.current.scene.getScene('GamePlay');
      if (scene) {
        setIsPaused(false);
        scene.scene.restart();
      }
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-gradient-to-b from-sky-200 via-pink-100 to-rose-200 overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Landscape Prompt for mobile */}
      <LandscapePrompt />
      
      {/* Header UI - Balanced 3-column layout */}
      <div 
        className="absolute top-0 left-0 right-0 z-50 p-3 md:p-4 pointer-events-auto" 
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          {/* Left: Back Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleBack}
            className="p-2.5 bg-white/30 backdrop-blur-md rounded-full shadow-lg border border-white/40"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          
          {/* Center: Lives & Stars */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Lives */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1.5 rounded-full shadow-lg"
            >
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
              <span className="text-white font-bold text-sm md:text-base">{lives}</span>
            </motion.div>
            
            {/* Stars */}
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1.5 rounded-full shadow-lg"
            >
              <Star className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
              <span className="text-white font-bold text-sm md:text-base">{stars}</span>
            </motion.div>
          </div>
          
          {/* Right: Sound Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSound}
            className="p-2.5 bg-white/30 backdrop-blur-md rounded-full shadow-lg border border-white/40"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5 text-gray-700" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-700" />
            )}
          </motion.button>
        </div>
      </div>
      
      {/* Mobile Game Controls */}
      {isMobile && gameReady && currentScene === 'GamePlay' && (
        <div 
          className="absolute left-4 right-4 flex justify-between z-30"
          style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handlePause}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full shadow-lg border border-white/30"
          >
            <Pause className="w-6 h-6 text-white" />
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRestart}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-full shadow-lg border border-white/30"
          >
            <RotateCcw className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      )}
      
      {/* Pause Overlay */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
            onClick={handlePause}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <p className="text-white text-2xl font-bold mb-4">⏸️ Tạm dừng</p>
              <p className="text-white/70">Nhấn để tiếp tục</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Game Container - Phaser handles centering via autoCenter */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 pt-14 z-10"
        style={{ 
          touchAction: 'none',
          paddingTop: 'max(3.5rem, calc(3.5rem + env(safe-area-inset-top)))',
        }}
      />
      
      {/* Loading Overlay */}
      <AnimatePresence>
        {!gameReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-b from-purple-900 to-indigo-900 flex flex-col items-center justify-center z-50"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 360],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl md:text-8xl mb-4 md:mb-6"
            >
              💎
            </motion.div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Gem Fusion Quest</h1>
            <p className="text-white/70 text-sm md:text-base">Loading magical worlds...</p>
            <motion.div
              className="mt-4 w-40 md:w-48 h-2 bg-white/20 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 2 }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GemFusionQuest;
