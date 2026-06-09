'use client';
import { useEffect, useState } from 'react';
import LanyardScene from './LanyardScene';
import styles from './GlobalLanyard.module.css';

// A global lanyard that hangs from the top nav across the whole page.
// The canvas spans a large area (so the badge stays visible while dragged) but
// lets clicks pass through — only the badge itself is interactive.
export default function GlobalLanyard() {
  const [hasEnteredExperience, setHasEnteredExperience] = useState(false);
  const [isInExperience, setIsInExperience] = useState(false);

  useEffect(() => {
    let rafId = 0;

    const updateVisibility = () => {
      const experience = document.getElementById('experience');
      if (!experience) return;

      const rect = experience.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const shouldShow = rect.top <= viewportHeight * 0.9 && rect.bottom >= viewportHeight * 0.36;

      if (shouldShow) setHasEnteredExperience(true);
      setIsInExperience(shouldShow);
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateVisibility);
    };

    updateVisibility();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, []);

  if (!hasEnteredExperience) return null;

  return (
    <div className={`${styles.overlay} ${isInExperience ? styles.overlayVisible : styles.overlayHidden}`} aria-hidden>
      <LanyardScene
        position={[0, 0, 30]}
        gravity={[0, -40, 0]}
        frontImage="/card-front.png"
        backImage="/logos/scp-card-back.png"
        lanyardImage="/logos/scp-card-back.png"
        lanyardWidth={1}
        passThrough
      />
    </div>
  );
}
