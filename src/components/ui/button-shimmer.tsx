import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  side: 'top' | 'right' | 'bottom' | 'left';
}

export const ButtonShimmer = ({ isHovered }: { isHovered: boolean }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles along all edges
    const newParticles: Particle[] = [];
    const particlesPerSide = 4;
    
    ['top', 'right', 'bottom', 'left'].forEach((side) => {
      for (let i = 0; i < particlesPerSide; i++) {
        const position = (i / (particlesPerSide - 1)) * 100;
        newParticles.push({
          id: Math.random(),
          x: side === 'top' || side === 'bottom' ? position : (side === 'left' ? 0 : 100),
          y: side === 'left' || side === 'right' ? position : (side === 'top' ? 0 : 100),
          size: 2 + Math.random() * 3,
          duration: 2 + Math.random() * 2,
          delay: Math.random() * 2,
          side: side as 'top' | 'right' | 'bottom' | 'left',
        });
      }
    });
    
    setParticles(newParticles);
  }, []);

  if (!isHovered) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => {
        const baseStyle = {
          left: `${particle.x}%`,
          top: `${particle.y}%`,
          width: `${particle.size}px`,
          height: `${particle.size}px`,
          animationDuration: `${particle.duration}s`,
          animationDelay: `${particle.delay}s`,
        };

        return (
          <div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-br from-cyan-300 via-purple-300 to-pink-300 opacity-0 animate-[sparkle_3s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[1px] shadow-[0_0_8px_currentColor]"
            style={baseStyle}
          />
        );
      })}
      
      {/* Additional floating orbs at corners */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 rounded-full bg-cyan-400/60 animate-[pulse_2s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[0.5px] shadow-[0_0_6px_currentColor]" 
           style={{ animationDelay: '0s, 0.3s' }} />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-[pulse_2.5s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[0.5px] shadow-[0_0_6px_currentColor]" 
           style={{ animationDelay: '0.5s, 0.8s' }} />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-pink-400/60 animate-[pulse_2.2s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[0.5px] shadow-[0_0_6px_currentColor]" 
           style={{ animationDelay: '1s, 1.3s' }} />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 rounded-full bg-cyan-300/60 animate-[pulse_2.8s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[0.5px] shadow-[0_0_6px_currentColor]" 
           style={{ animationDelay: '1.5s, 1.8s' }} />
      
      {/* Midpoint shimmer particles */}
      <div className="absolute top-0 left-1/2 w-2 h-2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-300 to-purple-300 opacity-70 animate-[pulse_1.8s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[1px] shadow-[0_0_10px_currentColor]" 
           style={{ animationDelay: '0.2s, 0.5s' }} />
      <div className="absolute bottom-0 left-1/2 w-2 h-2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-300 to-pink-300 opacity-70 animate-[pulse_2.1s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[1px] shadow-[0_0_10px_currentColor]" 
           style={{ animationDelay: '0.7s, 1s' }} />
      <div className="absolute left-0 top-1/2 w-2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-b from-cyan-300 to-pink-300 opacity-70 animate-[pulse_2.4s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[1px] shadow-[0_0_10px_currentColor]" 
           style={{ animationDelay: '1.2s, 1.5s' }} />
      <div className="absolute right-0 top-1/2 w-2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-b from-purple-300 to-cyan-300 opacity-70 animate-[pulse_1.9s_ease-in-out_infinite,rainbow-spectrum_4s_linear_infinite] blur-[1px] shadow-[0_0_10px_currentColor]" 
           style={{ animationDelay: '1.7s, 2s' }} />
    </div>
  );
};
