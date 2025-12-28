import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Angel Wing Component
function AngelWing({ side }: { side: 'left' | 'right' }) {
  const wingRef = useRef<THREE.Group>(null);
  const direction = side === 'left' ? 1 : -1;
  
  useFrame(({ clock }) => {
    if (wingRef.current) {
      // Gentle flapping animation
      const flapAmount = Math.sin(clock.getElapsedTime() * 3) * 0.15;
      wingRef.current.rotation.z = direction * (0.3 + flapAmount);
    }
  });

  return (
    <group 
      ref={wingRef} 
      position={[direction * 0.35, 0.1, -0.1]}
      rotation={[0, direction * 0.2, direction * 0.3]}
    >
      {/* Wing feathers - layered ellipsoids */}
      <mesh position={[direction * 0.15, 0.15, 0]}>
        <sphereGeometry args={[0.25, 16, 8]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#fffacd"
          emissiveIntensity={0.2}
          transparent
          opacity={0.9}
        />
      </mesh>
      <mesh position={[direction * 0.25, 0, 0]} scale={[0.8, 0.6, 0.3]}>
        <sphereGeometry args={[0.3, 16, 8]} />
        <meshStandardMaterial 
          color="#fff8dc" 
          emissive="#ffd700"
          emissiveIntensity={0.1}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[direction * 0.35, -0.1, 0]} scale={[0.6, 0.4, 0.2]}>
        <sphereGeometry args={[0.25, 16, 8]} />
        <meshStandardMaterial 
          color="#ffffff" 
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}

// Halo Component
function Halo() {
  const haloRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (haloRef.current) {
      haloRef.current.rotation.z = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <mesh ref={haloRef} position={[0, 0.65, 0]} rotation={[Math.PI / 2 - 0.2, 0, 0]}>
      <torusGeometry args={[0.25, 0.03, 16, 32]} />
      <meshStandardMaterial 
        color="#ffd700"
        emissive="#ffa500"
        emissiveIntensity={0.8}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

// Pigtail Component
function Pigtail({ side }: { side: 'left' | 'right' }) {
  const direction = side === 'left' ? 1 : -1;
  
  return (
    <group position={[direction * 0.25, 0.35, 0]}>
      {/* Hair tie */}
      <mesh>
        <sphereGeometry args={[0.08, 12, 8]} />
        <meshStandardMaterial color="#ff69b4" />
      </mesh>
      {/* Pigtail */}
      <mesh position={[direction * 0.08, -0.05, 0]} rotation={[0, 0, direction * 0.3]}>
        <capsuleGeometry args={[0.06, 0.15, 8, 8]} />
        <meshStandardMaterial color="#8b4513" />
      </mesh>
    </group>
  );
}

// Main Angel Character
function AngelCharacter() {
  const groupRef = useRef<THREE.Group>(null);
  
  return (
    <Float
      speed={2}
      rotationIntensity={0.1}
      floatIntensity={0.5}
      floatingRange={[-0.1, 0.1]}
    >
      <group ref={groupRef} scale={1.2}>
        {/* Head */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.28, 32, 32]} />
          <meshStandardMaterial 
            color="#ffe4c4" 
            roughness={0.8}
          />
        </mesh>
        
        {/* Hair (bangs) */}
        <mesh position={[0, 0.52, 0.12]} scale={[1.1, 0.4, 0.6]}>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#8b4513" />
        </mesh>
        
        {/* Pigtails */}
        <Pigtail side="left" />
        <Pigtail side="right" />
        
        {/* Eyes */}
        <mesh position={[-0.08, 0.38, 0.22]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[0.08, 0.38, 0.22]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        
        {/* Eye sparkles */}
        <mesh position={[-0.06, 0.40, 0.26]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        <mesh position={[0.10, 0.40, 0.26]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
        </mesh>
        
        {/* Blush */}
        <mesh position={[-0.15, 0.32, 0.18]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#ffb6c1" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0.15, 0.32, 0.18]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#ffb6c1" transparent opacity={0.6} />
        </mesh>
        
        {/* Smile */}
        <mesh position={[0, 0.28, 0.24]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.05, 0.015, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
        
        {/* Body/Dress */}
        <mesh position={[0, -0.1, 0]}>
          <coneGeometry args={[0.35, 0.6, 16]} />
          <meshStandardMaterial 
            color="#ffb6c1"
            emissive="#ff69b4"
            emissiveIntensity={0.1}
          />
        </mesh>
        
        {/* Dress gradient layer */}
        <mesh position={[0, -0.2, 0]}>
          <coneGeometry args={[0.38, 0.45, 16]} />
          <meshStandardMaterial 
            color="#dda0dd"
            emissive="#9370db"
            emissiveIntensity={0.1}
            transparent
            opacity={0.8}
          />
        </mesh>
        
        {/* Collar/ribbon */}
        <mesh position={[0, 0.08, 0.1]}>
          <boxGeometry args={[0.12, 0.06, 0.05]} />
          <meshStandardMaterial color="#ffd700" />
        </mesh>
        
        {/* Wings */}
        <AngelWing side="left" />
        <AngelWing side="right" />
        
        {/* Halo */}
        <Halo />
        
        {/* Sparkles around angel */}
        <Sparkles
          count={30}
          scale={1.5}
          size={3}
          speed={0.4}
          opacity={0.8}
          color="#ffd700"
        />
      </group>
    </Float>
  );
}

// Exported Canvas wrapper
export function Angel3DButton({ onClick }: { onClick?: () => void }) {
  return (
    <div 
      className="w-20 h-24 cursor-pointer"
      onClick={onClick}
    >
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <pointLight position={[-2, 1, 1]} intensity={0.4} color="#ffb6c1" />
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#ffd700" />
        <AngelCharacter />
      </Canvas>
    </div>
  );
}

export default Angel3DButton;
