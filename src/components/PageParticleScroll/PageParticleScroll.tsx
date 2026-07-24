"use client";

import type { ReactNode } from "react";
import { ParticleScroll } from "@/components/canvasui/ParticleScroll";
import styles from "./PageParticleScroll.module.css";

interface PageParticleScrollProps {
  children: ReactNode;
}

export default function PageParticleScroll({ children }: PageParticleScrollProps) {
  return (
    <ParticleScroll
      className={styles.viewport}
      point={0.72}
      band={360}
      density={3}
      size={1.15}
      spread={150}
      gravity={0.22}
      drift={0.35}
      swirl={36}
      stagger={0.52}
      fade={0.72}
      settle={0.85}
      smoothing={0.32}
    >
      {children}
    </ParticleScroll>
  );
}
