"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./PageParticleScroll.module.css";

interface PageParticleScrollProps {
  children: ReactNode;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  decay: number;
}

export default function PageParticleScroll({ children }: PageParticleScrollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles: Particle[] = [];
    let frame = 0;
    let previousScroll = window.scrollY;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const render = () => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vx *= 0.985;
        particle.vy *= 0.985;
        particle.life -= particle.decay;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        context.beginPath();
        context.fillStyle = `rgba(10, 10, 10, ${particle.life * 0.42})`;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      frame = particles.length ? window.requestAnimationFrame(render) : 0;
    };

    const handleScroll = () => {
      const delta = window.scrollY - previousScroll;
      previousScroll = window.scrollY;
      if (reducedMotion.matches || Math.abs(delta) < 1) return;

      const amount = Math.min(90, Math.max(18, Math.round(Math.abs(delta) * 0.8)));
      const direction = Math.sign(delta);
      const line = window.innerHeight * 0.72;

      for (let index = 0; index < amount; index += 1) {
        particles.push({
          x: Math.random() * window.innerWidth,
          y: line + (Math.random() - 0.5) * 70,
          vx: (Math.random() - 0.5) * 2.8,
          vy: -direction * (0.5 + Math.random() * 2.2),
          radius: 0.6 + Math.random() * 1.5,
          life: 0.45 + Math.random() * 0.55,
          decay: 0.018 + Math.random() * 0.02,
        });
      }

      if (!frame) frame = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", handleScroll);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className={styles.viewport}>
      {children}
      <canvas ref={canvasRef} className={styles.particles} aria-hidden />
    </div>
  );
}
