'use client';

import { useEffect, useRef, useState } from 'react';
import { greatVibes, instrumentSans } from '@/app/fonts';
import LanyardScene from './LanyardScene';
import styles from './GlobalLanyard.module.css';

export default function GlobalLanyard({ role, company }: { role: string; company: string }) {
  const hangerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [fonts, setFonts] = useState({ body: 'Arial, sans-serif', name: 'Georgia, serif' });

  useEffect(() => {
    let cancelled = false;
    // Canvas text must be redrawn after the actual font is available.
    Promise.all([
      document.fonts.load(`400 86px ${instrumentSans.style.fontFamily}`),
      document.fonts.load(`400 136px ${greatVibes.style.fontFamily}`),
    ]).then(() => {
      if (!cancelled) setFonts({
        body: instrumentSans.style.fontFamily,
        name: greatVibes.style.fontFamily,
      });
    }).catch(() => {
      // Keep the readable fallback if the font request fails.
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const hanger = hangerRef.current;
    if (!hanger) return;
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting));
    observer.observe(hanger);
    return () => observer.disconnect();
  }, []);

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
        paused={!isVisible || !isInView}
        position={[0, 0, 30]}
        gravity={[0, -40, 0]}
        frontProfile={{
          name: 'Ender', role, company, avatar: '/ender.jpg',
          fontFamily: fonts.body, nameFontFamily: fonts.name,
        }}
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
