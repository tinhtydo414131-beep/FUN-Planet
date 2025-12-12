import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Home, RotateCcw, Star, Heart, Zap } from 'lucide-react';
import { MainMenuScene } from './scenes/MainMenuScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { GamePlayScene } from './scenes/GamePlayScene';
import { LevelCompleteScene } from './scenes/LevelCompleteScene';
import { useGemFusionStore } from './store';

interface GemFusionQuestProps {
  onBack?: () => void;
}

export const GemFusionQuest: React.FC<GemFusionQuestProps> = ({ onBack }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [gameReady, setGameReady] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [currentScene, setCurrentScene] = useState<string>('MainMenu');
  
  const { 
    soundEnabled, 
    toggleSound, 
    lives, 
    stars, 
    currentLevel,
    currentWorld,
  } = useGemFusionStore();
  
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 480,
      height: 800,
      backgroundColor: '#1a1a2e',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
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
  
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-purple-900 via-indigo-900 to-slate-900 overflow-hidden">
      {/* Header UI */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 flex items-center justify-between">
        {/* Back Button */}
        {onBack && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full shadow-lg border border-white/30"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </motion.button>
        )}
        
        {/* Lives */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-pink-500 px-3 py-1.5 rounded-full shadow-lg"
        >
          <Heart className="w-5 h-5 text-white fill-white" />
          <span className="text-white font-bold text-lg">{lives}</span>
        </motion.div>
        
        {/* Stars */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 px-3 py-1.5 rounded-full shadow-lg"
        >
          <Star className="w-5 h-5 text-white fill-white" />
          <span className="text-white font-bold text-lg">{stars}</span>
        </motion.div>
        
        {/* Sound Toggle */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSound}
          className="p-2.5 bg-white/20 backdrop-blur-sm rounded-full shadow-lg border border-white/30"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-white" />
          ) : (
            <VolumeX className="w-5 h-5 text-white" />
          )}
        </motion.button>
      </div>
      
      {/* Game Container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0 flex items-center justify-center"
        style={{ touchAction: 'none' }}
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
              className="text-8xl mb-6"
            >
              💎
            </motion.div>
            <h1 className="text-3xl font-bold text-white mb-2">Gem Fusion Quest</h1>
            <p className="text-white/70">Loading magical worlds...</p>
            <motion.div
              className="mt-4 w-48 h-2 bg-white/20 rounded-full overflow-hidden"
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
