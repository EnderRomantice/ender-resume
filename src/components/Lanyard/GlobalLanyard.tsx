'use client';
import LanyardScene from './LanyardScene';
import styles from './GlobalLanyard.module.css';

// A global lanyard that hangs from the top nav across the whole page.
// The canvas spans a large area (so the badge stays visible while dragged) but
// lets clicks pass through — only the badge itself is interactive.
export default function GlobalLanyard() {
  return (
    <div className={styles.overlay} aria-hidden>
      <LanyardScene
        position={[0, 0, 30]}
        gravity={[0, -40, 0]}
        frontImage="/card-front.png"
        backImage="/logos/creatorone-tile.png"
        lanyardWidth={1.3}
        passThrough
      />
    </div>
  );
}
