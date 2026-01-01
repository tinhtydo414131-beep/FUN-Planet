import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Text, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Clock, Coins, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface MazeRunner3DProps {
  level?: number;
  difficultyMultiplier?: number;
  onLevelComplete?: () => void;
  onBack?: () => void;
}

// Generate maze
function generateMaze(size: number): boolean[][] {
  const maze: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(true));
  
  const carve = (x: number, y: number) => {
    maze[y][x] = false;
    const directions = [[0, -2], [0, 2], [-2, 0], [2, 0]].sort(() => Math.random() - 0.5);
    
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
  return maze;
}

// 3D Maze Component
function Maze3D({ maze, cellSize }: { maze: boolean[][]; cellSize: number }) {
  const walls = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x]) {
          positions.push([
            (x - maze[y].length / 2) * cellSize,
            1.5,
            (y - maze.length / 2) * cellSize
          ]);
        }
      }
    }
    return positions;
  }, [maze, cellSize]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[maze[0].length * cellSize, maze.length * cellSize]} />
        <meshStandardMaterial color="#1a1f2e" roughness={0.9} />
      </mesh>

      {/* Walls */}
      {walls.map((pos, i) => (
        <mesh key={i} position={pos} castShadow receiveShadow>
          <boxGeometry args={[cellSize * 0.95, 3, cellSize * 0.95]} />
          <meshStandardMaterial color="#2d3a4f" roughness={0.8} metalness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

// Player Component
function Player({ position, cellSize, mazeSize }: { position: { x: number; y: number }; cellSize: number; mazeSize: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const targetPos = useMemo(() => new THREE.Vector3(
    (position.x - mazeSize / 2) * cellSize,
    0.5,
    (position.y - mazeSize / 2) * cellSize
  ), [position, cellSize, mazeSize]);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.lerp(targetPos, 0.2);
      ref.current.rotation.y += 0.02;
    }
  });

  return (
    <mesh ref={ref} position={[targetPos.x, 0.5, targetPos.z]} castShadow>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color="#4ECDC4" emissive="#4ECDC4" emissiveIntensity={0.3} metalness={0.5} />
      <pointLight color="#4ECDC4" intensity={0.5} distance={5} />
    </mesh>
  );
}

// Coin Component
function Coin({ position, cellSize, mazeSize, onClick }: { position: { x: number; y: number }; cellSize: number; mazeSize: number; onClick: () => void }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 2;
      ref.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <Float speed={4} rotationIntensity={0.5} floatIntensity={0.3}>
      <mesh
        ref={ref}
        position={[
          (position.x - mazeSize / 2) * cellSize,
          0.5,
          (position.y - mazeSize / 2) * cellSize
        ]}
        onClick={onClick}
      >
        <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} emissive="#ffd700" emissiveIntensity={0.3} />
        <pointLight color="#ffd700" intensity={0.3} distance={3} />
      </mesh>
    </Float>
  );
}

// Goal Component
function Goal({ position, cellSize, mazeSize }: { position: { x: number; y: number }; cellSize: number; mazeSize: number }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime;
    }
  });

  return (
    <group position={[
      (position.x - mazeSize / 2) * cellSize,
      0.8,
      (position.y - mazeSize / 2) * cellSize
    ]}>
      <mesh ref={ref}>
        <torusGeometry args={[0.5, 0.1, 16, 32]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} metalness={0.8} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial color="#22c55e" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#22c55e" intensity={1} distance={5} />
      <Sparkles count={20} scale={2} size={3} color="#22c55e" />
    </group>
  );
}

// Camera Controller
function CameraController({ playerPos, cellSize, mazeSize, viewMode }: { playerPos: { x: number; y: number }; cellSize: number; mazeSize: number; viewMode: "top" | "follow" }) {
  const { camera } = useThree();
  
  useFrame(() => {
    const targetX = (playerPos.x - mazeSize / 2) * cellSize;
    const targetZ = (playerPos.y - mazeSize / 2) * cellSize;
    
    if (viewMode === "follow") {
      camera.position.lerp(new THREE.Vector3(targetX, 8, targetZ + 10), 0.05);
      camera.lookAt(targetX, 0, targetZ);
    } else {
      camera.position.lerp(new THREE.Vector3(0, mazeSize * 1.5, 0.1), 0.05);
      camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

export function MazeRunner3D({ level = 1, difficultyMultiplier = 1, onLevelComplete, onBack }: MazeRunner3DProps) {
  const mazeSize = Math.min(7 + level * 2, 21);
  const coinCount = Math.min(3 + level, 10);
  const timeLimit = Math.max(120 - level * 5, 60);
  const cellSize = 2;
  
  const [maze, setMaze] = useState<boolean[][]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 });
  const [coins, setCoins] = useState<{ x: number; y: number }[]>([]);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<"playing" | "won" | "lost">("playing");
  const [viewMode, setViewMode] = useState<"top" | "follow">("top");

  // Generate coins
  const generateCoins = useCallback((maze: boolean[][], count: number) => {
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
  }, []);

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
  }, [mazeSize, coinCount, timeLimit, generateCoins]);

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
        setScore(prev => prev + timeBonus + 500);
        setGameState("won");
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        setTimeout(() => onLevelComplete?.(), 1500);
      }
      
      return { x: newX, y: newY };
    });
  }, [gameState, maze, mazeSize, coins, timeLeft, onLevelComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp": case "w": case "W": e.preventDefault(); movePlayer(0, -1); break;
        case "ArrowDown": case "s": case "S": e.preventDefault(); movePlayer(0, 1); break;
        case "ArrowLeft": case "a": case "A": e.preventDefault(); movePlayer(-1, 0); break;
        case "ArrowRight": case "d": case "D": e.preventDefault(); movePlayer(1, 0); break;
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [movePlayer]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Header */}
      <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
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
        <Button variant="ghost" size="icon" onClick={() => setViewMode(v => v === "top" ? "follow" : "top")}>
          <Eye className="w-5 h-5" />
        </Button>
      </div>

      {/* 3D Canvas */}
      <Canvas shadows className="rounded-lg">
        <PerspectiveCamera makeDefault position={[0, mazeSize * 1.5, 0.1]} />
        <CameraController playerPos={playerPos} cellSize={cellSize} mazeSize={mazeSize} viewMode={viewMode} />
        
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 20, 10]} intensity={0.5} castShadow />
        <pointLight position={[0, 10, 0]} intensity={0.3} color="#4a90d9" />
        
        <fog attach="fog" args={["#0a0e1a", 10, 50]} />
        
        {maze.length > 0 && (
          <>
            <Maze3D maze={maze} cellSize={cellSize} />
            <Player position={playerPos} cellSize={cellSize} mazeSize={mazeSize} />
            {coins.map((coin, i) => (
              <Coin 
                key={i} 
                position={coin} 
                cellSize={cellSize} 
                mazeSize={mazeSize}
                onClick={() => {}}
              />
            ))}
            <Goal position={{ x: mazeSize - 2, y: mazeSize - 2 }} cellSize={cellSize} mazeSize={mazeSize} />
          </>
        )}
      </Canvas>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 grid grid-cols-3 gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
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
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-20"
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
    </div>
  );
}

export default MazeRunner3D;
