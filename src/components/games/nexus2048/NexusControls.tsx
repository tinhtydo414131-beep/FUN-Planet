import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, 
  RotateCcw, Share2, ArrowLeft, Pause, Play, Maximize, Minimize
} from 'lucide-react';

interface NexusControlsProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onRestart: () => void;
  onShare: () => void;
  onBack?: () => void;
  onTogglePause: () => void;
  onToggleFullscreen: () => void;
  isPaused: boolean;
  isFullscreen: boolean;
  isMobile: boolean;
}

export const NexusControls = ({
  onMove,
  onRestart,
  onShare,
  onBack,
  onTogglePause,
  onToggleFullscreen,
  isPaused,
  isFullscreen,
  isMobile
}: NexusControlsProps) => {
  const buttonStyle = {
    background: 'linear-gradient(135deg, rgba(0,255,255,0.2) 0%, rgba(255,0,255,0.2) 100%)',
    border: '2px solid rgba(0,255,255,0.4)',
    boxShadow: '0 0 15px rgba(0,255,255,0.3), inset 0 0 10px rgba(255,255,255,0.1)',
  };

  const arrowButtonStyle = {
    background: 'linear-gradient(135deg, rgba(0,255,255,0.3) 0%, rgba(255,0,255,0.3) 100%)',
    border: '2px solid rgba(0,255,255,0.5)',
    boxShadow: '0 0 20px rgba(0,255,255,0.4), 0 4px 15px rgba(0,0,0,0.3)',
  };

  return (
    <div className="space-y-4">
      {/* Mobile Direction Controls */}
      {isMobile && (
        <div className="flex justify-center">
          <div className="grid grid-cols-3 gap-2 w-44">
            <div />
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={() => onMove('up')}
                size="lg"
                className="w-14 h-14 rounded-xl"
                style={arrowButtonStyle}
              >
                <ChevronUp className="w-8 h-8 text-cyan-300" />
              </Button>
            </motion.div>
            <div />
            
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={() => onMove('left')}
                size="lg"
                className="w-14 h-14 rounded-xl"
                style={arrowButtonStyle}
              >
                <ChevronLeft className="w-8 h-8 text-cyan-300" />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={() => onMove('down')}
                size="lg"
                className="w-14 h-14 rounded-xl"
                style={arrowButtonStyle}
              >
                <ChevronDown className="w-8 h-8 text-cyan-300" />
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button
                onClick={() => onMove('right')}
                size="lg"
                className="w-14 h-14 rounded-xl"
                style={arrowButtonStyle}
              >
                <ChevronRight className="w-8 h-8 text-cyan-300" />
              </Button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 flex-wrap">
        {onBack && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onBack}
              size="lg"
              className="px-4 py-2 rounded-xl font-orbitron"
              style={buttonStyle}
            >
              <ArrowLeft className="w-5 h-5 mr-2 text-cyan-300" />
              <span className="text-cyan-300">Back</span>
            </Button>
          </motion.div>
        )}

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onRestart}
            size="lg"
            className="px-4 py-2 rounded-xl font-orbitron"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,0,0.3) 0%, rgba(0,200,100,0.3) 100%)',
              border: '2px solid rgba(0,255,0,0.5)',
              boxShadow: '0 0 20px rgba(0,255,0,0.3)',
            }}
          >
            <RotateCcw className="w-5 h-5 mr-2 text-green-300" />
            <span className="text-green-300">New Game</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onTogglePause}
            size="lg"
            className="px-4 py-2 rounded-xl font-orbitron"
            style={{
              background: 'linear-gradient(135deg, rgba(255,165,0,0.3) 0%, rgba(255,140,0,0.3) 100%)',
              border: '2px solid rgba(255,165,0,0.5)',
              boxShadow: '0 0 20px rgba(255,165,0,0.3)',
            }}
          >
            {isPaused ? (
              <Play className="w-5 h-5 mr-2 text-orange-300" />
            ) : (
              <Pause className="w-5 h-5 mr-2 text-orange-300" />
            )}
            <span className="text-orange-300">{isPaused ? 'Resume' : 'Pause'}</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onShare}
            size="lg"
            className="px-4 py-2 rounded-xl font-orbitron"
            style={{
              background: 'linear-gradient(135deg, rgba(255,0,255,0.3) 0%, rgba(148,0,211,0.3) 100%)',
              border: '2px solid rgba(255,0,255,0.5)',
              boxShadow: '0 0 20px rgba(255,0,255,0.3)',
            }}
          >
            <Share2 className="w-5 h-5 mr-2 text-pink-300" />
            <span className="text-pink-300">Share</span>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={onToggleFullscreen}
            size="icon"
            className="w-12 h-12 rounded-xl"
            style={buttonStyle}
          >
            {isFullscreen ? (
              <Minimize className="w-5 h-5 text-cyan-300" />
            ) : (
              <Maximize className="w-5 h-5 text-cyan-300" />
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
