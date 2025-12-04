import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, useProgress, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Game3DHUD, Game3DTutorial, Game3DGameOver } from "./3d/Game3DUI";
import { haptics } from "@/utils/haptics";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface BalloonPop3DProps {
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
          <div className="h-full bg-gradient-to-r from-pink-400 to-purple-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-white text-sm">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// 3D Balloon
function Balloon3D({ 
  position, 
  color, 
  size = 1,
  points = 10,
  isBomb = false,
  onClick 
}: { 
  position: [number, number, number]; 
  color: string;
  size?: number;
  points?: number;
  isBomb?: boolean;
  onClick: () => void;
}) {
  const [popped, setPopped] = useState(false);
  const [showPop, setShowPop] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const startY = useRef(position[1]);

  useFrame((state) => {
    if (ref.current && !popped) {
      // Float up
      ref.current.position.y += 0.02;
      // Wobble
      ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.2;
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  const handleClick = () => {
    if (popped) return;
    setPopped(true);
    setShowPop(true);
    onClick();
    setTimeout(() => setShowPop(false), 500);
  };

  if (popped && !showPop) return null;

  return (
    <group ref={ref} position={position} onClick={handleClick}>
      {!popped ? (
        <>
          {/* Balloon body */}
          <mesh castShadow>
            <sphereGeometry args={[0.5 * size, 16, 16]} />
            <meshStandardMaterial 
              color={isBomb ? "#1f2937" : color} 
              metalness={0.3} 
              roughness={0.2}
              emissive={isBomb ? "#ef4444" : color}
              emissiveIntensity={0.1}
            />
          </mesh>
          {/* Balloon knot */}
          <mesh position={[0, -0.55 * size, 0]}>
            <coneGeometry args={[0.1 * size, 0.15 * size, 8]} />
            <meshStandardMaterial color={isBomb ? "#1f2937" : color} />
          </mesh>
          {/* String */}
          <mesh position={[0, -0.8 * size, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.5 * size]} />
            <meshStandardMaterial color="#999" />
          </mesh>
          {/* Bomb fuse */}
          {isBomb && (
            <>
              <mesh position={[0, 0.5 * size, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.2]} />
                <meshStandardMaterial color="#8B4513" />
              </mesh>
              <Sparkles position={[0, 0.65 * size, 0]} count={5} scale={0.3} size={4} color="#ff6600" />
            </>
          )}
          {/* Shine */}
          <mesh position={[-0.15 * size, 0.2 * size, 0.4 * size]}>
            <sphereGeometry args={[0.08 * size, 8, 8]} />
            <meshBasicMaterial color="white" transparent opacity={0.6} />
          </mesh>
        </>
      ) : (
        <Sparkles count={20} scale={2} size={5} color={isBomb ? "#ef4444" : color} />
      )}
    </group>
  );
}

// Background clouds
function Cloud({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={0.5} floatIntensity={0.3}>
      <group position={position}>
        {[0, 0.3, -0.3, 0.5, -0.4].map((x, i) => (
          <mesh key={i} position={[x, i * 0.1, i * 0.05]}>
            <sphereGeometry args={[0.4 + Math.random() * 0.2, 8, 8]} />
            <meshStandardMaterial color="white" transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

export function BalloonPop3D({ level = 1, onLevelComplete, onBack }: BalloonPop3DProps) {
  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];
  const targetPops = 15 + level * 5;
  const timeLimit = 30 + level * 5;
  const bombChance = 0.1 + level * 0.02;

  const [balloons, setBalloons] = useState<{ id: number; position: [number, number, number]; color: string; size: number; points: number; isBomb: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [popped, setPopped] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);

  const balloonIdRef = useRef(0);
  const lastPopTime = useRef(Date.now());

  useEffect(() => {
    const shown = localStorage.getItem("balloonpop3d_tutorial");
    if (shown) setShowTutorial(false);
  }, []);

  // Spawn balloons
  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(() => {
      const isBomb = Math.random() < bombChance;
      const size = 0.8 + Math.random() * 0.4;
      const points = isBomb ? -50 : Math.floor(size * 15);
      
      setBalloons(b => [...b, {
        id: balloonIdRef.current++,
        position: [(Math.random() - 0.5) * 8, -5, (Math.random() - 0.5) * 4],
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
        points,
        isBomb
      }]);
    }, 800 - level * 50);

    return () => clearInterval(spawnInterval);
  }, [isPlaying, level, bombChance]);

  // Remove off-screen balloons
  useEffect(() => {
    if (!isPlaying) return;
    
    const cleanupInterval = setInterval(() => {
      setBalloons(b => b.filter(balloon => balloon.position[1] < 10));
    }, 1000);

    return () => clearInterval(cleanupInterval);
  }, [isPlaying]);

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (popped >= targetPops) {
            toast.success("🎉 Level hoàn thành!");
            haptics.success();
            setIsWin(true);
            onLevelComplete?.();
          } else {
            setIsWin(false);
          }
          setShowGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, popped, targetPops, onLevelComplete]);

  const handlePop = (id: number, points: number, isBomb: boolean) => {
    setBalloons(b => b.filter(balloon => balloon.id !== id));
    
    if (isBomb) {
      setCombo(0);
      setLives(l => {
        if (l <= 1) {
          setIsWin(false);
          setShowGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        toast.error("💣 Bom!");
        haptics.error();
        return l - 1;
      });
      return;
    }

    const now = Date.now();
    const timeSince = now - lastPopTime.current;
    
    if (timeSince < 1000) {
      setCombo(c => c + 1);
    } else {
      setCombo(1);
    }
    lastPopTime.current = now;

    const bonusPoints = points * (1 + combo * 0.1);
    setScore(s => s + Math.floor(bonusPoints));
    setEarnedCoins(c => c + Math.floor(points / 2));
    setPopped(p => {
      const newP = p + 1;
      if (newP >= targetPops && timeLeft > 0) {
        toast.success("🎉 Level hoàn thành!");
        haptics.success();
        setIsWin(true);
        setShowGameOver(true);
        setIsPlaying(false);
        onLevelComplete?.();
      }
      return newP;
    });
    haptics.light();
  };

  const startGame = () => {
    setBalloons([]);
    setScore(0);
    setPopped(0);
    setEarnedCoins(0);
    setCombo(0);
    setLives(3);
    setTimeLeft(timeLimit);
    setIsPlaying(true);
    setShowGameOver(false);
    balloonIdRef.current = 0;
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {showTutorial && (
        <Game3DTutorial
          isOpen={showTutorial}
          onClose={() => { localStorage.setItem("balloonpop3d_tutorial", "true"); setShowTutorial(false); }}
          onStart={() => { localStorage.setItem("balloonpop3d_tutorial", "true"); setShowTutorial(false); startGame(); }}
          gameTitle="Bắn Bóng 3D"
          gameIcon="🎈"
          howToPlay={["Click/Tap để bắn bóng bay", "Bóng lớn = nhiều điểm hơn", "Tránh bom 💣 màu đen", "Combo liên tục để x điểm"]}
          objectives={[`Bắn ${targetPops} bóng`, `Trong ${timeLimit} giây`]}
          rewards={{ perLevel: 5000, firstPlay: 10000, combo: 3000 }}
        />
      )}

      {showGameOver && (
        <Game3DGameOver isOpen={showGameOver} onClose={() => setShowGameOver(false)} onRestart={startGame} onHome={() => onBack?.()} isWin={isWin} score={score} coinsEarned={earnedCoins} level={level} stats={[{ label: "Bóng bắn", value: popped }, { label: "Combo max", value: combo }]} />
      )}

      <div className="relative w-full aspect-video max-w-[700px] rounded-xl overflow-hidden bg-gradient-to-b from-sky-300 to-blue-500">
        {isPlaying && (
          <>
            <Game3DHUD score={score} level={level} lives={lives} maxLives={3} coins={earnedCoins} combo={combo} targetScore={targetPops * 15} timeLeft={timeLeft} />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white font-bold">
              {popped} / {targetPops} 🎈
            </div>
          </>
        )}
        
        <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <Environment preset="city" background={false} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 10, 5]} intensity={1} />

            {/* Clouds */}
            <Cloud position={[-5, 4, -5]} />
            <Cloud position={[5, 3, -6]} />
            <Cloud position={[0, 5, -7]} />

            {/* Balloons */}
            {balloons.map(balloon => (
              <Balloon3D
                key={balloon.id}
                position={balloon.position}
                color={balloon.color}
                size={balloon.size}
                points={balloon.points}
                isBomb={balloon.isBomb}
                onClick={() => handlePop(balloon.id, balloon.points, balloon.isBomb)}
              />
            ))}

            {/* Sun */}
            <mesh position={[6, 6, -10]}>
              <sphereGeometry args={[2, 16, 16]} />
              <meshBasicMaterial color="#ffd700" />
            </mesh>
            <pointLight position={[6, 6, -10]} color="#ffd700" intensity={0.5} distance={30} />
          </Suspense>
        </Canvas>
        
        {!isPlaying && !showTutorial && !showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="text-6xl mb-4">🎈</div>
              <h2 className="text-2xl font-bold text-white mb-2">Bắn Bóng 3D</h2>
              <Button onClick={startGame} size="lg" className="bg-pink-500 hover:bg-pink-600">Bắt đầu</Button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {onBack && <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Button>}
        <Button onClick={startGame} className="bg-gradient-to-r from-pink-500 to-purple-500">{isPlaying ? "Chơi lại" : "Bắt đầu"} 🎈</Button>
      </div>
    </div>
  );
}

export default BalloonPop3D;
