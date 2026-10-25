import { useState, useRef, useCallback, useEffect } from 'react';
import { sound } from '../utils/sounds';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export const usePowerMode = () => {
  const [combo, setCombo] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const particlesRef = useRef<Particle[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const comboTimerRef = useRef<NodeJS.Timeout | null>(null);

  const colors = [
    '#6366f1', '#ec4899', '#38bdf8', '#f59e0b', '#10b981', '#a855f7'
  ];

  // Particle render loop
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18; // gravity
        p.alpha -= 0.025;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Trigger typed event
  const triggerType = useCallback((rect?: DOMRect) => {
    setCombo(prev => {
      const next = prev + 1;
      sound.playTypeTick(next);
      return next;
    });

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setCombo(0);
    }, 1800);

    // Screen shake trigger on combo > 5
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 120);

    // Spawn sparks
    if (rect && canvasRef.current) {
      const originX = rect.left + rect.width / 2 + (Math.random() * 80 - 40);
      const originY = rect.top + rect.height / 2;
      const count = Math.min(6 + Math.floor(combo / 5) * 2, 20);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 5;
        particlesRef.current.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.5,
          alpha: 1.0,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 2.5 + Math.random() * 3.5,
        });
      }
    }
  }, [combo]);

  // Burst effect for high similarity score
  const triggerScoreBurst = useCallback((similarity: number, rect?: DOMRect) => {
    sound.playSimilarityTone(similarity);

    if (similarity < 40) return;

    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 200);

    if (rect && canvasRef.current) {
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;
      const burstCount = Math.floor(similarity * 0.8);
      const burstColor = similarity > 80 ? '#fbbf24' : '#f97316';

      for (let i = 0; i < burstCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 3 + Math.random() * 8;
        particlesRef.current.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          alpha: 1.0,
          color: Math.random() > 0.4 ? burstColor : '#ffffff',
          size: 3 + Math.random() * 4,
        });
      }
    }
  }, []);

  return {
    combo,
    isShaking,
    canvasRef,
    triggerType,
    triggerScoreBurst,
  };
};
