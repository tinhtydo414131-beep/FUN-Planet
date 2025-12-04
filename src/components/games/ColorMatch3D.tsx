import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Html, useProgress, Float, Sparkles, Text } from "@react-three/drei";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Game3DHUD, Game3DTutorial, Game3DGameOver } from "./3d/Game3DUI";
import { haptics } from "@/utils/haptics";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface ColorMatch3DProps {
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
          <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-white text-sm">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

const COLORS = [
  { name: "Đỏ", hex: "#ef4444" },
  { name: "Xanh lá", hex: "#22c55e" },
  { name: "Xanh dương", hex: "#3b82f6" },
  { name: "Vàng", hex: "#eab308" },
  { name: "Tím", hex: "#8b5cf6" },
  { name: "Hồng", hex: "#ec4899" },
  { name: "Cam", hex: "#f97316" },
  { name: "Cyan", hex: "#06b6d4" },
];

// 3D Color cube
function ColorCube({ 
  position, 
  color, 
  isTarget = false,
  onClick,
  isCorrect,
  isWrong
}: { 
  position: [number, number, number]; 
  color: string;
  isTarget?: boolean;
  onClick?: () => void;
  isCorrect?: boolean;
  isWrong?: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (ref.current) {
      if (isTarget) {
        ref.current.rotation.y = state.clock.elapsedTime * 0.5;
        ref.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
      }
      if (hovered && !isTarget) {
        ref.current.scale.setScalar(1.1);
      } else {
        ref.current.scale.setScalar(1);
      }
      if (isCorrect) {
        ref.current.scale.setScalar(1.2);
      }
      if (isWrong) {
        ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 30) * 0.1;
      }
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={ref} 
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={isTarget ? [2, 2, 2] : [1.2, 1.2, 1.2]} />
        <meshStandardMaterial 
          color={color} 
          metalness={0.3} 
          roughness={0.4}
          emissive={color}
          emissiveIntensity={isTarget ? 0.3 : hovered ? 0.2 : 0.1}
        />
      </mesh>
      {isCorrect && <Sparkles count={30} scale={3} size={5} color="#ffd700" />}
      {isTarget && (
        <Float speed={2} floatIntensity={0.5}>
          <mesh position={[0, 1.8, 0]}>
            <coneGeometry args={[0.3, 0.5, 4]} />
            <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.5} />
          </mesh>
        </Float>
      )}
    </group>
  );
}

// Text display showing color name
function ColorText({ text, color, position }: { text: string; color: string; position: [number, number, number] }) {
  return (
    <Html position={position} center>
      <div className="px-6 py-3 bg-black/70 backdrop-blur-sm rounded-xl border-2" style={{ borderColor: color }}>
        <span className="text-2xl font-bold text-white">{text}</span>
      </div>
    </Html>
  );
}

export function ColorMatch3D({ level = 1, onLevelComplete, onBack }: ColorMatch3DProps) {
  const targetMatches = 10 + level * 3;
  const timeLimit = 45 + level * 5;
  const numOptions = Math.min(4 + Math.floor(level / 2), 8);

  const [targetColor, setTargetColor] = useState(COLORS[0]);
  const [options, setOptions] = useState<typeof COLORS>([]);
  const [score, setScore] = useState(0);
  const [matches, setMatches] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [isWin, setIsWin] = useState(false);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [wrongIndex, setWrongIndex] = useState<number | null>(null);

  useEffect(() => {
    const shown = localStorage.getItem("colormatch3d_tutorial");
    if (shown) setShowTutorial(false);
  }, []);

  const generateRound = useCallback(() => {
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const opts = shuffled.slice(0, numOptions);
    
    // Make sure target is in options
    if (!opts.includes(target)) {
      opts[Math.floor(Math.random() * opts.length)] = target;
    }
    
    setTargetColor(target);
    setOptions(opts.sort(() => Math.random() - 0.5));
    setCorrectIndex(null);
    setWrongIndex(null);
  }, [numOptions]);

  useEffect(() => {
    if (isPlaying) generateRound();
  }, [isPlaying, generateRound]);

  // Timer
  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          if (matches >= targetMatches) {
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
  }, [isPlaying, timeLeft, matches, targetMatches, onLevelComplete]);

  const handleColorClick = (index: number) => {
    if (!isPlaying || correctIndex !== null || wrongIndex !== null) return;

    const selected = options[index];
    
    if (selected.hex === targetColor.hex) {
      setCorrectIndex(index);
      setCombo(c => c + 1);
      const bonusPoints = 100 * (1 + combo * 0.1);
      setScore(s => s + Math.floor(bonusPoints));
      setEarnedCoins(c => c + 50);
      setMatches(m => {
        const newM = m + 1;
        if (newM >= targetMatches) {
          toast.success("🎉 Level hoàn thành!");
          haptics.success();
          setIsWin(true);
          setShowGameOver(true);
          setIsPlaying(false);
          onLevelComplete?.();
        }
        return newM;
      });
      haptics.success();
      setTimeout(generateRound, 800);
    } else {
      setWrongIndex(index);
      setCombo(0);
      setLives(l => {
        if (l <= 1) {
          setIsWin(false);
          setShowGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        toast.error("Sai màu! 💔");
        haptics.error();
        return l - 1;
      });
      setTimeout(() => setWrongIndex(null), 500);
    }
  };

  const startGame = () => {
    setScore(0);
    setMatches(0);
    setEarnedCoins(0);
    setCombo(0);
    setLives(3);
    setTimeLeft(timeLimit);
    setIsPlaying(true);
    setShowGameOver(false);
    generateRound();
  };

  // Calculate option positions in a circle
  const getOptionPosition = (index: number, total: number): [number, number, number] => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 4;
    return [Math.cos(angle) * radius, -1, Math.sin(angle) * radius - 2];
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full h-full">
      {showTutorial && (
        <Game3DTutorial
          isOpen={showTutorial}
          onClose={() => { localStorage.setItem("colormatch3d_tutorial", "true"); setShowTutorial(false); }}
          onStart={() => { localStorage.setItem("colormatch3d_tutorial", "true"); setShowTutorial(false); startGame(); }}
          gameTitle="Ghép Màu 3D"
          gameIcon="🎨"
          howToPlay={["Xem tên màu hiển thị", "Click khối màu tương ứng", "Combo liên tục để x điểm", "Cẩn thận, chọn sai mất mạng!"]}
          objectives={[`Ghép đúng ${targetMatches} màu`, `Trong ${timeLimit} giây`]}
          rewards={{ perLevel: 5000, firstPlay: 10000, combo: 3000 }}
        />
      )}

      {showGameOver && (
        <Game3DGameOver isOpen={showGameOver} onClose={() => setShowGameOver(false)} onRestart={startGame} onHome={() => onBack?.()} isWin={isWin} score={score} coinsEarned={earnedCoins} level={level} stats={[{ label: "Đúng", value: matches }, { label: "Combo max", value: combo }]} />
      )}

      <div className="relative w-full aspect-video max-w-[700px] rounded-xl overflow-hidden bg-gradient-to-b from-purple-600 to-indigo-900">
        {isPlaying && (
          <>
            <Game3DHUD score={score} level={level} lives={lives} maxLives={3} coins={earnedCoins} combo={combo} targetScore={targetMatches * 100} timeLeft={timeLeft} />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full text-white font-bold">
              {matches} / {targetMatches} 🎨
            </div>
          </>
        )}
        
        <Canvas dpr={[1, 2]} camera={{ position: [0, 5, 8], fov: 50 }}>
          <Suspense fallback={<Loader />}>
            <Environment preset="night" background={false} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
            <pointLight position={[0, 5, 0]} intensity={0.5} color="#8b5cf6" />

            {/* Target color cube */}
            <ColorCube position={[0, 2, -3]} color={targetColor.hex} isTarget />
            
            {/* Color name display */}
            <ColorText text={targetColor.name} color={targetColor.hex} position={[0, 4.5, -3]} />

            {/* Option cubes */}
            {options.map((color, i) => (
              <ColorCube
                key={i}
                position={getOptionPosition(i, options.length)}
                color={color.hex}
                onClick={() => handleColorClick(i)}
                isCorrect={correctIndex === i}
                isWrong={wrongIndex === i}
              />
            ))}

            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#1e1b4b" metalness={0.5} roughness={0.5} />
            </mesh>

            {/* Ambient particles */}
            <Sparkles count={50} scale={15} size={2} speed={0.3} color="#8b5cf6" opacity={0.3} />

            <fog attach="fog" args={["#1e1b4b", 10, 30]} />
          </Suspense>
        </Canvas>
        
        {!isPlaying && !showTutorial && !showGameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
              <div className="text-6xl mb-4">🎨</div>
              <h2 className="text-2xl font-bold text-white mb-2">Ghép Màu 3D</h2>
              <Button onClick={startGame} size="lg" className="bg-purple-500 hover:bg-purple-600">Bắt đầu</Button>
            </motion.div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {onBack && <Button onClick={onBack} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Button>}
        <Button onClick={startGame} className="bg-gradient-to-r from-purple-500 to-pink-500">{isPlaying ? "Chơi lại" : "Bắt đầu"} 🎨</Button>
      </div>
    </div>
  );
}

export default ColorMatch3D;
