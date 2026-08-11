'use client';

import { useEffect, useRef, useState } from 'react';
import LanyardScene from './LanyardScene';
import styles from './GlobalLanyard.module.css';

export default function GlobalLanyard() {
  const hangerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isVisible) return;

    const hanger = hangerRef.current;
    const article = hanger?.parentElement;
    if (!article) return;

    let scrollContainer: Element | null = article.parentElement;
    while (scrollContainer) {
      const style = window.getComputedStyle(scrollContainer);
      if (/auto|scroll/.test(style.overflowY) && scrollContainer.scrollHeight > scrollContainer.clientHeight) break;
      scrollContainer = scrollContainer.parentElement;
    }
    let previousTop = scrollContainer?.scrollTop ?? window.scrollY;

    const revealIfReached = () => {
      const rect = article.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.82 && rect.bottom > 0) setIsVisible(true);
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.deltaY > 2) revealIfReached();
    };

    const handleScroll = () => {
      const currentTop = scrollContainer?.scrollTop ?? window.scrollY;
      if (currentTop > previousTop + 1) revealIfReached();
      previousTop = currentTop;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isVisible]);

  return (
    <div ref={hangerRef} className={styles.hanger} data-open={isVisible} aria-hidden>
      <LanyardScene
        position={[0, 0, 30]}
        gravity={[0, -40, 0]}
        frontImage="/card-front.png"
        backImage="/logos/scp-card-back.png"
        cardScale={2.9}
        ropeSegmentLength={0.001}
        showLanyard={false}
        interactive={false}
        swayOnScroll
        passThrough
      />
    </div>
  );
}
