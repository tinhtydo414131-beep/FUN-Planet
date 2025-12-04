import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, ContactShadows, Html, useProgress, Sparkles, Sky } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Game3DHUD, Game3DTutorial, Game3DGameOver } from "./3d/Game3DUI";
import { haptics } from "@/utils/haptics";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight as ArrowRightIcon } from "lucide-react";

interface Racing3DProps {
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
          <div className="h-full bg-gradient-to-r from-red-400 to-orange-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-white text-sm">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// Car model
function Car({ position, rotation, color = "#ef4444", isPlayer = false }: { position: [number, number, number]; rotation: number; color?: string; isPlayer?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.set(...position);
      ref.current.rotation.y = rotation;
    }
    wheelRefs.current.forEach(wheel => {
      if (wheel) wheel.rotation.x += 0.3;
    });
  });

  return (
    <group ref={ref}>
      {/* Body */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.8, 0.3, 1.6]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.55, -0.1]} castShadow>
        <boxGeometry args={[0.7, 0.25, 0.8]} />
        <meshStandardMaterial color="#333" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Wheels */}
      {[[-0.35, 0.15, 0.5], [0.35, 0.15, 0.5], [-0.35, 0.15, -0.5], [0.35, 0.15, -0.5]].map((pos, i) => (
        <mesh key={i} ref={el => { if (el) wheelRefs.current[i] = el; }} position={pos as [number, number, number]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
          <meshStandardMaterial color="#222" roughness={0.9} />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[-0.25, 0.3, 0.81]}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#ffff00" /></mesh>
      <mesh position={[0.25, 0.3, 0.81]}><sphereGeometry args={[0.08, 8, 8]} /><meshBasicMaterial color="#ffff00" /></mesh>
      {isPlayer && <pointLight position={[0, 0.5, 1]} color="#ffff00" intensity={0.5} distance={5} />}
      {isPlayer && <Sparkles position={[0, 0, -1]} count={5} scale={1} size={3} color={color} />}
    </group>
  );
}

// Road segment
function Road({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 20]} />
        <meshStandardMaterial color="#333" roughness={0.9} />
      </mesh>
      {/* Lane markers */}
      {[-2, 2].map((x, i) => (
        <mesh key={i} position={[x, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 20]} />
          <meshBasicMaterial color="#fff" />
        </mesh>
      ))}
      {/* Center dashed line */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, 0.01, -8 + i * 4]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, 2]} />
          <meshBasicMaterial color="#ffd700" />
        </mesh>
      ))}
    </group>
  );
}

// Obstacle car
function ObstacleCar({ position, lane, speed }: { position: [number, number, number]; lane: number; speed: number }) {
  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6"];
  return <Car position={position} rotation={Math.PI} color={colors[lane % colors.length]} />;
}

// Coin on road
function RoadCoin({ position, onCollect }: { position: [number, number, number]; onCollect: () => void }) {
  const [collected, setCollected] = useState(false);
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current && !collected) ref.current.rotation.y = state.clock.elapsedTime * 4;
  });

  if (collected) return null;

  return (
    <mesh ref={ref} position={position}>
      <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
      <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#ffd700" emissiveIntensity={0.3} />
    </mesh>
  );
}

// Camera follow
function CameraFollow({ target }: { target: THREE.Vector3 }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(target.x * 0.5, 4, target.z + 8), 0.1);
    camera.lookAt(target.x * 0.3, 0, target.z - 5);
  });
  return null;
}

export function Racing3D({ level = 1, onLevelComplete, onBack }: Racing3DProps) {
  const lanes = [-2, 0, 2];
  const baseSpeed = 0.3 + level * 0.05;
  const targetDistance = 500 + level * 100;

  const [playerLane, setPlayerLane] = useState(1);
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 0.15, 0));
  const [distance, setDistance] = useState(0);
  const [score, setScore] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [obstacles, setObstacles] = useState<{ id: number; lane: number; z: number }[]>([]);
  const [coins, setCoins] = useState<{ id: number; lane: number; z: number }[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [speed, setSpeed] = useState(baseSpeed);

  const obstacleIdRef = useRef(0);
  const coinIdRef = useRef(0);

  useEffect(() => {
    const shown = localStorage.getItem("racing3d_tutorial");
    if (shown) setShowTutorial(false);
  }, []);

  // Game loop
  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = setInterval(() => {
      // Move forward
      setDistance(d => {
        const newD = d + speed;
        if (newD >= targetDistance) {
          toast.success("🎉 Level hoàn thành!");
          haptics.success();
          setIsWin(true);
          setShowGameOver(true);
          setIsPlaying(false);
          onLevelComplete?.();
        }
        return newD;
      });

      setScore(s => s + Math.floor(speed * 10));

      // Spawn obstacles
      if (Math.random() < 0.03 + level * 0.01) {
        const lane = Math.floor(Math.random() * 3);
        setObstacles(o => [...o, { id: obstacleIdRef.current++, lane, z: -50 }]);
      }

      // Spawn coins
      if (Math.random() < 0.05) {
        const lane = Math.floor(Math.random() * 3);
        setCoins(c => [...c, { id: coinIdRef.current++, lane, z: -40 }]);
      }

      // Move obstacles
      setObstacles(o => o.map(obs => ({ ...obs, z: obs.z + speed * 1.5 })).filter(obs => obs.z < 10));

      // Move coins
      setCoins(c => c.map(coin => ({ ...coin, z: coin.z + speed * 1.5 })).filter(coin => coin.z < 10));

      // Check collisions
      obstacles.forEach(obs => {
        if (obs.lane === playerLane && obs.z > -2 && obs.z < 2) {
          setLives(l => {
            if (l <= 1) {
              setIsWin(false);
              setShowGameOver(true);
              setIsPlaying(false);
              return 0;
            }
            toast.error("Va chạm! 💥");
            haptics.error();
            setObstacles(o => o.filter(o => o.id !== obs.id));
            return l - 1;
          });
        }
      });

      // Check coin collection
      coins.forEach(coin => {
        if (coin.lane === playerLane && coin.z > -1 && coin.z < 1) {
          setCoins(c => c.filter(c => c.id !== coin.id));
          setScore(s => s + 100);
          setEarnedCoins(c => c + 50);
          haptics.light();
        }
      });

      // Increase speed over time
      setSpeed(s => Math.min(s + 0.0005, baseSpeed * 2));

      // Update player position
      setPlayerPos(p => new THREE.Vector3(lanes[playerLane], 0.15, 0));
    }, 16);

    return () => clearInterval(gameLoop);
  }, [isPlaying, playerLane, obstacles, coins, speed, baseSpeed, level, targetDistance, onLevelComplete]);

  // Controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === "ArrowLeft" || e.key === "a") {
        setPlayerLane(l => Math.max(0, l - 1));
        haptics.light();
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        setPlayerLane(l => Math.min(2, l + 1));
        haptics.light();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPlaying]);

  const startGame = () => {
    setPlayerLane(1);
    setPlayerPos(new THREE.Vector3(0, 0.15, 0));
    setDistance(0);
    setScore(0);
    setEarnedCoins(0);
    setLives(3);
    setObstacles([]);
    setCoins([]);
    setSpeed(baseSpeed);
    setIsPlaying(true);
    setShowGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {showTutorial && (
        <Game3DTutorial
          isOpen={showTutorial}
          onClose={() => { localStorage.setItem("racing3d_tutorial", "true"); setShowTutorial(false); }}
          onStart={() => { localStorage.setItem("racing3d_tutorial", "true"); setShowTutorial(false); startGame(); }}
          gameTitle="Đua Xe 3D"
          gameIcon="🏎️"
          howToPlay={["← → để đổi làn", "Tránh xe khác", "Thu thập coins", "Hoàn thành quãng đường"]}
          objectives={[`Chạy ${targetDistance}m`, "Không va chạm 3 lần"]}
          rewards={{ perLevel: 5000, firstPlay: 10000, combo: 3000 }}
        />
      )}

      {showGameOver && (
        <Game3DGameOver isOpen={showGameOver} onClose={() => setShowGameOver(false)} onRestart={startGame} onHome={() => onBack?.()} isWin={isWin} score={score} coinsEarned={earnedCoins} level={level} stats={[{ label: "Khoảng cách", value: `${Math.floor(distance)}m` }, { label: "Tốc độ max", value: `${Math.floor(speed * 100)}km/h` }]} />
      )}

      <div className="relative w-full aspect-video max-w-[700px] rounded-xl overflow-hidden bg-gradient-to-b from-orange-400 to-red-600">
        {isPlaying && (
          <>
            <Game3DHUD score={score} level={level} lives={lives} maxLives={3} coins={earnedCoins} targetScore={targetDistance} />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white font-bold">
              {Math.floor(distance)}m / {targetDistance}m
            </div>
          </>
        )}
        
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 5, 10], fov: 60 }}>
          <Suspense fallback={<Loader />}>
            <CameraFollow target={playerPos} />
            <Sky sunPosition={[100, 20, 100]} />
            <Environment preset="sunset" background={false} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 20, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />

            {/* Roads */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Road key={i} position={[0, 0, -i * 20 - ((distance * 10) % 20)]} />
            ))}

            {/* Player car */}
            <Car position={[lanes[playerLane], 0.15, 0]} rotation={0} color="#ef4444" isPlayer />

            {/* Obstacle cars */}
            {obstacles.map(obs => (
              <ObstacleCar key={obs.id} position={[lanes[obs.lane], 0.15, obs.z]} lane={obs.lane} speed={speed} />
            ))}

            {/* Coins */}
            {coins.map(coin => (
              <RoadCoin key={coin.id} position={[lanes[coin.lane], 0.5, coin.z]} onCollect={() => {}} />
            ))}

            {/* Grass sides */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, -0.01, 0]}>
              <planeGeometry args={[10, 200]} />
              <meshStandardMaterial color="#228B22" />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[8, -0.01, 0]}>
              <planeGeometry args={[10, 200]} />
              <meshStandardMaterial color="#228B22" />
            </mesh>

            <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={30} blur={2} far={10} />
            <fog attach="fog" args={["#f97316", 20, 60]} />
          </Suspense>
        </Canvas>
        
        {!isPlaying && !showTutorial && !showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="text-6xl mb-4">🏎️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Đua Xe 3D</h2>
              <Button onClick={startGame} size="lg" className="bg-red-500 hover:bg-red-600">Bắt đầu</Button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="flex gap-4 md:hidden">
        <Button size="lg" variant="outline" className="h-16 w-24" onTouchStart={() => { setPlayerLane(l => Math.max(0, l - 1)); haptics.light(); }} disabled={!isPlaying}><ArrowLeft className="h-8 w-8" /></Button>
        <Button size="lg" variant="outline" className="h-16 w-24" onTouchStart={() => { setPlayerLane(l => Math.min(2, l + 1)); haptics.light(); }} disabled={!isPlaying}><ArrowRightIcon className="h-8 w-8" /></Button>
      </div>

      <div className="flex gap-3">
        {onBack && <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Button>}
        <Button onClick={startGame} className="bg-gradient-to-r from-red-500 to-orange-500">{isPlaying ? "Chơi lại" : "Bắt đầu"} 🏎️</Button>
      </div>
    </div>
  );
}

export default Racing3D;
