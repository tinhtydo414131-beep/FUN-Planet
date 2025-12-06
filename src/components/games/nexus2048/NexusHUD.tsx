import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Crown, Target, Music, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import camlyCoinIcon from '@/assets/camly-coin-notification.png';

interface NexusHUDProps {
  score: number;
  highScore: number;
  nexusTokens: number;
  moves: number;
  targetTile: number;
  level: number;
  gridSize: number;
  isMusicOn: boolean;
  isSoundOn: boolean;
  onToggleMusic: () => void;
  onToggleSound: () => void;
}

const AnimatedNumber = ({ value, prefix = '' }: { value: number; prefix?: string }) => {
  return (
    <motion.span
      key={value}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="inline-block font-orbitron"
    >
      {prefix}{value.toLocaleString()}
    </motion.span>
  );
};

export const NexusHUD = ({
  score,
  highScore,
  nexusTokens,
  moves,
  targetTile,
  level,
  gridSize,
  isMusicOn,
  isSoundOn,
  onToggleMusic,
  onToggleSound
}: NexusHUDProps) => {
  const progressToTarget = Math.min((score / (targetTile * 10)) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Title */}
      <motion.h1 
        className="text-4xl sm:text-5xl md:text-6xl font-bold text-center font-orbitron"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          background: 'linear-gradient(135deg, #00FFFF 0%, #FF00FF 50%, #FFD700 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 40px rgba(0,255,255,0.5)',
          filter: 'drop-shadow(0 0 20px rgba(255,0,255,0.3))'
        }}
      >
        2048 NEXUS
      </motion.h1>

      {/* Stats Row */}
      <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
        {/* Score */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(0,191,255,0.1) 100%)',
            border: '1px solid rgba(0,255,255,0.4)',
            boxShadow: '0 0 20px rgba(0,255,255,0.2)'
          }}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] sm:text-xs text-cyan-300/80 uppercase tracking-wider">Score</div>
              <div className="text-lg sm:text-xl font-bold text-cyan-300">
                <AnimatedNumber value={score} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* High Score */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,165,0,0.1) 100%)',
            border: '1px solid rgba(255,215,0,0.4)',
            boxShadow: '0 0 20px rgba(255,215,0,0.2)'
          }}
        >
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-[10px] sm:text-xs text-yellow-300/80 uppercase tracking-wider">Best</div>
              <div className="text-lg sm:text-xl font-bold text-yellow-300">
                <AnimatedNumber value={highScore} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Nexus Tokens */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,0,255,0.2) 0%, rgba(148,0,211,0.1) 100%)',
            border: '1px solid rgba(255,0,255,0.4)',
            boxShadow: '0 0 20px rgba(255,0,255,0.2)'
          }}
        >
          <div className="flex items-center gap-2">
            <img src={camlyCoinIcon} alt="Camly" className="w-6 h-6" />
            <div>
              <div className="text-[10px] sm:text-xs text-pink-300/80 uppercase tracking-wider">Tokens</div>
              <div className="text-lg sm:text-xl font-bold text-pink-300">
                <AnimatedNumber value={nexusTokens} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Moves */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,0,0.2) 0%, rgba(0,200,0,0.1) 100%)',
            border: '1px solid rgba(0,255,0,0.4)',
            boxShadow: '0 0 20px rgba(0,255,0,0.2)'
          }}
        >
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-[10px] sm:text-xs text-green-300/80 uppercase tracking-wider">Moves</div>
              <div className="text-lg sm:text-xl font-bold text-green-300">
                <AnimatedNumber value={moves} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Level & Target Info */}
      <div className="flex justify-center items-center gap-4 flex-wrap">
        <motion.div
          className="px-4 py-2 rounded-full flex items-center gap-2"
          style={{
            background: 'linear-gradient(135deg, rgba(138,43,226,0.3) 0%, rgba(75,0,130,0.2) 100%)',
            border: '1px solid rgba(138,43,226,0.5)',
          }}
        >
          <Target className="w-4 h-4 text-purple-400" />
          <span className="text-sm text-purple-300 font-orbitron">
            Level {level} • {gridSize}×{gridSize} • Target: {targetTile}
          </span>
        </motion.div>

        {/* Audio Controls */}
        <div className="flex gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleMusic}
            className="w-10 h-10 rounded-full"
            style={{
              background: isMusicOn ? 'rgba(0,255,255,0.2)' : 'rgba(100,100,100,0.2)',
              border: '1px solid ' + (isMusicOn ? 'rgba(0,255,255,0.5)' : 'rgba(100,100,100,0.5)')
            }}
          >
            <Music className={`w-5 h-5 ${isMusicOn ? 'text-cyan-400' : 'text-gray-500'}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleSound}
            className="w-10 h-10 rounded-full"
            style={{
              background: isSoundOn ? 'rgba(255,0,255,0.2)' : 'rgba(100,100,100,0.2)',
              border: '1px solid ' + (isSoundOn ? 'rgba(255,0,255,0.5)' : 'rgba(100,100,100,0.5)')
            }}
          >
            {isSoundOn ? (
              <Volume2 className="w-5 h-5 text-pink-400" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-500" />
            )}
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="max-w-md mx-auto">
        <div className="relative h-3 rounded-full overflow-hidden"
          style={{
            background: 'rgba(30,41,59,0.8)',
            border: '1px solid rgba(0,255,255,0.3)'
          }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressToTarget}%` }}
            transition={{ type: 'spring', stiffness: 100 }}
            style={{
              background: 'linear-gradient(90deg, #00FFFF, #FF00FF, #FFD700)',
              boxShadow: '0 0 10px rgba(0,255,255,0.5)'
            }}
          />
        </div>
        <div className="text-center text-xs text-cyan-300/60 mt-1 font-orbitron">
          Progress to {targetTile}
        </div>
      </div>
    </div>
  );
};
