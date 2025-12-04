import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Html, useProgress, Float, Sparkles, Sky } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Game3DHUD, Game3DTutorial, Game3DGameOver } from "./3d/Game3DUI";
import { haptics } from "@/utils/haptics";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight as ArrowRightIcon } from "lucide-react";

interface Platformer3DProps {
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
          <div className="h-full bg-gradient-to-r from-green-400 to-cyan-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-white text-sm">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// Platform
function Platform({ position, size = [2, 0.3, 2], color = "#4ade80" }: { position: [number, number, number]; size?: [number, number, number]; color?: string }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  );
}

// Moving platform
function MovingPlatform({ position, range = 3, speed = 1, axis = "x" }: { position: [number, number, number]; range?: number; speed?: number; axis?: "x" | "z" }) {
  const ref = useRef<THREE.Mesh>(null);
  const startPos = useRef(position);

  useFrame((state) => {
    if (ref.current) {
      const offset = Math.sin(state.clock.elapsedTime * speed) * range;
      if (axis === "x") ref.current.position.x = startPos.current[0] + offset;
      else ref.current.position.z = startPos.current[2] + offset;
    }
  });

  return (
    <mesh ref={ref} position={position} castShadow receiveShadow>
      <boxGeometry args={[2.5, 0.3, 2]} />
      <meshStandardMaterial color="#f59e0b" roughness={0.7} emissive="#f59e0b" emissiveIntensity={0.1} />
    </mesh>
  );
}

// Coin
function PlatformCoin({ position, onCollect }: { position: [number, number, number]; onCollect: () => void }) {
  const [collected, setCollected] = useState(false);
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current && !collected) ref.current.rotation.y = state.clock.elapsedTime * 3;
  });

  if (collected) return null;

  return (
    <Float speed={4} floatIntensity={0.3}>
      <mesh ref={ref} position={position} onClick={() => { setCollected(true); onCollect(); }}>
        <cylinderGeometry args={[0.25, 0.25, 0.08, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#ffd700" emissiveIntensity={0.3} />
      </mesh>
      <Sparkles position={position} count={5} scale={0.8} size={3} color="#ffd700" />
    </Float>
  );
}

// Goal flag
function GoalFlag({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.05, 0.05, 3]} />
        <meshStandardMaterial color="#666" metalness={0.8} />
      </mesh>
      <mesh ref={ref} position={[0.4, 1, 0]}>
        <boxGeometry args={[0.8, 0.5, 0.02]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
      <Sparkles position={[0, 1.5, 0]} count={20} scale={2} size={4} color="#22c55e" />
      <pointLight position={[0, 1.5, 0]} color="#22c55e" intensity={1} distance={5} />
    </group>
  );
}

// Player character
function PlatformPlayer({ position, isJumping, velocity }: { position: [number, number, number]; isJumping: boolean; velocity: THREE.Vector3 }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(...position);
      // Squash and stretch
      const squash = isJumping ? (velocity.y > 0 ? 1.2 : 0.8) : 1;
      ref.current.scale.set(1 / squash, squash, 1 / squash);
    }
  });

  return (
    <group ref={ref}>
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.4, 4, 8]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.08, 0.55, 0.2]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color="#333" /></mesh>
      <mesh position={[0.08, 0.55, 0.2]}><sphereGeometry args={[0.05, 8, 8]} /><meshBasicMaterial color="#333" /></mesh>
      {isJumping && <Sparkles position={[0, -0.5, 0]} count={5} scale={1} size={3} color="#3b82f6" />}
    </group>
  );
}

// Camera follow
function CameraFollow({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(target[0], target[1] + 5, target[2] + 10), 0.05);
    camera.lookAt(target[0], target[1], target[2]);
  });
  return null;
}

// Generate level platforms
function generateLevel(level: number) {
  const platforms: { position: [number, number, number]; size?: [number, number, number]; moving?: boolean; axis?: "x" | "z" }[] = [];
  const coins: [number, number, number][] = [];
  
  // Start platform
  platforms.push({ position: [0, 0, 0], size: [4, 0.5, 4] });
  
  let x = 0, y = 0, z = -4;
  const numPlatforms = 8 + level * 2;
  
  for (let i = 0; i < numPlatforms; i++) {
    x += (Math.random() - 0.5) * 3;
    y += Math.random() * 0.5 - 0.1;
    z -= 3 + Math.random() * 2;
    
    const isMoving = Math.random() < 0.2 + level * 0.05;
    platforms.push({
      position: [x, y, z],
      moving: isMoving,
      axis: Math.random() > 0.5 ? "x" : "z"
    });
    
    // Add coin above platform
    if (Math.random() < 0.7) {
      coins.push([x, y + 1.5, z]);
    }
  }
  
  // Goal platform
  platforms.push({ position: [x, y, z - 4], size: [3, 0.5, 3] });
  
  return { platforms, coins, goalPos: [x, y + 1.5, z - 4] as [number, number, number] };
}

export function Platformer3D({ level = 1, onLevelComplete, onBack }: Platformer3DProps) {
  const [levelData, setLevelData] = useState(() => generateLevel(level));
  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 1.5, 0]);
  const [velocity, setVelocity] = useState(new THREE.Vector3(0, 0, 0));
  const [isJumping, setIsJumping] = useState(false);
  const [isGrounded, setIsGrounded] = useState(true);
  const [coins, setCoins] = useState(levelData.coins);
  const [score, setScore] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);

  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const shown = localStorage.getItem("platformer3d_tutorial");
    if (shown) setShowTutorial(false);
  }, []);

  // Game physics loop
  useEffect(() => {
    if (!isPlaying) return;

    const gravity = -0.015;
    const jumpForce = 0.3;
    const moveSpeed = 0.15;
    const friction = 0.92;

    const gameLoop = setInterval(() => {
      setVelocity(v => {
        const newV = v.clone();
        
        // Apply gravity
        newV.y += gravity;
        
        // Movement
        if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a")) newV.x -= moveSpeed * 0.3;
        if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d")) newV.x += moveSpeed * 0.3;
        if (keysPressed.current.has("ArrowUp") || keysPressed.current.has("w")) newV.z -= moveSpeed;
        if (keysPressed.current.has("ArrowDown") || keysPressed.current.has("s")) newV.z += moveSpeed * 0.5;
        
        // Friction
        newV.x *= friction;
        newV.z *= friction;
        
        return newV;
      });

      setPlayerPos(pos => {
        const newPos: [number, number, number] = [
          pos[0] + velocity.x,
          pos[1] + velocity.y,
          pos[2] + velocity.z
        ];

        // Check platform collisions
        let onPlatform = false;
        for (const plat of levelData.platforms) {
          const px = plat.position[0];
          const py = plat.position[1];
          const pz = plat.position[2];
          const sx = (plat.size?.[0] || 2) / 2;
          const sz = (plat.size?.[2] || 2) / 2;

          if (newPos[0] > px - sx && newPos[0] < px + sx &&
              newPos[2] > pz - sz && newPos[2] < pz + sz &&
              newPos[1] <= py + 1 && newPos[1] >= py) {
            newPos[1] = py + 1;
            setVelocity(v => new THREE.Vector3(v.x, 0, v.z));
            onPlatform = true;
            setIsGrounded(true);
            setIsJumping(false);
          }
        }

        // Fall off
        if (newPos[1] < -10) {
          setLives(l => {
            if (l <= 1) {
              setIsWin(false);
              setShowGameOver(true);
              setIsPlaying(false);
              return 0;
            }
            toast.error("Rơi xuống! 💔");
            haptics.error();
            return l - 1;
          });
          return [0, 1.5, 0];
        }

        // Check goal
        const gx = levelData.goalPos[0];
        const gz = levelData.goalPos[2];
        if (Math.abs(newPos[0] - gx) < 1.5 && Math.abs(newPos[2] - gz) < 1.5 && newPos[1] < levelData.goalPos[1] + 1) {
          toast.success("🎉 Level hoàn thành!");
          haptics.success();
          setIsWin(true);
          setShowGameOver(true);
          setIsPlaying(false);
          onLevelComplete?.();
        }

        // Check coin collection
        coins.forEach((coin, i) => {
          const dist = Math.sqrt((newPos[0] - coin[0]) ** 2 + (newPos[1] - coin[1]) ** 2 + (newPos[2] - coin[2]) ** 2);
          if (dist < 1) {
            setCoins(c => c.filter((_, idx) => idx !== i));
            setScore(s => s + 100);
            setEarnedCoins(c => c + 50);
            haptics.light();
          }
        });

        if (!onPlatform && velocity.y < 0) setIsGrounded(false);

        return newPos;
      });
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPlaying, velocity, levelData, coins, onLevelComplete]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);
      if ((e.key === " " || e.key === "ArrowUp") && isGrounded && isPlaying) {
        setVelocity(v => new THREE.Vector3(v.x, 0.3, v.z));
        setIsJumping(true);
        setIsGrounded(false);
        haptics.light();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => keysPressed.current.delete(e.key);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isGrounded, isPlaying]);

  const handleJump = () => {
    if (isGrounded && isPlaying) {
      setVelocity(v => new THREE.Vector3(v.x, 0.3, v.z));
      setIsJumping(true);
      setIsGrounded(false);
      haptics.medium();
    }
  };

  const startGame = () => {
    const newLevel = generateLevel(level);
    setLevelData(newLevel);
    setCoins(newLevel.coins);
    setPlayerPos([0, 1.5, 0]);
    setVelocity(new THREE.Vector3(0, 0, 0));
    setScore(0);
    setEarnedCoins(0);
    setLives(3);
    setIsPlaying(true);
    setShowGameOver(false);
    setIsGrounded(true);
    setIsJumping(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {showTutorial && (
        <Game3DTutorial
          isOpen={showTutorial}
          onClose={() => { localStorage.setItem("platformer3d_tutorial", "true"); setShowTutorial(false); }}
          onStart={() => { localStorage.setItem("platformer3d_tutorial", "true"); setShowTutorial(false); startGame(); }}
          gameTitle="Platformer 3D"
          gameIcon="🏃"
          howToPlay={["WASD/Mũi tên để di chuyển", "Space/Tap để nhảy", "Thu thập coins vàng", "Đến cờ xanh để thắng"]}
          objectives={["Nhảy qua các platform", "Đừng rơi xuống!", "Thu thập coins"]}
          rewards={{ perLevel: 5000, firstPlay: 10000, combo: 2000 }}
        />
      )}

      {showGameOver && (
        <Game3DGameOver isOpen={showGameOver} onClose={() => setShowGameOver(false)} onRestart={startGame} onHome={() => onBack?.()} isWin={isWin} score={score} coinsEarned={earnedCoins} level={level} />
      )}

      <div className="relative w-full aspect-video max-w-[700px] rounded-xl overflow-hidden bg-gradient-to-b from-cyan-400 to-blue-600">
        {isPlaying && <Game3DHUD score={score} level={level} lives={lives} maxLives={3} coins={earnedCoins} />}
        
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 8, 15], fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <CameraFollow target={playerPos} />
            <Sky sunPosition={[100, 50, 100]} />
            <Environment preset="city" background={false} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />

            <PlatformPlayer position={playerPos} isJumping={isJumping} velocity={velocity} />

            {levelData.platforms.map((plat, i) => (
              plat.moving ? (
                <MovingPlatform key={i} position={plat.position} axis={plat.axis} />
              ) : (
                <Platform key={i} position={plat.position} size={plat.size} />
              )
            ))}

            {coins.map((pos, i) => (
              <PlatformCoin key={i} position={pos} onCollect={() => {}} />
            ))}

            <GoalFlag position={levelData.goalPos} />

            <ContactShadows position={[0, -0.5, 0]} opacity={0.3} scale={50} blur={2} far={20} />
            <fog attach="fog" args={["#87CEEB", 30, 80]} />
          </Suspense>
        </Canvas>
        
        {!isPlaying && !showTutorial && !showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="text-6xl mb-4">🏃</div>
              <h2 className="text-2xl font-bold text-white mb-2">Platformer 3D</h2>
              <Button onClick={startGame} size="lg" className="bg-green-500 hover:bg-green-600">Bắt đầu</Button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="flex gap-2 md:hidden">
        <Button size="lg" variant="outline" className="h-14 w-14" onTouchStart={() => keysPressed.current.add("a")} onTouchEnd={() => keysPressed.current.delete("a")} disabled={!isPlaying}><ArrowLeft className="h-7 w-7" /></Button>
        <Button size="lg" variant="default" className="h-14 w-20" onTouchStart={handleJump} disabled={!isPlaying || !isGrounded}>JUMP</Button>
        <Button size="lg" variant="outline" className="h-14 w-14" onTouchStart={() => keysPressed.current.add("d")} onTouchEnd={() => keysPressed.current.delete("d")} disabled={!isPlaying}><ArrowRightIcon className="h-7 w-7" /></Button>
      </div>

      <div className="flex gap-3">
        {onBack && <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Button>}
        <Button onClick={startGame} className="bg-gradient-to-r from-green-500 to-cyan-500">{isPlaying ? "Chơi lại" : "Bắt đầu"} 🏃</Button>
      </div>
    </div>
  );
}

export default Platformer3D;
