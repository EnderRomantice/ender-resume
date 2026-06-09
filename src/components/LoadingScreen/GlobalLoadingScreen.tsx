'use client';

import { useEffect, useState } from 'react';
import Dither from './Dither';
import styles from './GlobalLoadingScreen.module.css';

const MIN_VISIBLE_MS = 3200;
const MAX_WAIT_MS = 6200;
const LANYARD_ASSETS = ['/lanyard/card.glb', '/lanyard/lanyard.png', '/card-front.png'];

function preloadImage(src: string) {
  return new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });
}

function preloadFetch(src: string) {
  return fetch(src, { cache: 'force-cache' }).then(
    () => undefined,
    () => undefined
  );
}

function preloadLanyardAssets() {
  return Promise.all(LANYARD_ASSETS.map((asset) => (asset.endsWith('.png') ? preloadImage(asset) : preloadFetch(asset)))).then(
    () => undefined
  );
}

export default function GlobalLoadingScreen() {
  const [isReady, setIsReady] = useState(false);
  const [isGone, setIsGone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let mapReady = false;
    let pageReady = document.readyState === 'complete';
    let lanyardReady = false;
    const startedAt = performance.now();

    const maybeFinish = () => {
      if (cancelled || !mapReady || !pageReady || !lanyardReady) return;

      const elapsed = performance.now() - startedAt;
      window.setTimeout(() => {
        if (!cancelled) setIsReady(true);
      }, Math.max(0, MIN_VISIBLE_MS - elapsed));
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

    preloadLanyardAssets().then(() => {
      lanyardReady = true;
      maybeFinish();
    });

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
      <div className={styles.vignette} />
    </div>
  );
}
