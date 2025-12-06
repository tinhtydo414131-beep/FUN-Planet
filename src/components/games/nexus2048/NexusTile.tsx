import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface NexusTileProps {
  value: number;
  rowIndex: number;
  colIndex: number;
  gridSize: number;
  isNew?: boolean;
  isMerged?: boolean;
}

const getTileConfig = (value: number) => {
  const configs: Record<number, { bg: string; glow: string; text: string }> = {
    0: { bg: 'transparent', glow: 'rgba(0,255,255,0.1)', text: '' },
    2: { bg: 'linear-gradient(135deg, #E8F5F7 0%, #B8E6E8 100%)', glow: 'rgba(255,255,255,0.6)', text: '#1a1a2e' },
    4: { bg: 'linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%)', glow: 'rgba(0,229,255,0.8)', text: '#1a1a2e' },
    8: { bg: 'linear-gradient(135deg, #00BFFF 0%, #0088CC 100%)', glow: 'rgba(0,191,255,0.8)', text: '#ffffff' },
    16: { bg: 'linear-gradient(135deg, #00FF00 0%, #00CC00 100%)', glow: 'rgba(0,255,0,0.8)', text: '#1a1a2e' },
    32: { bg: 'linear-gradient(135deg, #FFFF00 0%, #FFD700 100%)', glow: 'rgba(255,255,0,0.8)', text: '#1a1a2e' },
    64: { bg: 'linear-gradient(135deg, #FF8C00 0%, #FF6600 100%)', glow: 'rgba(255,140,0,0.8)', text: '#ffffff' },
    128: { bg: 'linear-gradient(135deg, #FF00FF 0%, #CC00CC 100%)', glow: 'rgba(255,0,255,0.8)', text: '#ffffff' },
    256: { bg: 'linear-gradient(135deg, #9400D3 0%, #7B00B3 100%)', glow: 'rgba(148,0,211,0.8)', text: '#ffffff' },
    512: { bg: 'linear-gradient(135deg, #FF1493 0%, #CC1076 100%)', glow: 'rgba(255,20,147,0.8)', text: '#ffffff' },
    1024: { bg: 'linear-gradient(135deg, #FF4500 0%, #CC3700 100%)', glow: 'rgba(255,69,0,0.8)', text: '#ffffff' },
    2048: { bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF6347 100%)', glow: 'rgba(255,215,0,1)', text: '#1a1a2e' },
    4096: { bg: 'linear-gradient(135deg, #00FFFF 0%, #FF00FF 50%, #FFD700 100%)', glow: 'rgba(255,255,255,1)', text: '#1a1a2e' },
  };
  
  return configs[value] || { 
    bg: 'linear-gradient(135deg, #FF00FF 0%, #00FFFF 50%, #FFD700 100%)', 
    glow: 'rgba(255,255,255,1)', 
    text: '#1a1a2e' 
  };
};

export const NexusTile = ({ value, rowIndex, colIndex, gridSize, isNew, isMerged }: NexusTileProps) => {
  const [showMergeEffect, setShowMergeEffect] = useState(false);
  const config = getTileConfig(value);
  
  useEffect(() => {
    if (isMerged) {
      setShowMergeEffect(true);
      const timer = setTimeout(() => setShowMergeEffect(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isMerged]);

  const fontSize = value >= 1000 ? 'text-lg sm:text-xl md:text-2xl' : 
                   value >= 100 ? 'text-xl sm:text-2xl md:text-3xl' : 
                   'text-2xl sm:text-3xl md:text-4xl';

  return (
    <div className="relative aspect-square">
      {/* Base cell with 3D depth */}
      <div 
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5), inset 0 -2px 4px rgba(255,255,255,0.05)',
          border: '1px solid rgba(0,255,255,0.2)',
        }}
      />
      
      <AnimatePresence mode="popLayout">
        {value !== 0 && (
          <motion.div
            key={`${rowIndex}-${colIndex}-${value}`}
            initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
            animate={{ 
              scale: showMergeEffect ? [1, 1.2, 1] : 1, 
              opacity: 1,
            }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 25,
              duration: 0.2
            }}
            className={`absolute inset-1 rounded-lg flex items-center justify-center ${fontSize} font-bold`}
            style={{
              background: config.bg,
              boxShadow: `
                0 0 20px ${config.glow},
                0 0 40px ${config.glow.replace('0.8', '0.4')},
                inset 0 2px 4px rgba(255,255,255,0.3),
                inset 0 -2px 4px rgba(0,0,0,0.2),
                0 4px 8px rgba(0,0,0,0.4)
              `,
              color: config.text,
              textShadow: value >= 64 ? '0 2px 4px rgba(0,0,0,0.5)' : 'none',
              fontFamily: "'Orbitron', sans-serif",
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <span className="relative z-10">{value}</span>
            
            {/* Inner glow overlay */}
            <div 
              className="absolute inset-0 rounded-lg"
              style={{
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                pointerEvents: 'none'
              }}
            />
            
            {/* Pulsing glow for high-value tiles */}
            {value >= 2048 && (
              <motion.div
                animate={{ 
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute inset-0 rounded-lg"
                style={{
                  boxShadow: `0 0 30px ${config.glow}, 0 0 60px ${config.glow}`,
                  pointerEvents: 'none'
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
