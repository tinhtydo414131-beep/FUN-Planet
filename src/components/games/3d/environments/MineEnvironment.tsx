import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Float, Sparkles } from "@react-three/drei";

// Cave walls
function CaveWall({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={[10, 8, 1]} />
      <meshStandardMaterial 
        color="#4a3728" 
        roughness={0.9}
        metalness={0.1}
      />
    </mesh>
  );
}

// Gold ore vein
export function GoldOre({ 
  position, 
  size = 0.5,
  value = 10,
  onClick 
}: { 
  position: [number, number, number]; 
  size?: number;
  value?: number;
  onClick?: (value: number) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ref.current) {
      // Subtle shimmer effect
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
      <mesh
        ref={ref}
        position={position}
        onClick={() => onClick?.(value)}
        castShadow
      >
        <dodecahedronGeometry args={[size, 0]} />
        <meshStandardMaterial 
          color="#ffd700" 
          metalness={0.8}
          roughness={0.2}
          emissive="#ffd700"
          emissiveIntensity={0.2}
        />
      </mesh>
      <Sparkles 
        position={position} 
        count={5} 
        scale={size * 2} 
        size={2} 
        color="#ffd700" 
      />
    </Float>
  );
}

// Rock/dirt block
export function Rock({ 
  position, 
  size = 1,
  durability = 3,
  onBreak 
}: { 
  position: [number, number, number]; 
  size?: number;
  durability?: number;
  onBreak?: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hits, setHits] = useState(0);

  const handleClick = () => {
    const newHits = hits + 1;
    setHits(newHits);
    
    if (newHits >= durability) {
      onBreak?.();
    }
  };

  // Calculate damage color
  const damageRatio = hits / durability;
  const color = new THREE.Color("#8B7355").lerp(new THREE.Color("#4a3728"), damageRatio);

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={handleClick}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[size, size, size]} />
      <meshStandardMaterial 
        color={color}
        roughness={0.9}
        metalness={0}
      />
    </mesh>
  );
}

// Import useState at the top
import { useState } from "react";

// Gem collectible
export function Gem({ 
  position, 
  color = "#ff00ff",
  value = 50,
  onClick 
}: { 
  position: [number, number, number]; 
  color?: string;
  value?: number;
  onClick?: (value: number) => void;
}) {
  return (
    <Float speed={3} rotationIntensity={1} floatIntensity={0.5}>
      <mesh
        position={position}
        onClick={() => onClick?.(value)}
        castShadow
      >
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial 
          color={color}
          metalness={0.5}
          roughness={0.1}
          transparent
          opacity={0.8}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
      <pointLight position={position} color={color} intensity={0.5} distance={2} />
    </Float>
  );
}

// Torch light
export function Torch({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (lightRef.current) {
      // Flickering effect
      lightRef.current.intensity = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Torch body */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.08, 0.4]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      {/* Flame */}
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>
      {/* Light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.3, 0]}
        color="#ff9933"
        intensity={1}
        distance={8}
        castShadow
      />
      <Sparkles position={[0, 0.3, 0]} count={3} scale={0.5} size={3} color="#ff6600" />
    </group>
  );
}

// Complete mine environment
export function MineEnvironment({ children }: { children?: React.ReactNode }) {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#3d2817" roughness={1} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#2d1f14" />
      </mesh>

      {/* Cave walls */}
      <CaveWall position={[0, 4, -15]} />
      <CaveWall position={[0, 4, 15]} rotation={[0, Math.PI, 0]} />
      <CaveWall position={[-15, 4, 0]} rotation={[0, Math.PI / 2, 0]} />
      <CaveWall position={[15, 4, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Torches */}
      <Torch position={[-5, 3, -14]} />
      <Torch position={[5, 3, -14]} />
      <Torch position={[-5, 3, 14]} />
      <Torch position={[5, 3, 14]} />

      {/* Ambient particles */}
      <Sparkles
        count={50}
        scale={20}
        size={1}
        speed={0.2}
        color="#ffd700"
        opacity={0.3}
      />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={["#1a1008", 5, 30]} />

      {children}
    </group>
  );
}

export default MineEnvironment;
