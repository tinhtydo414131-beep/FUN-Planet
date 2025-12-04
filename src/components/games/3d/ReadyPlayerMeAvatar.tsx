import { useRef, useEffect, useState } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useAnimations, Clone } from "@react-three/drei";
import * as THREE from "three";

interface ReadyPlayerMeAvatarProps {
  avatarUrl?: string;
  userId?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  animation?: "idle" | "walk" | "run" | "jump" | "attack" | "dance" | "wave";
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Default avatar for users without Ready Player Me avatar
const DEFAULT_AVATAR_URL = "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb";

// Animation URLs from Mixamo (converted to GLB)
const ANIMATION_URLS = {
  idle: "https://threejs.org/examples/models/gltf/Soldier.glb", // Placeholder
  walk: "https://threejs.org/examples/models/gltf/Soldier.glb",
  run: "https://threejs.org/examples/models/gltf/Soldier.glb",
  jump: "https://threejs.org/examples/models/gltf/Soldier.glb",
  attack: "https://threejs.org/examples/models/gltf/Soldier.glb",
  dance: "https://threejs.org/examples/models/gltf/Soldier.glb",
  wave: "https://threejs.org/examples/models/gltf/Soldier.glb",
};

export function ReadyPlayerMeAvatar({
  avatarUrl,
  userId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  animation = "idle",
  onLoad,
  onError,
}: ReadyPlayerMeAvatarProps) {
  const group = useRef<THREE.Group>(null);
  const [modelUrl, setModelUrl] = useState<string>(DEFAULT_AVATAR_URL);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Construct Ready Player Me URL if userId is provided
  useEffect(() => {
    if (avatarUrl) {
      setModelUrl(avatarUrl);
    } else if (userId) {
      // Ready Player Me avatar URL format
      const rpmUrl = `https://api.readyplayer.me/v1/avatars/${userId}.glb?morphTargets=ARKit&textureAtlas=1024`;
      setModelUrl(rpmUrl);
    }
  }, [avatarUrl, userId]);

  // Load the GLB model
  let gltf;
  try {
    gltf = useLoader(GLTFLoader, modelUrl);
  } catch (e) {
    console.error("Error loading avatar:", e);
    const err = e instanceof Error ? e : new Error("Failed to load avatar");
    setError(err);
    onError?.(err);
    setModelUrl(DEFAULT_AVATAR_URL);
    gltf = useLoader(GLTFLoader, DEFAULT_AVATAR_URL);
  }

  // Handle animations
  const { actions, names } = useAnimations(gltf.animations, group);

  useEffect(() => {
    if (names.length > 0) {
      // Play the first available animation or the requested one
      const actionName = names.find(n => n.toLowerCase().includes(animation)) || names[0];
      if (actionName && actions[actionName]) {
        actions[actionName]?.reset().fadeIn(0.5).play();
      }
    }
    
    setIsLoading(false);
    onLoad?.();
    
    return () => {
      // Cleanup animations
      Object.values(actions).forEach(action => action?.stop());
    };
  }, [actions, names, animation, onLoad]);

  // Simple idle animation fallback
  useFrame((state) => {
    if (group.current && names.length === 0) {
      // Subtle breathing/idle motion if no animations
      group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });

  if (error && modelUrl === DEFAULT_AVATAR_URL) {
    // Render a simple placeholder if even default fails
    return (
      <group ref={group} position={position} rotation={rotation} scale={scale}>
        <mesh castShadow>
          <capsuleGeometry args={[0.3, 1, 4, 8]} />
          <meshStandardMaterial color="#4ECDC4" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color="#FFE4C4" />
        </mesh>
      </group>
    );
  }

  return (
    <group 
      ref={group} 
      position={position} 
      rotation={rotation as any}
      scale={scale}
      dispose={null}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

// Simple character without Ready Player Me (for fallback)
export function SimpleCharacter({
  position = [0, 0, 0] as [number, number, number],
  rotation = [0, 0, 0] as [number, number, number],
  scale = 1,
  color = "#4ECDC4",
  animation = "idle"
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  color?: string;
  animation?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const [isJumping, setIsJumping] = useState(false);

  useFrame((state) => {
    if (!group.current) return;
    
    const t = state.clock.elapsedTime;
    
    switch (animation) {
      case "idle":
        // Subtle breathing
        group.current.position.y = position[1] + Math.sin(t * 2) * 0.03;
        break;
      case "walk":
        // Walking bob
        group.current.position.y = position[1] + Math.abs(Math.sin(t * 8)) * 0.1;
        break;
      case "run":
        // Running bob
        group.current.position.y = position[1] + Math.abs(Math.sin(t * 12)) * 0.15;
        break;
      case "jump":
        if (!isJumping) {
          setIsJumping(true);
          setTimeout(() => setIsJumping(false), 500);
        }
        group.current.position.y = position[1] + Math.sin(t * 10) * 0.5;
        break;
    }
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      {/* Body */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.6, 4, 8]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" metalness={0} roughness={0.9} />
      </mesh>
      
      {/* Eyes */}
      <mesh position={[-0.08, 1.35, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      <mesh position={[0.08, 1.35, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Arms */}
      <mesh position={[-0.35, 0.7, 0]} rotation={[0, 0, 0.3]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0.35, 0.7, 0]} rotation={[0, 0, -0.3]} castShadow>
        <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Legs */}
      <mesh position={[-0.12, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
        <meshStandardMaterial color="#333366" />
      </mesh>
      <mesh position={[0.12, 0.2, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.3, 4, 8]} />
        <meshStandardMaterial color="#333366" />
      </mesh>
    </group>
  );
}

export default ReadyPlayerMeAvatar;
