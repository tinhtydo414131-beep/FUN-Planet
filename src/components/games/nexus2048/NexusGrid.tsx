import { motion } from 'framer-motion';
import { NexusTile } from './NexusTile';
import { useEffect, useState } from 'react';

interface NexusGridProps {
  board: number[][];
  gridSize: number;
  newTilePos: { row: number; col: number } | null;
  mergedTiles: Set<string>;
}

export const NexusGrid = ({ board, gridSize, newTilePos, mergedTiles }: NexusGridProps) => {
  const [glowIntensity, setGlowIntensity] = useState(0);

  useEffect(() => {
    // Pulse glow on any board change
    setGlowIntensity(1);
    const timer = setTimeout(() => setGlowIntensity(0), 300);
    return () => clearTimeout(timer);
  }, [board]);

  return (
    <motion.div
      className="relative p-3 sm:p-4 rounded-2xl"
      animate={{ 
        boxShadow: glowIntensity > 0 
          ? '0 0 60px rgba(0,255,255,0.5), 0 0 120px rgba(255,0,255,0.3)' 
          : '0 0 30px rgba(0,255,255,0.2), 0 0 60px rgba(255,0,255,0.1)'
      }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)',
        border: '2px solid rgba(0,255,255,0.3)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Holographic grid lines */}
      <div 
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / gridSize}% ${100 / gridSize}%`,
        }}
      />
      
      {/* Grid container */}
      <div 
        className="grid gap-2 sm:gap-3 relative z-10"
        style={{
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <NexusTile
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              rowIndex={rowIndex}
              colIndex={colIndex}
              gridSize={gridSize}
              isNew={newTilePos?.row === rowIndex && newTilePos?.col === colIndex}
              isMerged={mergedTiles.has(`${rowIndex}-${colIndex}`)}
            />
          ))
        )}
      </div>

      {/* Corner glow accents */}
      <div className="absolute top-0 left-0 w-16 h-16 rounded-tl-2xl bg-gradient-to-br from-cyan-500/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-16 h-16 rounded-tr-2xl bg-gradient-to-bl from-purple-500/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-bl-2xl bg-gradient-to-tr from-pink-500/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-16 h-16 rounded-br-2xl bg-gradient-to-tl from-yellow-500/20 to-transparent pointer-events-none" />
    </motion.div>
  );
};
