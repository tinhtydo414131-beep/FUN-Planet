import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Float, Sparkles, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import angelAvatarUrl from "@/assets/angel-ai-avatar.jpg";

// Glowing orb particle
function GlowingOrb({ position, color, size = 0.05 }: { position: [number, number, number]; color: string; size?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const initialY = position[1];
  const speed = useMemo(() => Math.random() * 0.5 + 0.5, []);
  const amplitude = useMemo(() => Math.random() * 0.3 + 0.1, []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = initialY + Math.sin(state.clock.elapsedTime * speed) * amplitude;
      ref.current.scale.setScalar(size * (1 + Math.sin(state.clock.elapsedTime * 2) * 0.3));
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
}

// Halo with glow effect
function Halo() {
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (haloRef.current) {
      haloRef.current.rotation.z = state.clock.elapsedTime * 0.3;
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      haloRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group position={[0, 0.9, 0]}>
      {/* Main halo ring */}
      <mesh ref={haloRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.05, 8, 32]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.9} />
      </mesh>
      {/* Halo glow */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.35, 0.15, 8, 32]} />
        <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
      </mesh>
      {/* Inner glow */}
      <pointLight color="#FFD700" intensity={0.5} distance={1} />
    </group>
  );
}

// Light rays emanating from character
function LightRays() {
  const raysRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (raysRef.current) {
      raysRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  const rays = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      rotation: (i * Math.PI) / 4,
      length: 1.5 + Math.random() * 0.5,
    }));
  }, []);

  return (
    <group ref={raysRef} position={[0, 0, -0.5]}>
      {rays.map((ray, i) => (
        <mesh key={i} rotation={[0, 0, ray.rotation]} position={[0, 0, 0]}>
          <planeGeometry args={[0.02, ray.length]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// Ellipse geometry helper for wings
function EllipseGeometry({ radiusX, radiusY, segments = 32 }: { radiusX: number; radiusY: number; segments?: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector2(Math.cos(angle) * radiusX, Math.sin(angle) * radiusY));
    }
    return pts;
  }, [radiusX, radiusY, segments]);
  
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      s.lineTo(points[i].x, points[i].y);
    }
    s.closePath();
    return s;
  }, [points]);

  return <shapeGeometry args={[shape]} />;
}

// Main angel character with texture
function AngelCharacter() {
  const texture = useLoader(TextureLoader, angelAvatarUrl);
  const meshRef = useRef<THREE.Mesh>(null);

  // Configure texture
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle breathing/pulsing effect
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
      meshRef.current.scale.set(pulse, pulse, 1);
    }
  });

  // Sparkle colors for variety
  const sparklePositions = useMemo(() => {
    const colors = ["#FFD700", "#FF69B4", "#87CEEB", "#98FB98", "#DDA0DD", "#FFA500"];
    return Array.from({ length: 15 }, () => ({
      position: [
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 2.5,
        (Math.random() - 0.5) * 0.5,
      ] as [number, number, number],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 0.06 + 0.03,
    }));
  }, []);

  return (
    <Float
      speed={2}
      rotationIntensity={0.3}
      floatIntensity={0.5}
      floatingRange={[-0.1, 0.1]}
    >
      <group>
        {/* Background glow */}
        <mesh position={[0, 0, -0.3]}>
          <circleGeometry args={[1.2, 32]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.15}
          />
        </mesh>

        {/* Light rays behind */}
        <LightRays />

        {/* Halo above */}
        <Halo />

        {/* Main character image on circular plane */}
        <Billboard follow lockX={false} lockY={false} lockZ={false}>
          <mesh ref={meshRef}>
            <circleGeometry args={[0.8, 64]} />
            <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
          </mesh>
        </Billboard>

        {/* Glowing border */}
        <mesh position={[0, 0, -0.01]}>
          <ringGeometry args={[0.78, 0.85, 64]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.6} />
        </mesh>

        {/* Wing glow - left */}
        <mesh position={[-0.9, 0, -0.2]} rotation={[0, 0, 0.3]}>
          <EllipseGeometry radiusX={0.3} radiusY={0.5} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>

        {/* Wing glow - right */}
        <mesh position={[0.9, 0, -0.2]} rotation={[0, 0, -0.3]}>
          <EllipseGeometry radiusX={0.3} radiusY={0.5} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>

        {/* Colored glowing orbs */}
        {sparklePositions.map((sp, i) => (
          <GlowingOrb key={i} position={sp.position} color={sp.color} size={sp.size} />
        ))}

        {/* Main sparkles effect */}
        <Sparkles
          count={60}
          scale={3}
          size={4}
          speed={0.4}
          opacity={0.8}
          color="#FFD700"
        />

        {/* Pink sparkles */}
        <Sparkles
          count={30}
          scale={2.5}
          size={3}
          speed={0.3}
          opacity={0.6}
          color="#FF69B4"
        />

        {/* Blue sparkles */}
        <Sparkles
          count={20}
          scale={2}
          size={2}
          speed={0.5}
          opacity={0.5}
          color="#87CEEB"
        />

        {/* Ambient point lights for magical glow */}
        <pointLight position={[0, 0, 1]} color="#FFD700" intensity={0.3} distance={3} />
        <pointLight position={[-1, 0.5, 0.5]} color="#FF69B4" intensity={0.2} distance={2} />
        <pointLight position={[1, 0.5, 0.5]} color="#87CEEB" intensity={0.2} distance={2} />
      </group>
    </Float>
  );
}

// Exported Canvas wrapper
export function Angel3DButton({ onClick }: { onClick?: () => void }) {
  return (
    <div 
      className="w-20 h-20 cursor-pointer"
      onClick={onClick}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 2, 2]} intensity={0.8} />
        <AngelCharacter />
      </Canvas>
    </div>
  );
}

export default Angel3DButton;
