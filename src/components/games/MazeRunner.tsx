import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Clock, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface MazeRunnerProps {
  level?: number;
  difficultyMultiplier?: number;
  onLevelComplete?: () => void;
  onBack?: () => void;
}

// Generate maze using recursive backtracking
function generateMaze(size: number): boolean[][] {
  const maze: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(true));
  
  const carve = (x: number, y: number) => {
    maze[y][x] = false;
    const directions = [
      [0, -2], [0, 2], [-2, 0], [2, 0]
    ].sort(() => Math.random() - 0.5);
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx]) {
        maze[y + dy / 2][x + dx / 2] = false;
        carve(nx, ny);
      }
    }
  };
  
  carve(1, 1);
  maze[1][1] = false;
  maze[size - 2][size - 2] = false;
  
  return maze;
}

// Generate coin positions
function generateCoins(maze: boolean[][], count: number): { x: number; y: number }[] {
  const coins: { x: number; y: number }[] = [];
  const size = maze.length;
  
  while (coins.length < count) {
    const x = Math.floor(Math.random() * (size - 2)) + 1;
    const y = Math.floor(Math.random() * (size - 2)) + 1;
    
    if (!maze[y][x] && !(x === 1 && y === 1) && !(x === size - 2 && y === size - 2)) {
      if (!coins.find(c => c.x === x && c.y === y)) {
        coins.push({ x, y });
      }
    }
  }
  
  return coins;
}

export function MazeRunner({ level = 1, difficultyMultiplier = 1, onLevelComplete, onBack }: MazeRunnerProps) {
  const mazeSize = Math.min(7 + level * 2, 21);
  const coinCount = Math.min(3 + level, 10);
  const timeLimit = Math.max(120 - level * 5, 60);
  
  const [maze, setMaze] = useState<boolean[][]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [coins, setCoins] = useState<{ x: number; y: number }[]>([]);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [moves, setMoves] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize game
  const initGame = useCallback(() => {
    const newMaze = generateMaze(mazeSize);
    setMaze(newMaze);
    setPlayerPos({ x: 1, y: 1 });
    setCoins(generateCoins(newMaze, coinCount));
    setCollectedCoins(0);
    setTimeLeft(timeLimit);
    setScore(0);
    setGameState("playing");
    setMoves(0);
  }, [mazeSize, coinCount, timeLimit]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState("lost");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState]);

  // Move player
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (gameState !== "playing") return;
    
    setPlayerPos(prev => {
      const newX = prev.x + dx;
      const newY = prev.y + dy;
      
      if (newX < 0 || newX >= mazeSize || newY < 0 || newY >= mazeSize) return prev;
      if (maze[newY]?.[newX]) return prev;
      
      setMoves(m => m + 1);
      
      // Check coin collection
      const coinIndex = coins.findIndex(c => c.x === newX && c.y === newY);
      if (coinIndex !== -1) {
        setCoins(prev => prev.filter((_, i) => i !== coinIndex));
        setCollectedCoins(prev => prev + 1);
        setScore(prev => prev + 100);
      }
      
      // Check goal
      if (newX === mazeSize - 2 && newY === mazeSize - 2) {
        const timeBonus = timeLeft * 10;
        const coinBonus = collectedCoins * 50;
        setScore(prev => prev + timeBonus + coinBonus + 500);
        setGameState("won");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => onLevelComplete?.(), 1500);
      }
      
      return { x: newX, y: newY };
    });
  }, [gameState, maze, mazeSize, coins, collectedCoins, timeLeft, onLevelComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          movePlayer(0, -1);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          movePlayer(0, 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          movePlayer(-1, 0);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          movePlayer(1, 0);
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer]);

  // Touch swipe controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    if (Math.max(absDx, absDy) < 30) return;
    
    if (absDx > absDy) {
      movePlayer(dx > 0 ? 1 : -1, 0);
    } else {
      movePlayer(0, dy > 0 ? 1 : -1);
    }
    
    touchStartRef.current = null;
  };

  const cellSize = Math.min(300 / mazeSize, 20);

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center min-h-[400px] p-4 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between w-full max-w-md mb-4">
        <div className="flex items-center gap-2 text-primary">
          <Trophy className="w-5 h-5" />
          <span className="font-bold">{score}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${timeLeft < 30 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
          <span className={`font-mono ${timeLeft < 30 ? "text-destructive" : ""}`}>{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-2 text-amber-500">
          <Coins className="w-5 h-5" />
          <span>{collectedCoins}/{coinCount}</span>
        </div>
      </div>

      {/* Maze */}
      <div 
        className="relative bg-card rounded-lg p-2 shadow-lg border"
        style={{ 
          width: mazeSize * cellSize + 16, 
          height: mazeSize * cellSize + 16 
        }}
      >
        {maze.map((row, y) =>
          row.map((isWall, x) => (
            <div
              key={`${x}-${y}`}
              className={`absolute transition-colors ${
                isWall 
                  ? "bg-primary/80" 
                  : x === mazeSize - 2 && y === mazeSize - 2 
                    ? "bg-green-500/50" 
                    : "bg-background"
              }`}
              style={{
                left: x * cellSize + 8,
                top: y * cellSize + 8,
                width: cellSize - 1,
                height: cellSize - 1,
                borderRadius: 2,
              }}
            />
          ))
        )}
        
        {/* Coins */}
        {coins.map((coin, i) => (
          <motion.div
            key={`coin-${i}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: [0, 360] }}
            transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" } }}
            className="absolute text-amber-400"
            style={{
              left: coin.x * cellSize + 8 + cellSize / 4,
              top: coin.y * cellSize + 8 + cellSize / 4,
              fontSize: cellSize / 2,
            }}
          >
            🪙
          </motion.div>
        ))}
        
        {/* Goal */}
        <motion.div
          className="absolute"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{
            left: (mazeSize - 2) * cellSize + 8 + cellSize / 4,
            top: (mazeSize - 2) * cellSize + 8 + cellSize / 4,
            fontSize: cellSize / 2,
          }}
        >
          🚪
        </motion.div>
        
        {/* Player */}
        <motion.div
          className="absolute"
          animate={{ x: playerPos.x * cellSize + 8 + cellSize / 4, y: playerPos.y * cellSize + 8 + cellSize / 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          style={{ fontSize: cellSize / 2 }}
        >
          🏃
        </motion.div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 mt-4 max-w-[180px]">
        <div />
        <Button variant="outline" size="icon" onClick={() => movePlayer(0, -1)} disabled={gameState !== "playing"}>
          <ArrowUp className="w-5 h-5" />
        </Button>
        <div />
        <Button variant="outline" size="icon" onClick={() => movePlayer(-1, 0)} disabled={gameState !== "playing"}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={initGame}>
          <RotateCcw className="w-5 h-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => movePlayer(1, 0)} disabled={gameState !== "playing"}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div />
        <Button variant="outline" size="icon" onClick={() => movePlayer(0, 1)} disabled={gameState !== "playing"}>
          <ArrowDown className="w-5 h-5" />
        </Button>
        <div />
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState !== "playing" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10"
          >
            <div className="bg-card p-6 rounded-xl shadow-xl text-center max-w-sm">
              <div className="text-5xl mb-4">{gameState === "won" ? "🎉" : "😢"}</div>
              <h2 className="text-2xl font-bold mb-2">
                {gameState === "won" ? "Tuyệt vời!" : "Hết giờ!"}
              </h2>
              <p className="text-muted-foreground mb-4">
                {gameState === "won" 
                  ? `Bạn đã thoát mê cung với ${score} điểm!`
                  : "Thời gian đã hết. Hãy thử lại!"}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={initGame}>Chơi lại</Button>
                {onBack && <Button variant="outline" onClick={onBack}>Quay lại</Button>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Level {level} • Maze {mazeSize}×{mazeSize} • {moves} bước
      </p>
    </div>
  );
}

export default MazeRunner;
