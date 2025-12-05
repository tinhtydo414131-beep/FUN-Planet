import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, Star, Pause, Play, Home, 
  RotateCcw, Volume2, VolumeX, Maximize, Minimize,
  Trophy, Flame, Zap, Settings
} from "lucide-react";
import confetti from "canvas-confetti";
import camlyCoinIcon from "@/assets/camly-coin-notification.png";

// 3D Game HUD Overlay
interface Game3DHUDProps {
  score: number;
  level: number;
  lives?: number;
  maxLives?: number;
  coins?: number;
  combo?: number;
  targetScore?: number;
  timeLeft?: number;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  powerUps?: { icon: string; name: string; active: boolean; count: number }[];
  onUsePowerUp?: (index: number) => void;
}

export function Game3DHUD({
  score,
  level,
  lives = 3,
  maxLives = 3,
  coins = 0,
  combo = 0,
  targetScore,
  timeLeft,
  isPaused,
  onPause,
  onResume,
  powerUps = [],
  onUsePowerUp,
}: Game3DHUDProps) {
  const [showComboEffect, setShowComboEffect] = useState(false);

  useEffect(() => {
    if (combo > 2) {
      setShowComboEffect(true);
      setTimeout(() => setShowComboEffect(false), 1000);
    }
  }, [combo]);

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Top bar */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Level badge */}
          <Badge className="bg-gradient-to-r from-primary/90 to-secondary/90 text-white backdrop-blur-sm border-0 shadow-lg">
            <Star className="h-3 w-3 mr-1" />
            Lv.{level}
          </Badge>
          
          {/* Score */}
          <Badge className="bg-black/50 backdrop-blur-sm text-white border-0 shadow-lg">
            <Trophy className="h-3 w-3 mr-1 text-yellow-400" />
            {score.toLocaleString()}
          </Badge>
          
          {/* Coins */}
          <Badge className="bg-yellow-500/80 backdrop-blur-sm text-white border-0 shadow-lg">
            <img src={camlyCoinIcon} alt="Camly Coin" className="h-4 w-4 mr-1" />
            +{coins.toLocaleString()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer */}
          {timeLeft !== undefined && (
            <Badge className={`backdrop-blur-sm border-0 shadow-lg ${
              timeLeft <= 10 ? "bg-red-500/80 animate-pulse" : "bg-black/50"
            } text-white`}>
              ⏱️ {timeLeft}s
            </Badge>
          )}
          
          {/* Pause button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={isPaused ? onResume : onPause}
            className="h-8 w-8 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Lives */}
      {lives !== undefined && (
        <div className="absolute top-12 left-2 flex items-center gap-1">
          {Array.from({ length: maxLives }).map((_, i) => (
            <Heart
              key={i}
              className={`h-5 w-5 transition-all ${
                i < lives ? "text-red-500 fill-red-500 drop-shadow-lg" : "text-gray-500/50"
              }`}
            />
          ))}
        </div>
      )}

      {/* Combo indicator */}
      <AnimatePresence>
        {combo > 1 && (
          <motion.div
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: showComboEffect ? [1, 1.3, 1] : 1, y: 0 }}
            exit={{ scale: 0, y: -20 }}
            className="absolute top-12 right-2"
          >
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse shadow-lg border-0">
              <Flame className="h-3 w-3 mr-1" />
              x{combo} COMBO!
            </Badge>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      {targetScore && targetScore > 0 && (
        <div className="absolute bottom-2 left-2 right-2 pointer-events-auto">
          <div className="bg-black/30 backdrop-blur-sm rounded-full p-1">
            <Progress 
              value={Math.min(100, (score / targetScore) * 100)} 
              className="h-2"
            />
          </div>
          <div className="text-center text-xs text-white/70 mt-1">
            {Math.min(100, Math.round((score / targetScore) * 100))}% hoàn thành
          </div>
        </div>
      )}

      {/* Power-ups */}
      {powerUps.length > 0 && (
        <div className="absolute bottom-16 left-2 flex gap-2 pointer-events-auto">
          {powerUps.map((pu, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={pu.count <= 0 || pu.active}
              onClick={() => onUsePowerUp?.(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-sm text-xs font-medium ${
                pu.active
                  ? "bg-primary/60 text-white animate-pulse"
                  : pu.count > 0
                  ? "bg-black/40 text-white hover:bg-black/60"
                  : "bg-black/20 text-white/50"
              }`}
            >
              <span>{pu.icon}</span>
              {pu.count > 0 && (
                <span className="bg-white/20 rounded px-1">{pu.count}</span>
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}

// 3D Tutorial Modal (Hologram style)
interface Game3DTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  gameTitle: string;
  gameIcon: string;
  howToPlay: string[];
  objectives: string[];
  rewards: { perLevel: number; firstPlay: number; combo: number };
}

export function Game3DTutorial({
  isOpen,
  onClose,
  onStart,
  gameTitle,
  gameIcon,
  howToPlay,
  objectives,
  rewards,
}: Game3DTutorialProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotateX: 30 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        exit={{ scale: 0.8, opacity: 0, rotateX: -30 }}
        className="max-w-md w-full mx-4 p-6 rounded-2xl bg-gradient-to-br from-primary/90 to-secondary/90 border border-white/20 shadow-2xl"
        style={{
          boxShadow: "0 0 60px rgba(var(--primary), 0.3), inset 0 0 30px rgba(255,255,255,0.1)"
        }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl mb-2"
          >
            {gameIcon}
          </motion.div>
          <h2 className="text-2xl font-bold text-white">{gameTitle}</h2>
          <p className="text-white/70 text-sm">3D Adventure Mode</p>
        </div>

        {/* How to play */}
        <div className="mb-4 p-3 rounded-lg bg-white/10">
          <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4" /> Cách chơi
          </h3>
          <ul className="space-y-1">
            {howToPlay.map((step, i) => (
              <li key={i} className="text-white/80 text-sm flex items-start gap-2">
                <span className="bg-white/20 rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </div>

        {/* Rewards */}
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
          <h3 className="text-yellow-300 font-semibold mb-2 flex items-center gap-2">
            <img src={camlyCoinIcon} alt="Camly Coin" className="h-5 w-5" /> Phần thưởng
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-yellow-300">+{rewards.perLevel.toLocaleString()}</div>
              <div className="text-xs text-white/60">Mỗi level</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-300">+{rewards.firstPlay.toLocaleString()}</div>
              <div className="text-xs text-white/60">Lần đầu</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-300">+{rewards.combo.toLocaleString()}</div>
              <div className="text-xs text-white/60">Combo x5</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Bỏ qua
          </Button>
          <Button
            onClick={onStart}
            className="flex-1 bg-white text-primary font-bold hover:bg-white/90"
          >
            Bắt đầu! 🚀
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// Game Over Modal with confetti
interface Game3DGameOverProps {
  isOpen: boolean;
  onClose: () => void;
  onRestart: () => void;
  onHome: () => void;
  isWin: boolean;
  score: number;
  coinsEarned: number;
  level: number;
  stats?: { label: string; value: string | number }[];
}

export function Game3DGameOver({
  isOpen,
  onClose,
  onRestart,
  onHome,
  isWin,
  score,
  coinsEarned,
  level,
  stats = [],
}: Game3DGameOverProps) {
  useEffect(() => {
    if (isOpen && isWin) {
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#ff6b6b", "#4ecdc4", "#ffe66d", "#a855f7"],
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#ff6b6b", "#4ecdc4", "#ffe66d", "#a855f7"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen, isWin]);

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm w-full mx-4 p-6 rounded-2xl bg-gradient-to-br from-background to-primary/10 border-2 border-primary/30 shadow-2xl"
      >
        {/* Result icon */}
        <div className="text-center mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-6xl mb-2"
          >
            {isWin ? "🎉" : "😢"}
          </motion.div>
          <h2 className={`text-2xl font-bold ${isWin ? "text-green-500" : "text-orange-500"}`}>
            {isWin ? "Tuyệt vời!" : "Cố gắng lên!"}
          </h2>
        </div>

        {/* Score */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center gap-2 text-3xl font-bold">
            <Trophy className="h-8 w-8 text-yellow-500" />
            {score.toLocaleString()}
          </div>
          <p className="text-muted-foreground">Level {level}</p>
        </div>

        {/* Coins earned */}
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <img src={camlyCoinIcon} alt="Camly Coin" className="h-6 w-6" />
              Camly Coin
            </span>
            <Badge className="bg-yellow-500 text-white text-lg">
              +{coinsEarned.toLocaleString()}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        {stats.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center p-2 rounded-lg bg-muted/50">
                <div className="font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onHome} className="flex-1">
            <Home className="h-4 w-4 mr-1" />
            Thoát
          </Button>
          <Button onClick={onRestart} className="flex-1 bg-gradient-to-r from-primary to-secondary">
            <RotateCcw className="h-4 w-4 mr-1" />
            Chơi lại
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default Game3DHUD;
