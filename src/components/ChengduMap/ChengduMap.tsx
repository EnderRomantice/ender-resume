'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import styles from './ChengduMap.module.css';

const LONGQUANYI: [number, number] = [104.2746, 30.5565];
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

export default function ChengduMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const zoomTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    let lastDirection: 'in' | 'out' | null = null;
    let streak = 0;

    const stopAutoZoom = () => {
      if (zoomTimerRef.current) {
        clearInterval(zoomTimerRef.current);
        zoomTimerRef.current = null;
      }
    };

    const nextZoomDirection = (): 'in' | 'out' => {
      if (!lastDirection) return Math.random() > 0.5 ? 'in' : 'out';

      const opposite = lastDirection === 'in' ? 'out' : 'in';
      const oppositeChance = Math.min(0.86, 0.5 + streak * 0.14);
      return Math.random() < oppositeChance ? opposite : lastDirection;
    };

    const startAutoZoom = (map: MapLibreMap) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      stopAutoZoom();
      zoomTimerRef.current = setInterval(() => {
        const direction = nextZoomDirection();
        streak = direction === lastDirection ? streak + 1 : 1;
        lastDirection = direction;

        const currentZoom = map.getZoom();
        const zoomDelta = 0.34 + Math.random() * 0.22;
        const nextZoom = direction === 'in' ? Math.min(11.9, currentZoom + zoomDelta) : Math.max(9.7, currentZoom - zoomDelta);

        map.easeTo({
          zoom: nextZoom,
          duration: 1800,
          easing: (t) => t * t * (3 - 2 * t),
        });
      }, 5200);
    };

    const mountMap = async () => {
      const maplibregl = await import('maplibre-gl');
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: LONGQUANYI,
        zoom: 10.4,
        pitch: 48,
        bearing: -18,
        attributionControl: false,
        scrollZoom: false,
      });

      const markerEl = document.createElement('div');
      markerEl.className = styles.marker;
      markerEl.setAttribute('aria-label', 'Current location marker in Longquanyi District');

      markerRef.current = new maplibregl.Marker({ element: markerEl, anchor: 'center' }).setLngLat(LONGQUANYI).addTo(map);
      map.once('load', () => startAutoZoom(map));

      mapRef.current = map;
    };

    mountMap();

    return () => {
      cancelled = true;
      stopAutoZoom();
      markerRef.current?.remove();
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={styles.mapShell} aria-label="Map centered on Longquanyi District, Chengdu, China">
      <div className={styles.loading}>Loading Chengdu map</div>
      <div ref={containerRef} className={styles.map} />
      <div className={styles.plate}>
        <span className={styles.kicker}>Currently based in</span>
        <span className={styles.city}>Longquanyi, Chengdu</span>
        <span className={styles.coords}>30.5565 N · 104.2746 E</span>
      </div>
    </div>
  );
}
