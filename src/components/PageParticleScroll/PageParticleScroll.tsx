import type { ReactNode } from "react";
import styles from "./PageParticleScroll.module.css";

interface PageParticleScrollProps {
  children: ReactNode;
}

export default function PageParticleScroll({ children }: PageParticleScrollProps) {
  return <div className={styles.viewport}>{children}</div>;
}
