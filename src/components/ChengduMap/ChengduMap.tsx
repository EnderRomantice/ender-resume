'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import styles from './ChengduMap.module.css';

const CURRENT_LOCATION: [number, number] = [104.2826, 30.976];
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';
const announceMapReady = () => window.dispatchEvent(new Event('ender:map-ready'));

export default function ChengduMap() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef<MapLibreMarker[]>([]);
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
        const zoomDelta = 0.12 + Math.random() * 0.08;
        const nextZoom = direction === 'in' ? Math.min(7.7, currentZoom + zoomDelta) : Math.max(6.75, currentZoom - zoomDelta);

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
        center: CURRENT_LOCATION,
        zoom: 8.4,
        pitch: 38,
        bearing: -12,
        attributionControl: false,
        scrollZoom: false,
      });

      const createAvatarMarker = () => {
        const markerEl = document.createElement('div');
        markerEl.className = styles.marker;
        markerEl.setAttribute('aria-label', 'Current location avatar marker in Guanghan, Sichuan');
        const avatar = document.createElement('img');
        avatar.src = '/ender.jpg';
        avatar.alt = '';
        markerEl.appendChild(avatar);
        return markerEl;
      };

      markerRefs.current = [
        new maplibregl.Marker({
          element: createAvatarMarker(),
          anchor: 'bottom',
        })
          .setLngLat(CURRENT_LOCATION)
          .addTo(map),
      ];
      map.once('load', () => {
        map.once('idle', () => {
          startAutoZoom(map);
          announceMapReady();
        });
      });

      mapRef.current = map;
    };

    mountMap().catch(announceMapReady);

    return () => {
      cancelled = true;
      stopAutoZoom();
      markerRefs.current.forEach((marker) => marker.remove());
      mapRef.current?.remove();
      markerRefs.current = [];
      mapRef.current = null;
    };
  }, []);

  return (
    <div className={styles.mapShell} aria-label="Map centered on Guanghan, Sichuan, China">
      <div className={styles.loading}>Loading Chengdu map</div>
      <div ref={containerRef} className={styles.map} />
      <div className={styles.plate}>
        <span className={styles.kicker}>Currently based in</span>
        <span className={styles.city}>Guanghan, Sichuan</span>
        <span className={styles.coords}>30.9760 N · 104.2826 E</span>
      </div>
    </div>
  );
}
