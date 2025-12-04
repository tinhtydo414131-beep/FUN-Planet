import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, Sparkles, Stars } from "@react-three/drei";

interface MazeCell {
  x: number;
  z: number;
  isWall: boolean;
}

// Generate a simple maze
export function generateMaze3D(size: number): boolean[][] {
  const maze: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
  
  // Add border walls
  for (let i = 0; i < size; i++) {
    maze[0][i] = true;
    maze[size - 1][i] = true;
    maze[i][0] = true;
    maze[i][size - 1] = true;
  }
  
  // Add internal walls (simple pattern)
  for (let y = 2; y < size - 2; y += 2) {
    for (let x = 2; x < size - 2; x += 2) {
      maze[y][x] = true;
      // Random extension
      const dir = Math.floor(Math.random() * 4);
      if (dir === 0 && y > 1) maze[y - 1][x] = true;
      if (dir === 1 && y < size - 2) maze[y + 1][x] = true;
      if (dir === 2 && x > 1) maze[y][x - 1] = true;
      if (dir === 3 && x < size - 2) maze[y][x + 1] = true;
    }
  }
  
  // Ensure start and goal are clear
  maze[1][1] = false;
  maze[size - 2][size - 2] = false;
  
  return maze;
}

// Wall segment
function MazeWall({ position, height = 3 }: { position: [number, number, number]; height?: number }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[1, height, 1]} />
      <meshStandardMaterial 
        color="#2d3a4f"
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
}

// Glowing collectible
export function MazeCollectible({ 
  position, 
  type = "coin",
  onClick 
}: { 
  position: [number, number, number];
  type?: "coin" | "key" | "gem";
  onClick?: () => void;
}) {
  const colors = {
    coin: "#ffd700",
    key: "#c0c0c0",
    gem: "#ff00ff"
  };
  
  const emojis = {
    coin: "🪙",
    key: "🔑",
    gem: "💎"
  };

  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={0.5}>
      <group position={position} onClick={onClick}>
        <mesh castShadow>
          {type === "coin" && <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />}
          {type === "key" && <boxGeometry args={[0.2, 0.5, 0.1]} />}
          {type === "gem" && <octahedronGeometry args={[0.3, 0]} />}
          <meshStandardMaterial 
            color={colors[type]}
            metalness={0.8}
            roughness={0.2}
            emissive={colors[type]}
            emissiveIntensity={0.3}
          />
        </mesh>
        <pointLight color={colors[type]} intensity={0.5} distance={3} />
        <Sparkles count={5} scale={1} size={2} color={colors[type]} />
      </group>
    </Float>
  );
}

// Ghost enemy
export function MazeGhost({ 
  position, 
  onCatch 
}: { 
  position: [number, number, number];
  onCatch?: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      // Floating motion
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.3;
      // Slight rotation
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.3;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.5, 4, 8]} />
        <meshStandardMaterial 
          color="#8b5cf6"
          transparent
          opacity={0.7}
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 0.2, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[0.12, 0.2, 0.25]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <pointLight color="#8b5cf6" intensity={0.5} distance={3} />
    </group>
  );
}

// Goal portal
export function MazeGoal({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime;
    }
  });

  return (
    <group position={position}>
      {/* Portal ring */}
      <mesh ref={ref}>
        <torusGeometry args={[0.6, 0.1, 16, 32]} />
        <meshStandardMaterial 
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.5}
          metalness={0.8}
        />
      </mesh>
      {/* Inner glow */}
      <mesh>
        <circleGeometry args={[0.5, 32]} />
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

// Complete maze environment
export function MazeEnvironment({ 
  maze, 
  cellSize = 2,
  children 
}: { 
  maze: boolean[][];
  cellSize?: number;
  children?: React.ReactNode;
}) {
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
        <MazeWall key={i} position={pos} />
      ))}

      {/* Sky */}
      <Stars radius={100} depth={50} count={1000} factor={4} fade />

      {/* Fog for mystery */}
      <fog attach="fog" args={["#0a0e1a", 5, 40]} />

      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 10, 0]} intensity={0.5} color="#4a90d9" />

      {children}
    </group>
  );
}

export default MazeEnvironment;
