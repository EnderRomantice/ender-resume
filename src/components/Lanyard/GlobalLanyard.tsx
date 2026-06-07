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
    const experience = document.getElementById('experience');
    if (!experience) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextIsInExperience = Boolean(entry?.isIntersecting);
        if (nextIsInExperience) setHasEnteredExperience(true);
        setIsInExperience(nextIsInExperience);
      },
      {
        rootMargin: '-8% 0px -44% 0px',
        threshold: 0,
      }
    );

    observer.observe(experience);
    return () => observer.disconnect();
  }, []);

  if (!hasEnteredExperience) return null;

  return (
    <div className={`${styles.overlay} ${isInExperience ? styles.overlayVisible : styles.overlayHidden}`} aria-hidden>
      <LanyardScene
        position={[0, 0, 30]}
        gravity={[0, -40, 0]}
        frontImage="/card-front.png"
        backImage="/logos/creatorone-tile.png"
        lanyardWidth={1}
        passThrough
      />
    </div>
  );
}
