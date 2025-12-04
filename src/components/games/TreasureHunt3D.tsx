import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  Environment, 
  ContactShadows,
  Html,
  useProgress,
  Float,
  Sparkles,
  Sky
} from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Game3DHUD, Game3DTutorial, Game3DGameOver } from "./3d/Game3DUI";
import { haptics } from "@/utils/haptics";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, ArrowDown, ArrowRight as ArrowRightIcon } from "lucide-react";

interface TreasureHunt3DProps {
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
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-white text-sm">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// Treasure chest
function TreasureChest({ position, isOpen, onClick }: { position: [number, number, number]; isOpen: boolean; onClick: () => void }) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current && !isOpen) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={ref} position={position} onClick={onClick}>
      {/* Chest body */}
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.5, 0.5]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      {/* Chest lid */}
      <mesh position={[0, isOpen ? 0.5 : 0.25, isOpen ? -0.1 : 0]} rotation={[isOpen ? -1 : 0, 0, 0]} castShadow>
        <boxGeometry args={[0.82, 0.1, 0.52]} />
        <meshStandardMaterial color="#A0522D" roughness={0.8} />
      </mesh>
      {/* Gold band */}
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[0.82, 0.15, 0.02]} />
        <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Lock */}
      <mesh position={[0, 0.1, 0.26]}>
        <boxGeometry args={[0.1, 0.15, 0.05]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
      {isOpen && (
        <>
          <Sparkles position={[0, 0.5, 0]} count={30} scale={1.5} size={4} color="#ffd700" />
          <pointLight position={[0, 0.5, 0]} color="#ffd700" intensity={2} distance={3} />
        </>
      )}
    </group>
  );
}

// Palm tree
function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      {/* Leaves */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <mesh key={i} position={[Math.cos(angle * Math.PI / 180) * 0.5, 3, Math.sin(angle * Math.PI / 180) * 0.5]} rotation={[0.5, angle * Math.PI / 180, 0]}>
          <coneGeometry args={[0.3, 1.5, 4]} />
          <meshStandardMaterial color="#228B22" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Rock obstacle
function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#696969" roughness={0.9} />
    </mesh>
  );
}

// Coin collectible
function Coin3D({ position, onCollect }: { position: [number, number, number]; onCollect: () => void }) {
  const [collected, setCollected] = useState(false);
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ref.current && !collected) {
      ref.current.rotation.y = state.clock.elapsedTime * 3;
    }
  });

  if (collected) return null;

  return (
    <Float speed={4} floatIntensity={0.3}>
      <mesh ref={ref} position={position} onClick={() => { setCollected(true); onCollect(); }} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#ffd700" emissiveIntensity={0.2} />
      </mesh>
      <Sparkles position={position} count={3} scale={0.5} size={2} color="#ffd700" />
    </Float>
  );
}

// Player pirate
function Pirate({ position, targetPosition }: { position: [number, number, number]; targetPosition: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const currentPos = useRef(new THREE.Vector3(...position));

  useFrame(() => {
    if (ref.current) {
      currentPos.current.lerp(new THREE.Vector3(...targetPosition), 0.1);
      ref.current.position.copy(currentPos.current);
      ref.current.position.y = 0.5 + Math.sin(Date.now() * 0.005) * 0.1;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      {/* Bandana */}
      <mesh position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.19, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {/* Eye patch */}
      <mesh position={[0.1, 0.52, 0.15]}>
        <circleGeometry args={[0.05, 8]} />
        <meshBasicMaterial color="#000" />
      </mesh>
    </group>
  );
}

// Camera follow
function CameraFollow({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(new THREE.Vector3(target[0], target[1] + 8, target[2] + 8), 0.05);
    camera.lookAt(target[0], target[1], target[2]);
  });
  return null;
}

// Game scene
function IslandScene({
  playerPos,
  chests,
  coins,
  onChestOpen,
  onCoinCollect
}: {
  playerPos: [number, number, number];
  chests: { id: number; position: [number, number, number]; isOpen: boolean; hasTreasure: boolean }[];
  coins: { id: number; position: [number, number, number] }[];
  onChestOpen: (id: number) => void;
  onCoinCollect: (id: number) => void;
}) {
  return (
    <>
      <CameraFollow target={playerPos} />
      <Sky sunPosition={[100, 20, 100]} />
      <Environment preset="sunset" background={false} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 15, 5]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />

      {/* Sand island */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[15, 32]} />
        <meshStandardMaterial color="#F4A460" roughness={0.9} />
      </mesh>

      {/* Water */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1e90ff" transparent opacity={0.8} metalness={0.3} roughness={0.2} />
      </mesh>

      {/* Palm trees */}
      <PalmTree position={[-5, 0, -5]} />
      <PalmTree position={[6, 0, -3]} />
      <PalmTree position={[-3, 0, 6]} />
      <PalmTree position={[7, 0, 5]} />

      {/* Rocks */}
      <Rock position={[-8, 0.3, 2]} scale={1.2} />
      <Rock position={[4, 0.2, -7]} scale={0.8} />
      <Rock position={[-2, 0.2, 8]} />

      {/* Player */}
      <Pirate position={playerPos} targetPosition={playerPos} />

      {/* Treasure chests */}
      {chests.map((chest) => (
        <TreasureChest
          key={chest.id}
          position={chest.position}
          isOpen={chest.isOpen}
          onClick={() => onChestOpen(chest.id)}
        />
      ))}

      {/* Coins */}
      {coins.map((coin) => (
        <Coin3D key={coin.id} position={coin.position} onCollect={() => onCoinCollect(coin.id)} />
      ))}

      <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={30} blur={2} far={10} />
      <fog attach="fog" args={["#87CEEB", 20, 50]} />
    </>
  );
}

export function TreasureHunt3D({ level = 1, onLevelComplete, onBack }: TreasureHunt3DProps) {
  const chestCount = 5 + level;
  const coinCount = 8 + level * 2;

  const generateChests = useCallback(() => {
    const chests: { id: number; position: [number, number, number]; isOpen: boolean; hasTreasure: boolean }[] = [];
    const treasureIndex = Math.floor(Math.random() * chestCount);
    
    for (let i = 0; i < chestCount; i++) {
      const angle = (i / chestCount) * Math.PI * 2;
      const radius = 5 + Math.random() * 5;
      chests.push({
        id: i,
        position: [Math.cos(angle) * radius, 0.25, Math.sin(angle) * radius],
        isOpen: false,
        hasTreasure: i === treasureIndex
      });
    }
    return chests;
  }, [chestCount]);

  const generateCoins = useCallback(() => {
    const coins: { id: number; position: [number, number, number] }[] = [];
    for (let i = 0; i < coinCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 10;
      coins.push({
        id: i,
        position: [Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius]
      });
    }
    return coins;
  }, [coinCount]);

  const [playerPos, setPlayerPos] = useState<[number, number, number]>([0, 0.5, 0]);
  const [chests, setChests] = useState(generateChests);
  const [coins, setCoins] = useState(generateCoins);
  const [score, setScore] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [attempts, setAttempts] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);

  useEffect(() => {
    const shown = localStorage.getItem("treasurehunt3d_tutorial");
    if (shown) setShowTutorial(false);
  }, []);

  const handleMove = useCallback((dir: string) => {
    if (!isPlaying) return;
    
    setPlayerPos(prev => {
      const newPos: [number, number, number] = [...prev];
      const speed = 0.5;
      
      switch (dir) {
        case "up": newPos[2] -= speed; break;
        case "down": newPos[2] += speed; break;
        case "left": newPos[0] -= speed; break;
        case "right": newPos[0] += speed; break;
      }
      
      // Keep within island
      const dist = Math.sqrt(newPos[0] ** 2 + newPos[2] ** 2);
      if (dist > 12) {
        const scale = 12 / dist;
        newPos[0] *= scale;
        newPos[2] *= scale;
      }
      
      haptics.light();
      return newPos;
    });
  }, [isPlaying]);

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

  const handleChestOpen = (id: number) => {
    if (!isPlaying) return;
    
    const chest = chests.find(c => c.id === id);
    if (!chest || chest.isOpen) return;

    // Check if player is close enough
    const dx = playerPos[0] - chest.position[0];
    const dz = playerPos[2] - chest.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 2) {
      toast.error("Quá xa! Đi gần hơn 🏃");
      return;
    }

    setChests(c => c.map(ch => ch.id === id ? { ...ch, isOpen: true } : ch));
    
    if (chest.hasTreasure) {
      toast.success("🎉 Tìm thấy kho báu!");
      haptics.success();
      setScore(s => s + 500);
      setEarnedCoins(c => c + 200);
      setIsWin(true);
      setShowGameOver(true);
      setIsPlaying(false);
      onLevelComplete?.();
    } else {
      setAttempts(a => {
        if (a <= 1) {
          setIsWin(false);
          setShowGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        toast.error(`Rỗng! Còn ${a - 1} lần 💔`);
        haptics.error();
        return a - 1;
      });
    }
  };

  const handleCoinCollect = (id: number) => {
    setCoins(c => c.filter(coin => coin.id !== id));
    setScore(s => s + 50);
    setEarnedCoins(c => c + 25);
    haptics.light();
  };

  const startGame = () => {
    setChests(generateChests());
    setCoins(generateCoins());
    setPlayerPos([0, 0.5, 0]);
    setScore(0);
    setEarnedCoins(0);
    setAttempts(3);
    setIsPlaying(true);
    setShowGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {showTutorial && (
        <Game3DTutorial
          isOpen={showTutorial}
          onClose={() => { localStorage.setItem("treasurehunt3d_tutorial", "true"); setShowTutorial(false); }}
          onStart={() => { localStorage.setItem("treasurehunt3d_tutorial", "true"); setShowTutorial(false); startGame(); }}
          gameTitle="Săn Kho Báu 3D"
          gameIcon="🏴‍☠️"
          howToPlay={["WASD để di chuyển", "Click rương gần bạn để mở", "Tìm rương có kho báu", "Thu thập coins trên đường"]}
          objectives={[`Tìm kho báu trong ${chestCount} rương`, "Chỉ có 3 lần mở sai"]}
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
        />
      )}

      <div className="relative w-full aspect-video max-w-[700px] rounded-xl overflow-hidden bg-gradient-to-b from-sky-400 to-blue-600">
        {isPlaying && (
          <Game3DHUD score={score} level={level} lives={attempts} maxLives={3} coins={earnedCoins} />
        )}
        
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 10, 12], fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <IslandScene
              playerPos={playerPos}
              chests={chests}
              coins={coins}
              onChestOpen={handleChestOpen}
              onCoinCollect={handleCoinCollect}
            />
          </Suspense>
        </Canvas>
        
        {!isPlaying && !showTutorial && !showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="text-6xl mb-4">🏴‍☠️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Săn Kho Báu 3D</h2>
              <Button onClick={startGame} size="lg" className="bg-yellow-500 hover:bg-yellow-600">Bắt đầu</Button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 md:hidden">
        <div />
        <Button size="lg" variant="outline" className="h-14 w-14" onTouchStart={(e) => { e.preventDefault(); handleMove("up"); }} disabled={!isPlaying}><ArrowUp className="h-7 w-7" /></Button>
        <div />
        <Button size="lg" variant="outline" className="h-14 w-14" onTouchStart={(e) => { e.preventDefault(); handleMove("left"); }} disabled={!isPlaying}><ArrowLeft className="h-7 w-7" /></Button>
        <Button size="lg" variant="outline" className="h-14 w-14" onTouchStart={(e) => { e.preventDefault(); handleMove("down"); }} disabled={!isPlaying}><ArrowDown className="h-7 w-7" /></Button>
        <Button size="lg" variant="outline" className="h-14 w-14" onTouchStart={(e) => { e.preventDefault(); handleMove("right"); }} disabled={!isPlaying}><ArrowRightIcon className="h-7 w-7" /></Button>
      </div>

      <div className="flex gap-3">
        {onBack && <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Button>}
        <Button onClick={startGame} className="bg-gradient-to-r from-yellow-500 to-orange-500">{isPlaying ? "Chơi lại" : "Bắt đầu"} 🏴‍☠️</Button>
      </div>
    </div>
  );
}

export default TreasureHunt3D;
