import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

// 🎀 PASTEL CUTE BUTTON PARTICLES - Kids Gaming 2025
export const ButtonParticles = ({ isHovered }: { isHovered: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 🌈 Pastel rainbow colors
    const colors = [
      "rgba(236, 72, 153, 0.9)",   // Pink
      "rgba(168, 85, 247, 0.9)",   // Purple
      "rgba(96, 165, 250, 0.9)",   // Blue
      "rgba(52, 211, 153, 0.9)",   // Mint
      "rgba(251, 191, 36, 0.9)",   // Yellow
      "rgba(255, 255, 255, 0.95)", // White sparkle
    ];

    const createParticle = () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.8 + Math.random() * 2;
      
      particlesRef.current.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5, // Upward bias for magical feel
        life: 1,
        size: 1.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    let lastTime = Date.now();
    let particleTimer = 0;

    const animate = () => {
      const now = Date.now();
      const deltaTime = now - lastTime;
      lastTime = now;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create particles when hovering
      if (isHovered) {
        particleTimer += deltaTime;
        if (particleTimer > 80) { // Create particles every 80ms (slower)
          createParticle();
          particleTimer = 0;
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.015;

        if (particle.life <= 0) return false;

        ctx.save();
        ctx.globalAlpha = particle.life;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = particle.color;
        
        // Draw star shape for sparkle effect ✨
        ctx.beginPath();
        const spikes = 4;
        const outerRadius = particle.size;
        const innerRadius = particle.size / 2;
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes;
          const x = particle.x + Math.cos(angle) * radius;
          const y = particle.y + Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();

        return true;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isHovered]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={100}
      className="absolute inset-0 pointer-events-none z-20"
      style={{ width: "100%", height: "100%" }}
    />
  );
};
