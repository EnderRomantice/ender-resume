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
    const revealTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scroll-reveal]"),
    );
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

      const originRects = revealTargets.flatMap((target) => {
        const targetRect = target.getBoundingClientRect();
        if (targetRect.bottom < -80 || targetRect.top > window.innerHeight + 80) return [];

        return Array.from(
          target.querySelectorAll<HTMLElement>("h3, p, li, span, img, iframe"),
        )
          .map((element) => element.getBoundingClientRect())
          .filter((rect) => rect.width > 4 && rect.height > 4);
      });

      if (!originRects.length) return;

      const amount = Math.min(52, Math.max(12, Math.round(Math.abs(delta) * 0.28)));
      const direction = Math.sign(delta);

      for (let index = 0; index < amount; index += 1) {
        const origin = originRects[Math.floor(Math.random() * originRects.length)];
        particles.push({
          x: origin.left + Math.random() * origin.width,
          y: origin.top + Math.random() * origin.height,
          vx: (Math.random() - 0.5) * 1.8,
          vy: -direction * (0.35 + Math.random() * 1.5),
          radius: 0.45 + Math.random() * 1.05,
          life: 0.35 + Math.random() * 0.45,
          decay: 0.022 + Math.random() * 0.025,
        });
      }

      if (!frame) frame = window.requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          const progress = entry.isIntersecting
            ? Math.min(1, entry.intersectionRatio / 0.16)
            : 0;
          target.dataset.scrollVisible = String(progress > 0);
          target.style.setProperty("--scroll-progress", String(progress));
        }
      },
      {
        rootMargin: "2% 0px",
        threshold: [0, 0.02, 0.04, 0.07, 0.1, 0.13, 0.16, 0.22],
      },
    );

    for (const target of revealTargets) {
      if (reducedMotion.matches) {
        target.dataset.scrollVisible = "true";
        target.style.setProperty("--scroll-progress", "1");
      }
      else revealObserver.observe(target);
    }

    return () => {
      revealObserver.disconnect();
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
