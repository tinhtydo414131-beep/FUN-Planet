import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  Html,
  useProgress,
  AdaptiveDpr,
  Float,
  Sparkles,
  Text3D,
  Center
} from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Game3DHUD, Game3DTutorial, Game3DGameOver } from "./3d/Game3DUI";
import { SimpleCharacter } from "./3d/ReadyPlayerMeAvatar";
import { haptics } from "@/utils/haptics";
import { toast } from "sonner";

interface Snake3DProps {
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
            className="h-full bg-gradient-to-r from-green-400 to-emerald-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white text-sm">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// 3D Snake segment
function SnakeSegment({ 
  position, 
  isHead = false,
  color = "#22c55e"
}: { 
  position: [number, number, number];
  isHead?: boolean;
  color?: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current && isHead) {
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 4) * 0.05);
    }
  });

  return (
    <mesh ref={ref} position={position} castShadow>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial 
        color={color}
        metalness={0.3}
        roughness={0.6}
        emissive={isHead ? color : undefined}
        emissiveIntensity={isHead ? 0.2 : 0}
      />
      {isHead && (
        <>
          {/* Eyes */}
          <mesh position={[-0.15, 0.2, 0.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <mesh position={[0.15, 0.2, 0.3]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>
          <mesh position={[-0.15, 0.2, 0.35]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="black" />
          </mesh>
          <mesh position={[0.15, 0.2, 0.35]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="black" />
          </mesh>
        </>
      )}
    </mesh>
  );
}

// 3D Apple
function Apple3D({ position, onClick }: { position: [number, number, number]; onClick?: () => void }) {
  return (
    <Float speed={3} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={position} onClick={onClick}>
        <mesh castShadow>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial 
            color="#ef4444"
            metalness={0.2}
            roughness={0.3}
            emissive="#ef4444"
            emissiveIntensity={0.1}
          />
        </mesh>
        {/* Stem */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.15]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Leaf */}
        <mesh position={[0.1, 0.45, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.15, 0.02, 0.1]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        <Sparkles count={5} scale={1} size={2} color="#ffd700" />
      </group>
    </Float>
  );
}

// Power-up 3D
function PowerUp3D({ 
  position, 
  type,
  onClick 
}: { 
  position: [number, number, number];
  type: "shield" | "speed" | "double";
  onClick?: () => void;
}) {
  const colors = {
    shield: "#3b82f6",
    speed: "#eab308",
    double: "#a855f7"
  };
  
  const emojis = {
    shield: "🛡️",
    speed: "⚡",
    double: "✨"
  };

  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={0.5}>
      <group position={position} onClick={onClick}>
        <mesh castShadow>
          <octahedronGeometry args={[0.4, 0]} />
          <meshStandardMaterial 
            color={colors[type]}
            metalness={0.8}
            roughness={0.2}
            transparent
            opacity={0.8}
            emissive={colors[type]}
            emissiveIntensity={0.3}
          />
        </mesh>
        <pointLight color={colors[type]} intensity={0.5} distance={3} />
        <Sparkles count={10} scale={1.5} size={3} color={colors[type]} />
      </group>
    </Float>
  );
}

// Ground grid
function GameGround({ gridSize = 15 }: { gridSize?: number }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[gridSize / 2 - 0.5, -0.5, gridSize / 2 - 0.5]} receiveShadow>
        <planeGeometry args={[gridSize + 2, gridSize + 2]} />
        <meshStandardMaterial color="#1a472a" roughness={0.9} />
      </mesh>
      
      {/* Grid lines */}
      {Array.from({ length: gridSize + 1 }).map((_, i) => (
        <group key={i}>
          <mesh position={[i, -0.49, gridSize / 2 - 0.5]}>
            <boxGeometry args={[0.02, 0.01, gridSize]} />
            <meshBasicMaterial color="#2d5a3d" transparent opacity={0.5} />
          </mesh>
          <mesh position={[gridSize / 2 - 0.5, -0.49, i]}>
            <boxGeometry args={[gridSize, 0.01, 0.02]} />
            <meshBasicMaterial color="#2d5a3d" transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

// Camera follow
function CameraRig({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  
  useFrame(() => {
    camera.position.lerp(
      new THREE.Vector3(target[0], target[1] + 10, target[2] + 8),
      0.05
    );
    camera.lookAt(target[0], target[1], target[2]);
  });
  
  return null;
}

// Main 3D Snake Game Scene
function SnakeGameScene({
  snake,
  food,
  powerUp,
  gridSize,
  isPaused,
}: {
  snake: [number, number, number][];
  food: [number, number, number];
  powerUp: { position: [number, number, number]; type: "shield" | "speed" | "double" } | null;
  gridSize: number;
  isPaused: boolean;
}) {
  return (
    <>
      <CameraRig target={snake[0] || [gridSize / 2, 0, gridSize / 2]} />
      
      {/* Environment */}
      <Environment preset="forest" background={false} />
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[10, 15, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Ground */}
      <GameGround gridSize={gridSize} />
      
      {/* Snake */}
      {snake.map((pos, i) => (
        <SnakeSegment 
          key={i} 
          position={pos} 
          isHead={i === 0}
          color={i === 0 ? "#16a34a" : "#22c55e"}
        />
      ))}
      
      {/* Food */}
      <Apple3D position={food} />
      
      {/* Power-up */}
      {powerUp && (
        <PowerUp3D position={powerUp.position} type={powerUp.type} />
      )}
      
      {/* Shadows */}
      <ContactShadows
        position={[gridSize / 2 - 0.5, -0.48, gridSize / 2 - 0.5]}
        opacity={0.4}
        scale={gridSize + 4}
        blur={2}
        far={4}
      />
      
      {/* Fog */}
      <fog attach="fog" args={["#0a1f0a", 10, 40]} />
    </>
  );
}

export function Snake3D({ level = 1, onLevelComplete, onBack }: Snake3DProps) {
  const gridSize = 15;
  const initialSpeed = Math.max(150, 300 - (level * 20));
  const targetScore = level * 5;

  const [snake, setSnake] = useState<[number, number, number][]>([[7, 0, 7]]);
  const [food, setFood] = useState<[number, number, number]>([5, 0, 5]);
  const [direction, setDirection] = useState<"UP" | "DOWN" | "LEFT" | "RIGHT">("RIGHT");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [powerUp, setPowerUp] = useState<{ position: [number, number, number]; type: "shield" | "speed" | "double" } | null>(null);
  const [activePower, setActivePower] = useState<string | null>(null);
  
  const directionRef = useRef(direction);
  const lastEatTime = useRef(Date.now());

  useEffect(() => {
    const tutorialShown = localStorage.getItem("snake3d_tutorial_shown");
    if (tutorialShown) setShowTutorial(false);
  }, []);

  const generateFood = useCallback((): [number, number, number] => {
    let newFood: [number, number, number];
    do {
      newFood = [
        Math.floor(Math.random() * gridSize),
        0,
        Math.floor(Math.random() * gridSize)
      ];
    } while (snake.some(s => s[0] === newFood[0] && s[2] === newFood[2]));
    return newFood;
  }, [snake, gridSize]);

  const spawnPowerUp = useCallback(() => {
    if (powerUp || Math.random() > 0.2) return;
    
    const types: ("shield" | "speed" | "double")[] = ["shield", "speed", "double"];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let pos: [number, number, number];
    do {
      pos = [Math.floor(Math.random() * gridSize), 0, Math.floor(Math.random() * gridSize)];
    } while (
      snake.some(s => s[0] === pos[0] && s[2] === pos[2]) ||
      (food[0] === pos[0] && food[2] === pos[2])
    );
    
    setPowerUp({ position: pos, type });
    setTimeout(() => setPowerUp(null), 8000);
  }, [snake, food, powerUp, gridSize]);

  const resetGame = () => {
    setSnake([[7, 0, 7]]);
    setFood([5, 0, 5]);
    setDirection("RIGHT");
    directionRef.current = "RIGHT";
    setScore(0);
    setCoins(0);
    setCombo(0);
    setLives(3);
    setIsPlaying(false);
    setIsPaused(false);
    setShowGameOver(false);
    setPowerUp(null);
    setActivePower(null);
  };

  const startGame = () => {
    resetGame();
    setIsPlaying(true);
  };

  // Movement and game loop
  useEffect(() => {
    if (!isPlaying || isPaused) return;

    const moveSnake = () => {
      setSnake(prev => {
        const head = [...prev[0]] as [number, number, number];
        const dir = directionRef.current;
        
        switch (dir) {
          case "UP": head[2] -= 1; break;
          case "DOWN": head[2] += 1; break;
          case "LEFT": head[0] -= 1; break;
          case "RIGHT": head[0] += 1; break;
        }

        // Wall collision
        if (head[0] < 0 || head[0] >= gridSize || head[2] < 0 || head[2] >= gridSize) {
          if (activePower !== "shield") {
            handleDeath();
            return prev;
          }
          head[0] = (head[0] + gridSize) % gridSize;
          head[2] = (head[2] + gridSize) % gridSize;
        }

        // Self collision
        if (prev.some(s => s[0] === head[0] && s[2] === head[2])) {
          if (activePower !== "shield") {
            handleDeath();
            return prev;
          }
        }

        const newSnake = [head, ...prev];

        // Food collision
        if (head[0] === food[0] && head[2] === food[2]) {
          const now = Date.now();
          const timeSince = now - lastEatTime.current;
          
          if (timeSince < 3000) {
            setCombo(c => c + 1);
          } else {
            setCombo(1);
          }
          lastEatTime.current = now;
          
          const points = activePower === "double" ? 2 : 1;
          setScore(s => {
            const newScore = s + points;
            if (newScore >= targetScore) {
              toast.success("🎉 Level hoàn thành!");
              haptics.success();
              setIsWin(true);
              setShowGameOver(true);
              setIsPlaying(false);
              onLevelComplete?.();
            }
            return newScore;
          });
          setCoins(c => c + points * 100);
          setFood(generateFood());
          spawnPowerUp();
          haptics.light();
          
          return newSnake;
        } else {
          newSnake.pop();
        }

        // Power-up collision
        if (powerUp && head[0] === powerUp.position[0] && head[2] === powerUp.position[2]) {
          setActivePower(powerUp.type);
          setPowerUp(null);
          toast.success(`✨ ${powerUp.type}!`);
          haptics.success();
          setTimeout(() => setActivePower(null), 5000);
        }

        return newSnake;
      });
    };

    const speed = activePower === "speed" ? initialSpeed * 0.6 : initialSpeed;
    const interval = setInterval(moveSnake, speed);
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, food, generateFood, initialSpeed, activePower, targetScore, powerUp, spawnPowerUp, onLevelComplete]);

  const handleDeath = () => {
    haptics.error();
    if (lives > 1) {
      setLives(l => l - 1);
      setSnake([[7, 0, 7]]);
      setDirection("RIGHT");
      directionRef.current = "RIGHT";
      setCombo(0);
      toast.error(`💔 Mất mạng! Còn ${lives - 1}`);
    } else {
      setIsWin(false);
      setShowGameOver(true);
      setIsPlaying(false);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused) return;
      const dir = directionRef.current;
      
      switch (e.key) {
        case "ArrowUp": case "w": case "W":
          if (dir !== "DOWN") { setDirection("UP"); directionRef.current = "UP"; }
          break;
        case "ArrowDown": case "s": case "S":
          if (dir !== "UP") { setDirection("DOWN"); directionRef.current = "DOWN"; }
          break;
        case "ArrowLeft": case "a": case "A":
          if (dir !== "RIGHT") { setDirection("LEFT"); directionRef.current = "LEFT"; }
          break;
        case "ArrowRight": case "d": case "D":
          if (dir !== "LEFT") { setDirection("RIGHT"); directionRef.current = "RIGHT"; }
          break;
        case " ":
          setIsPaused(p => !p);
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying, isPaused]);

  const handleDirection = (dir: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
    if (!isPlaying || isPaused) return;
    const current = directionRef.current;
    
    if (
      (dir === "UP" && current !== "DOWN") ||
      (dir === "DOWN" && current !== "UP") ||
      (dir === "LEFT" && current !== "RIGHT") ||
      (dir === "RIGHT" && current !== "LEFT")
    ) {
      setDirection(dir);
      directionRef.current = dir;
      haptics.light();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {/* Tutorial */}
      {showTutorial && (
        <Game3DTutorial
          isOpen={showTutorial}
          onClose={() => {
            localStorage.setItem("snake3d_tutorial_shown", "true");
            setShowTutorial(false);
          }}
          onStart={() => {
            localStorage.setItem("snake3d_tutorial_shown", "true");
            setShowTutorial(false);
            startGame();
          }}
          gameTitle="Rắn Săn Mồi 3D"
          gameIcon="🐍"
          howToPlay={[
            "Dùng WASD/mũi tên để di chuyển rắn",
            "Ăn táo 🍎 để ghi điểm và lớn lên",
            "Tránh đâm vào tường và thân",
            "Thu thập power-up để có sức mạnh"
          ]}
          objectives={[
            `Đạt ${targetScore} điểm để qua level`,
            "Tạo combo ăn liên tục",
            "Sống sót với 3 mạng"
          ]}
          rewards={{ perLevel: 5000, firstPlay: 10000, combo: 2000 }}
        />
      )}

      {/* Game Over */}
      {showGameOver && (
        <Game3DGameOver
          isOpen={showGameOver}
          onClose={() => setShowGameOver(false)}
          onRestart={startGame}
          onHome={() => onBack?.()}
          isWin={isWin}
          score={score}
          coinsEarned={coins}
          level={level}
          stats={[
            { label: "Độ dài", value: snake.length },
            { label: "Combo", value: combo },
          ]}
        />
      )}

      {/* 3D Canvas */}
      <div className="relative w-full aspect-square max-w-[500px] rounded-xl overflow-hidden bg-gradient-to-b from-green-900 to-green-950">
        {isPlaying && (
          <Game3DHUD
            score={score}
            level={level}
            lives={lives}
            maxLives={3}
            coins={coins}
            combo={combo}
            targetScore={targetScore}
            isPaused={isPaused}
            onPause={() => setIsPaused(true)}
            onResume={() => setIsPaused(false)}
          />
        )}
        
        <Canvas shadows dpr={[1, 2]} camera={{ position: [7, 15, 15], fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <SnakeGameScene
              snake={snake}
              food={food}
              powerUp={powerUp}
              gridSize={gridSize}
              isPaused={isPaused}
            />
          </Suspense>
        </Canvas>
        
        {/* Start overlay */}
        {!isPlaying && !showTutorial && !showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <div className="text-6xl mb-4">🐍</div>
              <h2 className="text-2xl font-bold text-white mb-2">Rắn Săn Mồi 3D</h2>
              <p className="text-white/70 mb-4">Level {level}</p>
              <Button onClick={startGame} size="lg" className="bg-green-500 hover:bg-green-600">
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
          onTouchStart={(e) => { e.preventDefault(); handleDirection("UP"); }}
          disabled={!isPlaying || isPaused}
        >
          <ArrowUp className="h-7 w-7" />
        </Button>
        <div />
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 touch-manipulation active:scale-95"
          onTouchStart={(e) => { e.preventDefault(); handleDirection("LEFT"); }}
          disabled={!isPlaying || isPaused}
        >
          <ArrowLeft className="h-7 w-7" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 touch-manipulation active:scale-95"
          onTouchStart={(e) => { e.preventDefault(); handleDirection("DOWN"); }}
          disabled={!isPlaying || isPaused}
        >
          <ArrowDown className="h-7 w-7" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-14 w-14 touch-manipulation active:scale-95"
          onTouchStart={(e) => { e.preventDefault(); handleDirection("RIGHT"); }}
          disabled={!isPlaying || isPaused}
        >
          <ArrowRight className="h-7 w-7" />
        </Button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {onBack && (
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        )}
        {!showTutorial && (
          <Button onClick={startGame} className="bg-gradient-to-r from-green-500 to-emerald-500">
            {isPlaying ? "Chơi lại" : "Bắt đầu"} 🐍
          </Button>
        )}
      </div>
    </div>
  );
}

export default Snake3D;
