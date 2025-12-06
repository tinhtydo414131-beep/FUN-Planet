import { useRef, useEffect, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'star' | 'merge' | 'spawn' | 'trail';
  alpha: number;
}

interface NexusParticleSystemProps {
  width: number;
  height: number;
  mergeEffects: { x: number; y: number; color: string; value: number }[];
  spawnEffects: { x: number; y: number }[];
  isGameOver: boolean;
  isWin: boolean;
}

export const NexusParticleSystem = ({
  width,
  height,
  mergeEffects,
  spawnEffects,
  isGameOver,
  isWin
}: NexusParticleSystemProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);

  // Star colors for background
  const starColors = ['#00FFFF', '#FF00FF', '#00BFFF', '#FFD700', '#FF1493', '#7B68EE'];

  const createParticle = useCallback((
    x: number,
    y: number,
    type: Particle['type'],
    color: string = '#00FFFF'
  ): Particle => {
    const angle = Math.random() * Math.PI * 2;
    const speed = type === 'merge' ? 2 + Math.random() * 4 : 
                  type === 'star' ? 0.1 + Math.random() * 0.3 :
                  type === 'spawn' ? 1 + Math.random() * 2 : 0.5;
    
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: type === 'star' ? 200 + Math.random() * 300 : 30 + Math.random() * 30,
      maxLife: type === 'star' ? 500 : 60,
      size: type === 'merge' ? 3 + Math.random() * 6 : 
            type === 'star' ? 1 + Math.random() * 2 : 2 + Math.random() * 3,
      color,
      type,
      alpha: 1
    };
  }, []);

  // Initialize background stars
  useEffect(() => {
    const stars: Particle[] = [];
    for (let i = 0; i < 100; i++) {
      stars.push(createParticle(
        Math.random() * width,
        Math.random() * height,
        'star',
        starColors[Math.floor(Math.random() * starColors.length)]
      ));
    }
    particlesRef.current = stars;
  }, [width, height, createParticle]);

  // Handle merge effects
  useEffect(() => {
    mergeEffects.forEach(effect => {
      const particleCount = Math.min(effect.value / 2, 50);
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push(createParticle(effect.x, effect.y, 'merge', effect.color));
      }
    });
  }, [mergeEffects, createParticle]);

  // Handle spawn effects
  useEffect(() => {
    spawnEffects.forEach(effect => {
      for (let i = 0; i < 8; i++) {
        particlesRef.current.push(createParticle(effect.x, effect.y, 'spawn', '#FFD700'));
      }
    });
  }, [spawnEffects, createParticle]);

  // Win/Game over effects
  useEffect(() => {
    if (isWin) {
      for (let i = 0; i < 200; i++) {
        setTimeout(() => {
          particlesRef.current.push(createParticle(
            Math.random() * width,
            height + 20,
            'merge',
            starColors[Math.floor(Math.random() * starColors.length)]
          ));
        }, i * 20);
      }
    }
  }, [isWin, width, height, createParticle]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, width, height);

      // Draw cosmic nebula background gradient
      const gradient = ctx.createRadialGradient(
        width / 2 + Math.sin(timeRef.current * 0.5) * 100,
        height / 2 + Math.cos(timeRef.current * 0.3) * 50,
        0,
        width / 2,
        height / 2,
        width
      );
      gradient.addColorStop(0, 'rgba(88, 28, 135, 0.3)');
      gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.5)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw matrix code rain effect
      ctx.font = '10px monospace';
      ctx.fillStyle = 'rgba(0, 255, 255, 0.03)';
      for (let i = 0; i < width / 20; i++) {
        const char = String.fromCharCode(0x30A0 + Math.random() * 96);
        ctx.fillText(char, i * 20, (timeRef.current * 50 + i * 30) % height);
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life--;
        particle.alpha = particle.life / particle.maxLife;

        if (particle.type === 'star') {
          // Twinkling effect
          particle.alpha = 0.3 + Math.sin(timeRef.current * 3 + particle.x) * 0.3;
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Wrap around
          if (particle.x < 0) particle.x = width;
          if (particle.x > width) particle.x = 0;
          if (particle.y < 0) particle.y = height;
          if (particle.y > height) particle.y = 0;
        } else {
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vy += 0.05; // Gravity
          particle.vx *= 0.99; // Friction
        }

        // Draw particle
        ctx.beginPath();
        ctx.globalAlpha = particle.alpha;
        
        if (particle.type === 'merge' || particle.type === 'spawn') {
          // Glow effect
          const glow = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * 2
          );
          glow.addColorStop(0, particle.color);
          glow.addColorStop(1, 'transparent');
          ctx.fillStyle = glow;
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        } else {
          ctx.fillStyle = particle.color;
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        }
        
        ctx.fill();
        ctx.globalAlpha = 1;

        return particle.life > 0;
      });

      // Maintain star count
      while (particlesRef.current.filter(p => p.type === 'star').length < 80) {
        particlesRef.current.push(createParticle(
          Math.random() * width,
          Math.random() * height,
          'star',
          starColors[Math.floor(Math.random() * starColors.length)]
        ));
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
