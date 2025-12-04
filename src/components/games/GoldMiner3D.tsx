import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  Html,
  useProgress,
  Float,
  Sparkles,
  Text
} from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Game3DHUD, Game3DTutorial, Game3DGameOver } from "./3d/Game3DUI";
import { SimpleCharacter } from "./3d/ReadyPlayerMeAvatar";
import { haptics } from "@/utils/haptics";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface GoldMiner3DProps {
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
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-white text-sm">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// Gold nugget
function GoldNugget({ 
  position, 
  size = 0.5,
  value = 10,
  onClick 
}: { 
  position: [number, number, number]; 
  size?: number;
  value?: number;
  onClick?: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [collected, setCollected] = useState(false);
  
  useFrame((state) => {
    if (ref.current && !collected) {
      ref.current.rotation.y = state.clock.elapsedTime * 2;
    }
  });

  if (collected) return null;

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.3}>
      <mesh
        ref={ref}
        position={position}
        onClick={() => {
          setCollected(true);
          onClick?.();
        }}
        castShadow
      >
        <dodecahedronGeometry args={[size, 0]} />
        <meshStandardMaterial 
          color="#ffd700" 
          metalness={0.9}
          roughness={0.1}
          emissive="#ffd700"
          emissiveIntensity={0.3}
        />
      </mesh>
      <Sparkles 
        position={position} 
        count={8} 
        scale={size * 3} 
        size={3} 
        color="#ffd700" 
      />
    </Float>
  );
}

// Rock that can be mined
function MineableRock({ 
  position, 
  onBreak,
  content
}: { 
  position: [number, number, number]; 
  onBreak?: (content: string) => void;
  content: "gold" | "gem" | "empty" | "bomb";
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hits, setHits] = useState(0);
  const [broken, setBroken] = useState(false);
  const durability = 3;

  const handleClick = () => {
    if (broken) return;
    
    const newHits = hits + 1;
    setHits(newHits);
    haptics.light();
    
    if (ref.current) {
      ref.current.scale.setScalar(1 - (newHits / durability) * 0.3);
    }
    
    if (newHits >= durability) {
      setBroken(true);
      onBreak?.(content);
    }
  };

  if (broken) {
    if (content === "gold") {
      return (
        <Float speed={4} floatIntensity={1}>
          <mesh position={[position[0], position[1] + 0.5, position[2]]}>
            <dodecahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} emissive="#ffd700" emissiveIntensity={0.3} />
          </mesh>
          <Sparkles position={position} count={20} scale={2} size={5} color="#ffd700" />
        </Float>
      );
    }
    if (content === "gem") {
      return (
        <Float speed={4} floatIntensity={1}>
          <mesh position={[position[0], position[1] + 0.5, position[2]]}>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial color="#a855f7" metalness={0.8} roughness={0.1} transparent opacity={0.8} emissive="#a855f7" emissiveIntensity={0.5} />
          </mesh>
          <Sparkles position={position} count={20} scale={2} size={5} color="#a855f7" />
        </Float>
      );
    }
    return null;
  }

  const damageColor = new THREE.Color("#8B7355").lerp(new THREE.Color("#4a3728"), hits / durability);

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={damageColor}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

// Torch for lighting
function Torch({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + Math.sin(state.clock.elapsedTime * 10) * 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.08, 0.4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.12, 0.25, 8]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        color="#ff9933"
        intensity={1.5}
        distance={10}
        castShadow
      />
      <Sparkles position={[0, 0.4, 0]} count={5} scale={0.5} size={4} color="#ff6600" />
    </group>
  );
}

// Player miner character
function Miner({ position, isDigging }: { position: [number, number, number]; isDigging: boolean }) {
  const group = useRef<THREE.Group>(null);
  const pickaxe = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
    if (pickaxe.current && isDigging) {
      pickaxe.current.rotation.x = Math.sin(state.clock.elapsedTime * 15) * 0.5;
    }
  });

  return (
    <group ref={group} position={position}>
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      {/* Head with helmet */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      {/* Helmet */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#ffd700" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Helmet light */}
      <mesh position={[0, 1.4, 0.2]}>
        <boxGeometry args={[0.08, 0.08, 0.05]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
      <pointLight position={[0, 1.4, 0.5]} color="#ffff00" intensity={0.5} distance={5} />
      
      {/* Pickaxe */}
      <group ref={pickaxe} position={[0.4, 0.8, 0.2]} rotation={[0, 0, -0.5]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 0.6]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.08, 0.2, 4]} />
          <meshStandardMaterial color="#666" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// Game scene
function MineScene({
  rocks,
  score,
  onRockBreak,
  minerPosition
}: {
  rocks: { id: number; position: [number, number, number]; content: "gold" | "gem" | "empty" | "bomb" }[];
  score: number;
  onRockBreak: (id: number, content: string) => void;
  minerPosition: [number, number, number];
}) {
  return (
    <>
      {/* Environment */}
      <Environment preset="night" background={false} />
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={0.3} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Cave floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#3d2817" roughness={1} />
      </mesh>

      {/* Cave ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#2d1f14" />
      </mesh>

      {/* Cave walls */}
      <mesh position={[0, 3, -10]} receiveShadow>
        <boxGeometry args={[20, 6, 0.5]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>

      {/* Torches */}
      <Torch position={[-4, 3, -9.5]} />
      <Torch position={[4, 3, -9.5]} />
      <Torch position={[-8, 3, 0]} />
      <Torch position={[8, 3, 0]} />

      {/* Miner character */}
      <Miner position={minerPosition} isDigging={false} />

      {/* Mineable rocks */}
      {rocks.map((rock) => (
        <MineableRock
          key={rock.id}
          position={rock.position}
          content={rock.content}
          onBreak={(content) => onRockBreak(rock.id, content)}
        />
      ))}

      {/* Ambient particles */}
      <Sparkles
        count={30}
        scale={15}
        size={1}
        speed={0.2}
        color="#ffd700"
        opacity={0.2}
      />

      {/* Fog */}
      <fog attach="fog" args={["#1a1008", 3, 20]} />

      {/* Camera controls */}
      <OrbitControls 
        target={[0, 2, 0]}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={15}
      />

      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.5}
        scale={20}
        blur={2}
        far={10}
      />
    </>
  );
}

export function GoldMiner3D({ level = 1, onLevelComplete, onBack }: GoldMiner3DProps) {
  const targetScore = level * 500;
  const rockCount = 10 + level * 3;

  const generateRocks = useCallback(() => {
    const rocks: { id: number; position: [number, number, number]; content: "gold" | "gem" | "empty" | "bomb" }[] = [];
    
    for (let i = 0; i < rockCount; i++) {
      const x = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 8;
      const y = Math.random() * 2 + 0.5;
      
      const rand = Math.random();
      let content: "gold" | "gem" | "empty" | "bomb";
      if (rand < 0.3) content = "gold";
      else if (rand < 0.4) content = "gem";
      else if (rand < 0.5) content = "bomb";
      else content = "empty";
      
      rocks.push({ id: i, position: [x, y, z], content });
    }
    
    return rocks;
  }, [rockCount]);

  const [rocks, setRocks] = useState(generateRocks);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 + level * 10);
  const [minerPos] = useState<[number, number, number]>([0, 0, 5]);

  useEffect(() => {
    const shown = localStorage.getItem("goldminer3d_tutorial");
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

  const handleRockBreak = (id: number, content: string) => {
    haptics.medium();
    
    if (content === "gold") {
      const points = 100 * (1 + combo * 0.1);
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
      setCoins(c => c + 50);
      setCombo(c => c + 1);
      toast.success(`+${Math.round(points)} 🪙`);
    } else if (content === "gem") {
      setScore(s => s + 250);
      setCoins(c => c + 150);
      setCombo(c => c + 2);
      toast.success("+250 💎");
    } else if (content === "bomb") {
      setCombo(0);
      setLives(l => {
        if (l <= 1) {
          setIsWin(false);
          setShowGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        toast.error("💥 Bom!");
        return l - 1;
      });
      haptics.error();
    } else {
      setCombo(0);
    }

    setRocks(r => r.filter(rock => rock.id !== id));
  };

  const startGame = () => {
    setRocks(generateRocks());
    setScore(0);
    setCoins(0);
    setCombo(0);
    setLives(3);
    setTimeLeft(60 + level * 10);
    setIsPlaying(true);
    setShowGameOver(false);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {showTutorial && (
        <Game3DTutorial
          isOpen={showTutorial}
          onClose={() => {
            localStorage.setItem("goldminer3d_tutorial", "true");
            setShowTutorial(false);
          }}
          onStart={() => {
            localStorage.setItem("goldminer3d_tutorial", "true");
            setShowTutorial(false);
            startGame();
          }}
          gameTitle="Đào Vàng 3D"
          gameIcon="⛏️"
          howToPlay={[
            "Click vào đá để đập vỡ",
            "Tìm vàng 🪙 và đá quý 💎",
            "Tránh bom 💣 sẽ mất mạng",
            "Đào liên tục để tăng combo"
          ]}
          objectives={[
            `Đạt ${targetScore} điểm`,
            "Hoàn thành trước khi hết giờ",
            "Tạo combo để nhân điểm"
          ]}
          rewards={{ perLevel: 5000, firstPlay: 10000, combo: 3000 }}
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
          coinsEarned={coins}
          level={level}
          stats={[
            { label: "Combo cao nhất", value: combo },
            { label: "Thời gian", value: `${60 + level * 10 - timeLeft}s` },
          ]}
        />
      )}

      <div className="relative w-full aspect-video max-w-[700px] rounded-xl overflow-hidden bg-gradient-to-b from-amber-900 to-stone-950">
        {isPlaying && (
          <Game3DHUD
            score={score}
            level={level}
            lives={lives}
            maxLives={3}
            coins={coins}
            combo={combo}
            targetScore={targetScore}
            timeLeft={timeLeft}
          />
        )}
        
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 8, 12], fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <MineScene
              rocks={rocks}
              score={score}
              onRockBreak={handleRockBreak}
              minerPosition={minerPos}
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
              <div className="text-6xl mb-4">⛏️</div>
              <h2 className="text-2xl font-bold text-white mb-2">Đào Vàng 3D</h2>
              <p className="text-white/70 mb-4">Level {level}</p>
              <Button onClick={startGame} size="lg" className="bg-yellow-500 hover:bg-yellow-600">
                Bắt đầu
              </Button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {onBack && (
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Button>
        )}
        {!showTutorial && (
          <Button onClick={startGame} className="bg-gradient-to-r from-yellow-500 to-amber-500">
            {isPlaying ? "Chơi lại" : "Bắt đầu"} ⛏️
          </Button>
        )}
      </div>
    </div>
  );
}

export default GoldMiner3D;
