import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useGameAudio } from "@/hooks/useGameAudio";
import { AudioControls } from "@/components/AudioControls";
import { ArrowLeft, RotateCcw, Lightbulb, Trophy, Footprints, HelpCircle, X, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

interface Position {
  x: number;
  y: number;
}

// Maze generation using recursive backtracking
const generateMaze = (width: number, height: number): number[][] => {
  // Initialize maze with all walls (1 = wall, 0 = path)
  const maze: number[][] = Array(height).fill(null).map(() => Array(width).fill(1));
  
  const carve = (x: number, y: number) => {
    maze[y][x] = 0;
    
    const directions = [
      { dx: 0, dy: -2 }, // up
      { dx: 2, dy: 0 },  // right
      { dx: 0, dy: 2 },  // down
      { dx: -2, dy: 0 }, // left
    ].sort(() => Math.random() - 0.5);
    
    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 1) {
        maze[y + dy / 2][x + dx / 2] = 0; // Remove wall between
        carve(nx, ny);
      }
    }
  };
  
  carve(1, 1);
  
  // Ensure start and goal are accessible
  maze[1][1] = 0;
  maze[height - 2][width - 2] = 0;
  
  return maze;
};

// Find path using BFS for hint system
const findPath = (maze: number[][], start: Position, goal: Position): Position[] => {
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);
  
  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    
    if (pos.x === goal.x && pos.y === goal.y) {
      return path;
    }
    
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ];
    
    for (const { dx, dy } of directions) {
      const nx = pos.x + dx;
      const ny = pos.y + dy;
      const key = `${nx},${ny}`;
      
      if (nx >= 0 && nx < maze[0].length && ny >= 0 && ny < maze.length && 
          maze[ny][nx] === 0 && !visited.has(key)) {
        visited.add(key);
        queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
      }
    }
  }
  
  return [];
};

export const MazeRunner = ({
  level = 1,
  difficultyMultiplier = 1.0,
  onLevelComplete,
  onBack
}: {
  level?: number;
  difficultyMultiplier?: number;
  onLevelComplete?: () => void;
  onBack?: () => void;
} = {}) => {
  const isMobile = useIsMobile();
  const mazeSize = Math.min(11 + Math.floor(level / 2) * 2, 21); // Odd numbers for proper maze
  const [maze, setMaze] = useState<number[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 1 });
  const [moves, setMoves] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hasWon, setHasWon] = useState(false);
  const [visitedCells, setVisitedCells] = useState<Set<string>>(new Set(['1,1']));
  
  const goalPos = useMemo(() => ({ x: mazeSize - 2, y: mazeSize - 2 }), [mazeSize]);
  const { playClick, playSuccess, startBackgroundMusic, stopBackgroundMusic, toggleMusic, toggleSound, isMusicEnabled, isSoundEnabled } = useGameAudio();

  // Generate maze on level change
  useEffect(() => {
    const newMaze = generateMaze(mazeSize, mazeSize);
    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setMoves(0);
    setHasWon(false);
    setShowHint(false);
    setVisitedCells(new Set(['1,1']));
  }, [mazeSize, level]);

  // Calculate hint path
  const hintPath = useMemo(() => {
    if (maze.length === 0) return [];
    return findPath(maze, playerPos, goalPos);
  }, [maze, playerPos, goalPos]);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (hasWon || maze.length === 0) return;
    
    const newX = playerPos.x + dx;
    const newY = playerPos.y + dy;
    
    if (newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize && maze[newY][newX] === 0) {
      setPlayerPos({ x: newX, y: newY });
      setMoves(m => m + 1);
      setVisitedCells(prev => new Set([...prev, `${newX},${newY}`]));
      playClick();
      
      if (newX === goalPos.x && newY === goalPos.y) {
        setHasWon(true);
        playSuccess();
        const stars = hintsUsed === 0 ? 3 : hintsUsed <= 2 ? 2 : 1;
        toast.success(`🎉 Tuyệt vời! Bạn đã thoát mê cung! ${stars} ⭐`);
        setTimeout(() => onLevelComplete?.(), 1500);
      }
    }
  }, [playerPos, maze, mazeSize, goalPos, hasWon, hintsUsed, playClick, playSuccess, onLevelComplete]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp': case 'w': case 'W': movePlayer(0, -1); break;
        case 'ArrowDown': case 's': case 'S': movePlayer(0, 1); break;
        case 'ArrowLeft': case 'a': case 'A': movePlayer(-1, 0); break;
        case 'ArrowRight': case 'd': case 'D': movePlayer(1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer]);

  const resetGame = () => {
    const newMaze = generateMaze(mazeSize, mazeSize);
    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setMoves(0);
    setHasWon(false);
    setHintsUsed(0);
    setShowHint(false);
    setVisitedCells(new Set(['1,1']));
    startBackgroundMusic();
  };

  const useHint = () => {
    setShowHint(true);
    setHintsUsed(h => h + 1);
    toast("💡 Đường đi được hiển thị trong 3 giây!");
    setTimeout(() => setShowHint(false), 3000);
  };

  useEffect(() => {
    startBackgroundMusic();
    return () => stopBackgroundMusic();
  }, []);

  const cellSize = isMobile ? 20 : 28;

  return (
    <div className="flex flex-col items-center gap-4 p-4 animate-fade-in">
      {/* Header */}
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-3">
          {onBack && (
            <Button onClick={onBack} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
            🌿 Maze Runner
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setShowGuide(true)}>
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-between items-center bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-3 mb-3">
          <div className="flex items-center gap-2">
            <Footprints className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-foreground">{moves}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Level {level}</span>
            <span>•</span>
            <span>{mazeSize}×{mazeSize}</span>
          </div>
          <div className="flex items-center gap-1">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-foreground">{hintsUsed}</span>
          </div>
        </div>

        <AudioControls 
          isMusicEnabled={isMusicEnabled}
          isSoundEnabled={isSoundEnabled}
          onToggleMusic={toggleMusic}
          onToggleSound={toggleSound}
        />
      </div>

      {/* Maze Grid */}
      <div 
        className="relative bg-gradient-to-br from-emerald-800 via-green-800 to-teal-800 p-3 rounded-2xl shadow-2xl overflow-hidden"
        style={{ 
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.3), inset 0 0 60px rgba(0,0,0,0.3)'
        }}
      >
        {/* Fog overlay for unexplored areas */}
        <div 
          className="grid gap-0.5"
          style={{ 
            gridTemplateColumns: `repeat(${mazeSize}, ${cellSize}px)`,
          }}
        >
          {maze.map((row, y) =>
            row.map((cell, x) => {
              const isPlayer = x === playerPos.x && y === playerPos.y;
              const isGoal = x === goalPos.x && y === goalPos.y;
              const isWall = cell === 1;
              const isVisited = visitedCells.has(`${x},${y}`);
              const isHintPath = showHint && hintPath.some(p => p.x === x && p.y === y);
              const isStart = x === 1 && y === 1;
              
              return (
                <motion.div
                  key={`${x}-${y}`}
                  initial={isPlayer ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  className={`
                    flex items-center justify-center text-sm rounded-sm transition-all duration-200
                    ${isWall 
                      ? 'bg-gradient-to-br from-emerald-900 to-green-950 border border-emerald-700/30' 
                      : isHintPath
                        ? 'bg-yellow-400/40 border border-yellow-400/60'
                        : isVisited
                          ? 'bg-gradient-to-br from-lime-300/80 to-emerald-300/80 border border-lime-200/50'
                          : 'bg-gradient-to-br from-lime-200/60 to-emerald-200/60 border border-lime-100/30'
                    }
                    ${isGoal && !hasWon ? 'animate-pulse' : ''}
                  `}
                  style={{ 
                    width: cellSize, 
                    height: cellSize,
                  }}
                >
                  {isPlayer && (
                    <motion.div
                      animate={{ 
                        y: [0, -2, 0],
                      }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-lg"
                    >
                      😰
                    </motion.div>
                  )}
                  {isGoal && !isPlayer && (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Trophy className="w-4 h-4 text-yellow-500" />
                    </motion.div>
                  )}
                  {isStart && !isPlayer && (
                    <span className="text-xs opacity-50">🚩</span>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        {/* Win overlay */}
        <AnimatePresence>
          {hasWon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl"
            >
              <div className="text-center text-white">
                <div className="text-5xl mb-2">🎉</div>
                <p className="text-xl font-bold">Thoát mê cung!</p>
                <p className="text-sm opacity-80">{moves} bước • {hintsUsed} gợi ý</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button onClick={useHint} variant="outline" size="sm" disabled={hasWon} className="gap-1">
          <Lightbulb className="w-4 h-4" />
          Gợi ý
        </Button>
        <Button onClick={resetGame} variant="outline" size="sm" className="gap-1">
          <RotateCcw className="w-4 h-4" />
          Mê cung mới
        </Button>
      </div>

      {/* Mobile D-Pad */}
      {isMobile && !hasWon && (
        <div className="grid grid-cols-3 gap-2 w-36">
          <div />
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-12 w-12 rounded-xl"
            onClick={() => movePlayer(0, -1)}
          >
            <ArrowUp className="w-6 h-6" />
          </Button>
          <div />
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-12 w-12 rounded-xl"
            onClick={() => movePlayer(-1, 0)}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-12 w-12 rounded-xl"
            onClick={() => movePlayer(0, 1)}
          >
            <ArrowDown className="w-6 h-6" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-12 w-12 rounded-xl"
            onClick={() => movePlayer(1, 0)}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Guide Modal */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-foreground">📖 Hướng dẫn chơi</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowGuide(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">😰</span>
                  <div>
                    <p className="font-semibold text-foreground">Nhân vật của bạn</p>
                    <p className="text-muted-foreground">Đang bị lạc trong mê cung và cần tìm đường thoát ra!</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Trophy className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Mục tiêu</p>
                    <p className="text-muted-foreground">Tìm đường đến cúp vàng để thoát khỏi mê cung.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-6 h-6 text-yellow-500 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Gợi ý</p>
                    <p className="text-muted-foreground">Nhấn nút gợi ý để thấy đường đi đúng trong 3 giây.</p>
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-2">⌨️ Điều khiển</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>↑ hoặc W: Lên</span>
                    <span>↓ hoặc S: Xuống</span>
                    <span>← hoặc A: Trái</span>
                    <span>→ hoặc D: Phải</span>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-lg p-3">
                  <p className="font-semibold text-foreground mb-1">⭐ Tính điểm</p>
                  <p className="text-xs text-muted-foreground">
                    3⭐: Không dùng gợi ý • 2⭐: 1-2 gợi ý • 1⭐: 3+ gợi ý
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
