import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows,
  Html,
  useProgress,
  AdaptiveDpr,
  AdaptiveEvents,
  Preload,
  PerformanceMonitor
} from "@react-three/drei";
import * as THREE from "three";

interface Game3DEngineProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  environmentPreset?: "sunset" | "dawn" | "night" | "warehouse" | "forest" | "apartment" | "studio" | "city" | "park" | "lobby";
  enableShadows?: boolean;
  enablePostProcessing?: boolean;
  onPerformanceDrop?: () => void;
  className?: string;
}

// Loading screen component
function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-white">
        <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm font-medium">Loading 3D... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}

// Camera controller for smooth follow
export function CameraController({ 
  target, 
  offset = [0, 5, 10],
  smoothness = 0.1 
}: { 
  target?: THREE.Vector3 | [number, number, number];
  offset?: [number, number, number];
  smoothness?: number;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3());
  const cameraPos = useRef(new THREE.Vector3());

  useFrame(() => {
    if (target) {
      const targetVec = target instanceof THREE.Vector3 
        ? target 
        : new THREE.Vector3(...target);
      
      targetPos.current.lerp(targetVec, smoothness);
      cameraPos.current.set(
        targetVec.x + offset[0],
        targetVec.y + offset[1],
        targetVec.z + offset[2]
      );
      camera.position.lerp(cameraPos.current, smoothness);
      camera.lookAt(targetPos.current);
    }
  });

  return null;
}

// Performance adaptive quality
function AdaptiveQuality({ onLowPerformance }: { onLowPerformance?: () => void }) {
  return (
    <PerformanceMonitor
      onDecline={() => {
        console.log("Performance declining, reducing quality");
        onLowPerformance?.();
      }}
    />
  );
}

// Main 3D Engine component
export function Game3DEngine({
  children,
  cameraPosition = [0, 5, 10],
  cameraTarget = [0, 0, 0],
  environmentPreset = "sunset",
  enableShadows = true,
  enablePostProcessing = false,
  onPerformanceDrop,
  className = ""
}: Game3DEngineProps) {
  const [dpr, setDpr] = useState<[number, number]>([1, 2]);
  const [isLowEnd, setIsLowEnd] = useState(false);

  // Detect low-end devices
  useEffect(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!gl) {
      setIsLowEnd(true);
      return;
    }
    
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Check for mobile/integrated GPUs
      if (
        renderer.toLowerCase().includes("mali") ||
        renderer.toLowerCase().includes("adreno") ||
        renderer.toLowerCase().includes("intel")
      ) {
        setDpr([0.5, 1]);
        setIsLowEnd(true);
      }
    }
  }, []);

  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas
        shadows={enableShadows && !isLowEnd}
        dpr={dpr}
        gl={{ 
          antialias: !isLowEnd,
          powerPreference: "high-performance",
          alpha: false,
          stencil: false,
          depth: true
        }}
        camera={{ position: cameraPosition, fov: 60, near: 0.1, far: 1000 }}
        style={{ touchAction: "none" }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <AdaptiveQuality onLowPerformance={onPerformanceDrop} />
        
        <Suspense fallback={<Loader />}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={1}
            castShadow={enableShadows && !isLowEnd}
            shadow-mapSize={isLowEnd ? [512, 512] : [1024, 1024]}
            shadow-camera-near={0.1}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[-10, 5, -10]} intensity={0.5} />
          
          {/* Environment */}
          <Environment preset={environmentPreset} background={false} />
          
          {/* Contact shadows for grounded look */}
          {enableShadows && !isLowEnd && (
            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.5}
              scale={40}
              blur={2}
              far={10}
            />
          )}
          
          {/* Game content */}
          {children}
          
          <Preload all />
        </Suspense>
        
        {/* Default orbit controls - can be overridden by children */}
        <OrbitControls 
          target={cameraTarget}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={3}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
}

// Ground plane component
export function Ground({ 
  size = 100, 
  color = "#4a9c5d",
  receiveShadow = true 
}: { 
  size?: number; 
  color?: string;
  receiveShadow?: boolean;
}) {
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0, 0]} 
      receiveShadow={receiveShadow}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// Animated floating object
export function FloatingObject({ 
  children, 
  amplitude = 0.5, 
  speed = 1 
}: { 
  children: React.ReactNode;
  amplitude?: number;
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = Math.sin(state.clock.elapsedTime * speed) * amplitude;
      ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });
  
  return <group ref={ref}>{children}</group>;
}

// Simple box with physics-like interaction
export function InteractiveBox({
  position = [0, 0.5, 0] as [number, number, number],
  size = [1, 1, 1] as [number, number, number],
  color = "#ff6b6b",
  onClick,
}: {
  position?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  onClick?: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame(() => {
    if (ref.current) {
      ref.current.scale.setScalar(hovered ? 1.1 : 1);
      if (clicked) {
        ref.current.rotation.y += 0.1;
      }
    }
  });

  return (
    <mesh
      ref={ref}
      position={position}
      onClick={() => {
        setClicked(true);
        onClick?.();
        setTimeout(() => setClicked(false), 500);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      castShadow
    >
      <boxGeometry args={size} />
      <meshStandardMaterial 
        color={hovered ? "#ffd93d" : color} 
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

// Particle system for effects
export function ParticleSystem({
  count = 100,
  color = "#ffffff",
  size = 0.1,
  spread = 10,
  speed = 0.01
}: {
  count?: number;
  color?: string;
  size?: number;
  spread?: number;
  speed?: number;
}) {
  const points = useRef<THREE.Points>(null);
  
  const particlesPosition = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    particlesPosition[i] = (Math.random() - 0.5) * spread;
  }

  useFrame(() => {
    if (points.current) {
      points.current.rotation.y += speed;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particlesPosition}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color={color}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export default Game3DEngine;
