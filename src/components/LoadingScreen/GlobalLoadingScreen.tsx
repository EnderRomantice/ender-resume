'use client';

import { useEffect, useState } from 'react';
import Dither from './Dither';
import styles from './GlobalLoadingScreen.module.css';

const MAX_WAIT_MS = 20000;

export default function GlobalLoadingScreen() {
  const [isReady, setIsReady] = useState(false);
  const [isGone, setIsGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let mapReady = false;
    let pageReady = document.readyState === 'complete';

    const maybeFinish = () => {
      if (cancelled || !mapReady || !pageReady) return;
      setIsReady(true);
    };

    const onMapReady = () => {
      mapReady = true;
      maybeFinish();
    };

    const onPageLoad = () => {
      pageReady = true;
      maybeFinish();
    };

    window.addEventListener('ender:map-ready', onMapReady, { once: true });
    window.addEventListener('load', onPageLoad, { once: true });

    const maxWait = window.setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, MAX_WAIT_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(maxWait);
      window.removeEventListener('ender:map-ready', onMapReady);
      window.removeEventListener('load', onPageLoad);
    };
  }, []);

  if (isGone) return null;

  return (
    <div
      className={`${styles.loadingScreen} ${isReady ? styles.loadingScreenDone : ''}`}
      onTransitionEnd={() => {
        if (isReady) setIsGone(true);
      }}
      aria-hidden={isReady}
    >
      <Dither />
    </div>
  );
}
