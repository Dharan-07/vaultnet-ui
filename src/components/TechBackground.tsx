import React, { useRef, useEffect } from 'react';

type Particle = {
  x: number;
  y: number;
  z: number; // depth
  vx: number;
  vy: number;
  vz: number;
};

const TechBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    const PARTICLE_COUNT = Math.min(120, Math.floor((width * height) / 10000));
    const focal = Math.min(width, height) * 0.6;
    const particles: Particle[] = [];

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: Math.random() * width - width / 2,
          y: Math.random() * height - height / 2,
          z: Math.random() * focal,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          vz: -0.2 - Math.random() * 0.6,
        });
      }
    }

    let mouseX = 0;
    let mouseY = 0;

    function resize() {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr2 = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr2);
      canvas.height = Math.floor(height * dpr2);
      ctx.setTransform(dpr2, 0, 0, dpr2, 0, 0);
    }

    function project(p: Particle) {
      const scale = focal / (focal + p.z);
      return {
        x: (p.x * scale) + width / 2 + mouseX * 0.03,
        y: (p.y * scale) + height / 2 + mouseY * 0.03,
        r: Math.max(0.5, 4 * scale),
        o: Math.min(1, Math.max(0.05, 0.9 * scale)),
      };
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // subtle radial gradient background
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, 'rgba(4,6,23,0.7)');
      g.addColorStop(0.5, 'rgba(6,12,30,0.75)');
      g.addColorStop(1, 'rgba(2,8,20,0.9)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);

      // draw connections first
      for (let i = 0; i < particles.length; i++) {
        const a = project(particles[i]);
        for (let j = i + 1; j < particles.length; j++) {
          const b = project(particles[j]);
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(64, 200, 255, ${alpha})`;
            ctx.lineWidth = 1 * ((a.r + b.r) / 8);
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pr = project(p);
        const grd = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, pr.r * 3);
        grd.addColorStop(0, `rgba(120,240,255,${pr.o})`);
        grd.addColorStop(0.4, `rgba(40,200,255,${pr.o * 0.6})`);
        grd.addColorStop(1, 'rgba(0,20,30,0)');
        ctx.beginPath();
        ctx.fillStyle = grd;
        ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // simple forward motion
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (p.z < -focal) {
          p.z = focal + Math.random() * focal;
          p.x = Math.random() * width - width / 2;
          p.y = Math.random() * height - height / 2;
        }
      }
      draw();
      rafRef.current = requestAnimationFrame(step);
    }

    initParticles();
    rafRef.current = requestAnimationFrame(step);

    function onPointerMove(e: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) - width / 2;
      mouseY = (e.clientY - rect.top) - height / 2;
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('resize', resize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden
    />
  );
};

export default TechBackground;
