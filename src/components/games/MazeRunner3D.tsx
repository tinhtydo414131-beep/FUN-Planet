import { useRef, useState, useCallback, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  Html,
  useProgress,
  Float,
  Sparkles,
  Stars,
  useKeyboardControls
} from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Game3DHUD, Game3DTutorial, Game3DGameOver } from "./3d/Game3DUI";
import { haptics } from "@/utils/haptics";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight as ArrowRightIcon } from "lucide-react";

interface MazeRunner3DProps {
  level?: number;
  onLevelComplete?: () => void;
  onBack?: () => void;
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white text-sm">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// Generate maze
function generateMaze(size: number): boolean[][] {
  const maze: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  for (let i = 0; i < size; i++) {
    maze[0][i] = true;
    maze[size - 1][i] = true;
    maze[i][0] = true;
    maze[i][size - 1] = true;
  }
  
  for (let y = 2; y < size - 2; y += 2) {
    for (let x = 2; x < size - 2; x += 2) {
      maze[y][x] = true;
      const dir = Math.floor(Math.random() * 4);
      if (dir === 0 && y > 1) maze[y - 1][x] = true;
      if (dir === 1 && y < size - 2) maze[y + 1][x] = true;
      if (dir === 2 && x > 1) maze[y][x - 1] = true;
      if (dir === 3 && x < size - 2) maze[y][x + 1] = true;
    }
  }
  
  maze[1][1] = false;
  maze[size - 2][size - 2] = false;
  
  return maze;
}

// Wall component
function Wall({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, 2.5, 1]} />
      <meshStandardMaterial 
        color="#2d3a4f"
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

// Player character
function Player({ 
  position, 
  targetPosition,
  onMove 
}: { 
  position: [number, number, number];
  targetPosition: [number, number, number];
  onMove: (dir: string) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (ref.current) {
      currentPos.current.lerp(new THREE.Vector3(...targetPosition), 0.15);
      ref.current.position.copy(currentPos.current);
      ref.current.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.1;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <capsuleGeometry args={[0.25, 0.4, 4, 8]} />
        <meshStandardMaterial 
          color="#4ECDC4"
          metalness={0.3}
          roughness={0.6}
          emissive="#4ECDC4"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.07, 0.55, 0.15]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#333" />
      </mesh>
      <mesh position={[0.07, 0.55, 0.15]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#333" />
      </mesh>
      <pointLight color="#4ECDC4" intensity={0.5} distance={3} />
    </group>
  );
}

// Collectible coin
function Coin({ position, onCollect }: { position: [number, number, number]; onCollect: () => void }) {
  const [collected, setCollected] = useState(false);
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current && !collected) {
      ref.current.rotation.y = state.clock.elapsedTime * 3;
    }
  });

  if (collected) return null;

  return (
    <Float speed={4} rotationIntensity={0.5} floatIntensity={0.3}>
      <mesh
        ref={ref}
        position={position}
        onClick={() => {
          setCollected(true);
          onCollect();
        }}
        castShadow
      >
        <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
        <meshStandardMaterial 
          color="#ffd700"
          metalness={0.9}
          roughness={0.1}
          emissive="#ffd700"
          emissiveIntensity={0.3}
        />
      </mesh>
      <Sparkles position={position} count={5} scale={0.8} size={2} color="#ffd700" />
    </Float>
  );
}

// Goal portal
function Goal({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime;
    }
  });

  return (
    <group position={position}>
      <mesh ref={ref}>
        <torusGeometry args={[0.5, 0.08, 16, 32]} />
        <meshStandardMaterial 
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.5}
          metalness={0.8}
        />
      </mesh>
      <mesh>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial 
          color="#22c55e"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight color="#22c55e" intensity={1} distance={5} />
      <Sparkles count={20} scale={2} size={3} color="#22c55e" />
    </group>
  );
}

// Ghost enemy
function Ghost({ position, speed = 0.02 }: { position: [number, number, number]; speed?: number }) {
  const ref = useRef<THREE.Group>(null);
  const [offset] = useState(() => Math.random() * Math.PI * 2);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + offset) * 0.3;
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime + offset) * 0.3;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.4, 4, 8]} />
        <meshStandardMaterial 
          color="#8b5cf6"
          transparent
          opacity={0.7}
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[-0.1, 0.2, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[0.1, 0.2, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <pointLight color="#8b5cf6" intensity={0.5} distance={3} />
    </group>
  );
}

// Camera follow
function CameraFollow({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  
  useFrame(() => {
    camera.position.lerp(
      new THREE.Vector3(target[0], target[1] + 8, target[2] + 6),
      0.05
    );
    camera.lookAt(target[0], target[1], target[2]);
  });
  
  return null;
}

// Game scene
function MazeScene({
  maze,
  playerPos,
  coins,
  ghosts,
  goalPos,
  onCoinCollect,
  onMove,
  cellSize
}: {
  maze: boolean[][];
  playerPos: [number, number, number];
  coins: [number, number, number][];
  ghosts: [number, number, number][];
  goalPos: [number, number, number];
  onCoinCollect: (index: number) => void;
  onMove: (dir: string) => void;
  cellSize: number;
}) {
  const walls = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x]) {
          positions.push([
            (x - maze[y].length / 2) * cellSize,
            1.25,
            (y - maze.length / 2) * cellSize
          ]);
        }
      }
    }
    return positions;
  }, [maze, cellSize]);

  return (
    <>
      <CameraFollow target={playerPos} />
      
      <Environment preset="night" background={false} />
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[10, 15, 10]} 
        intensity={0.5} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[0, 10, 0]} intensity={0.3} color="#4a90d9" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[maze[0].length * cellSize + 4, maze.length * cellSize + 4]} />
        <meshStandardMaterial color="#1a1f2e" roughness={0.9} />
      </mesh>

      {/* Walls */}
      {walls.map((pos, i) => (
        <Wall key={i} position={pos} />
      ))}

      {/* Player */}
      <Player position={playerPos} targetPosition={playerPos} onMove={onMove} />

      {/* Coins */}
      {coins.map((pos, i) => (
        <Coin key={i} position={pos} onCollect={() => onCoinCollect(i)} />
      ))}

      {/* Ghosts */}
      {ghosts.map((pos, i) => (
        <Ghost key={i} position={pos} />
      ))}

      {/* Goal */}
      <Goal position={goalPos} />

      {/* Stars background */}
      <Stars radius={100} depth={50} count={1000} factor={4} fade />

      {/* Fog */}
      <fog attach="fog" args={["#0a0e1a", 5, 30]} />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.4}
        scale={maze[0].length * cellSize + 4}
        blur={2}
        far={4}
      />
    </>
  );
}

export function MazeRunner3D({ level = 1, onLevelComplete, onBack }: MazeRunner3DProps) {
  const mazeSize = 9 + level * 2;
  const cellSize = 1;
  const coinCount = 3 + level;
  const ghostCount = Math.floor(level / 2);

  const [maze, setMaze] = useState(() => generateMaze(mazeSize));
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([
    (1 - mazeSize / 2) * cellSize, 0.5, (1 - mazeSize / 2) * cellSize
  ]);
  const [goalPos] = useState<[number, number, number]>([
    (mazeSize - 2 - mazeSize / 2) * cellSize, 0.5, (mazeSize - 2 - mazeSize / 2) * cellSize
  ]);
  
  const generateCoins = useCallback(() => {
    const coins: [number, number, number][] = [];
    for (let i = 0; i < coinCount; i++) {
      let x, z;
      do {
        x = Math.floor(Math.random() * (mazeSize - 2)) + 1;
        z = Math.floor(Math.random() * (mazeSize - 2)) + 1;
      } while (maze[z]?.[x] || (x === 1 && z === 1) || (x === mazeSize - 2 && z === mazeSize - 2));
      
      coins.push([
        (x - mazeSize / 2) * cellSize,
        0.5,
        (z - mazeSize / 2) * cellSize
      ]);
    }
    return coins;
  }, [maze, mazeSize, cellSize, coinCount]);

  const generateGhosts = useCallback(() => {
    const ghosts: [number, number, number][] = [];
    for (let i = 0; i < ghostCount; i++) {
      let x, z;
      do {
        x = Math.floor(Math.random() * (mazeSize - 4)) + 2;
        z = Math.floor(Math.random() * (mazeSize - 4)) + 2;
      } while (maze[z]?.[x]);
      
      ghosts.push([
        (x - mazeSize / 2) * cellSize,
        0.8,
        (z - mazeSize / 2) * cellSize
      ]);
    }
    return ghosts;
  }, [maze, mazeSize, cellSize, ghostCount]);

  const [coins, setCoins] = useState<[number, number, number][]>([]);
  const [ghosts, setGhosts] = useState<[number, number, number][]>([]);
  const [collectedCoins, setCollectedCoins] = useState(0);
  const [score, setScore] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 + level * 15);

  useEffect(() => {
    const shown = localStorage.getItem("mazerunner3d_tutorial");
    if (shown) setShowTutorial(false);
  }, []);

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsWin(false);
          setShowGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  // Check win condition
  useEffect(() => {
    if (!isPlaying) return;
    
    const px = Math.round(playerPos[0] / cellSize + mazeSize / 2);
    const pz = Math.round(playerPos[2] / cellSize + mazeSize / 2);
    
    if (px === mazeSize - 2 && pz === mazeSize - 2) {
      toast.success("🎉 Level hoàn thành!");
      haptics.success();
      setIsWin(true);
      setShowGameOver(true);
      setIsPlaying(false);
      onLevelComplete?.();
    }
  }, [playerPos, isPlaying, mazeSize, cellSize, onLevelComplete]);

  const handleMove = useCallback((dir: string) => {
    if (!isPlaying) return;
    
    setPlayerPos(prev => {
      const newPos: [number, number, number] = [...prev];
      let dx = 0, dz = 0;
      
      switch (dir) {
        case "up": dz = -cellSize; break;
        case "down": dz = cellSize; break;
        case "left": dx = -cellSize; break;
        case "right": dx = cellSize; break;
      }
      
      const newX = Math.round((prev[0] + dx) / cellSize + mazeSize / 2);
      const newZ = Math.round((prev[2] + dz) / cellSize + mazeSize / 2);
      
      if (newX >= 0 && newX < mazeSize && newZ >= 0 && newZ < mazeSize && !maze[newZ]?.[newX]) {
        newPos[0] = prev[0] + dx;
        newPos[2] = prev[2] + dz;
        haptics.light();
      }
      
      return newPos;
    });
  }, [isPlaying, maze, mazeSize, cellSize]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case "ArrowUp": case "w": case "W": handleMove("up"); break;
        case "ArrowDown": case "s": case "S": handleMove("down"); break;
        case "ArrowLeft": case "a": case "A": handleMove("left"); break;
        case "ArrowRight": case "d": case "D": handleMove("right"); break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying, handleMove]);

  const handleCoinCollect = (index: number) => {
    setCoins(c => c.filter((_, i) => i !== index));
    setCollectedCoins(c => c + 1);
    setScore(s => s + 100);
    setEarnedCoins(c => c + 50);
    haptics.success();
    toast.success("+100 🪙");
  };

  const startGame = () => {
    const newMaze = generateMaze(mazeSize);
    setMaze(newMaze);
    setPlayerPos([(1 - mazeSize / 2) * cellSize, 0.5, (1 - mazeSize / 2) * cellSize]);
    setCoins(generateCoins());
    setGhosts(generateGhosts());
    setCollectedCoins(0);
    setScore(0);
    setEarnedCoins(0);
    setLives(3);
    setTimeLeft(60 + level * 15);
    setIsPlaying(true);
    setShowGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {showTutorial && (
        <Game3DTutorial
          isOpen={showTutorial}
          onClose={() => {
            localStorage.setItem("mazerunner3d_tutorial", "true");
            setShowTutorial(false);
          }}
          onStart={() => {
            localStorage.setItem("mazerunner3d_tutorial", "true");
            setShowTutorial(false);
            startGame();
          }}
          gameTitle="Mê Cung 3D"
          gameIcon="🏃"
          howToPlay={[
            "WASD/Mũi tên để di chuyển",
            "Thu thập coins 🪙 trên đường",
            "Tránh ma 👻 và tìm đường ra",
            "Đến cổng xanh ✨ để hoàn thành"
          ]}
          objectives={[
            "Thoát khỏi mê cung",
            "Thu thập nhiều coins",
            "Hoàn thành trước khi hết giờ"
          ]}
          rewards={{ perLevel: 5000, firstPlay: 10000, combo: 2000 }}
        />
      )}

      {showGameOver && (
        <Game3DGameOver
          isOpen={showGameOver}
          onClose={() => setShowGameOver(false)}
          onRestart={startGame}
          onHome={() => onBack?.()}
          isWin={isWin}
          score={score}
          coinsEarned={earnedCoins}
          level={level}
          stats={[
            { label: "Coins thu", value: collectedCoins },
            { label: "Thời gian", value: `${60 + level * 15 - timeLeft}s` },
          ]}
        />
      )}

      <div className="relative w-full aspect-video max-w-[700px] rounded-xl overflow-hidden bg-gradient-to-b from-indigo-900 to-slate-950">
        {isPlaying && (
          <Game3DHUD
            score={score}
            level={level}
            lives={lives}
            maxLives={3}
            coins={earnedCoins}
            targetScore={coinCount * 100}
            timeLeft={timeLeft}
          />
        )}
        
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 10, 10], fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <MazeScene
              maze={maze}
              playerPos={playerPos}
              coins={coins}
              ghosts={ghosts}
              goalPos={goalPos}
              onCoinCollect={handleCoinCollect}
              onMove={handleMove}
              cellSize={cellSize}
            />
          </Suspense>
        </Canvas>
        
        {!isPlaying && !showTutorial && !showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🏃</div>
              <h2 className="text-2xl font-bold text-white mb-2">Mê Cung 3D</h2>
              <p className="text-white/70 mb-4">Level {level}</p>
              <Button onClick={startGame} size="lg" className="bg-indigo-500 hover:bg-indigo-600">
                Bắt đầu
              </Button>
            </motion.div>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 touch-manipulation active:scale-95"
          onTouchStart={(e) => { e.preventDefault(); handleMove("up"); }}
          disabled={!isPlaying}
        >
          <ArrowUp className="h-7 w-7" />
        </Button>
        <div />
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 touch-manipulation active:scale-95"
          onTouchStart={(e) => { e.preventDefault(); handleMove("left"); }}
          disabled={!isPlaying}
        >
          <ArrowLeft className="h-7 w-7" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 touch-manipulation active:scale-95"
          onTouchStart={(e) => { e.preventDefault(); handleMove("down"); }}
          disabled={!isPlaying}
        >
          <ArrowDown className="h-7 w-7" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 touch-manipulation active:scale-95"
          onTouchStart={(e) => { e.preventDefault(); handleMove("right"); }}
          disabled={!isPlaying}
        >
          <ArrowRightIcon className="h-7 w-7" />
        </Button>
      </div>

      <div className="flex gap-3">
        {onBack && (
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        )}
        {!showTutorial && (
          <Button onClick={startGame} className="bg-gradient-to-r from-indigo-500 to-purple-500">
            {isPlaying ? "Chơi lại" : "Bắt đầu"} 🏃
          </Button>
        )}
      </div>
    </div>
  );
}

export default MazeRunner3D;
