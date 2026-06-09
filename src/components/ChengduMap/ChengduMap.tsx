'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import styles from './ChengduMap.module.css';

const NANBU: [number, number] = [106.0611, 31.3532];
const LONGQUANYI: [number, number] = [104.2746, 30.5565];
const CURRENT_LOCATION: [number, number] = [104.2826, 30.976];
const MAP_CENTER: [number, number] = [105.1679, 30.9549];
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';
const announceMapReady = () => window.dispatchEvent(new Event('ender:map-ready'));

const HOME_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 10.6 12 3l9 7.6" />
    <path d="M5.5 9.5V20h13V9.5" />
    <path d="M9.5 20v-6h5v6" />
  </svg>
`;

const RESIDENCE_ICON = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s6.5-5.1 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.9 6.5 11 6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </svg>
`;

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
        center: MAP_CENTER,
        zoom: 7.1,
        pitch: 38,
        bearing: -12,
        attributionControl: false,
        scrollZoom: false,
      });

      const createIconMarker = (className: string, label: string, icon: string) => {
        const element = document.createElement('div');
        element.className = `${styles.markerIcon} ${className}`;
        element.setAttribute('aria-label', label);
        element.innerHTML = icon;
        return element;
      };

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
          element: createIconMarker(styles.homeMarker, 'Birthplace marker in Nanbu, Nanchong', HOME_ICON),
          anchor: 'center',
        })
          .setLngLat(NANBU)
          .addTo(map),
        new maplibregl.Marker({
          element: createIconMarker(styles.residenceMarker, 'Residence marker in Longquanyi, Chengdu', RESIDENCE_ICON),
          anchor: 'center',
        })
          .setLngLat(LONGQUANYI)
          .addTo(map),
        new maplibregl.Marker({
          element: createAvatarMarker(),
          anchor: 'bottom',
        })
          .setLngLat(CURRENT_LOCATION)
          .addTo(map),
      ];
      map.once('load', () => {
        map.addSource('life-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [NANBU, LONGQUANYI],
            },
          },
        });
        map.addLayer({
          id: 'life-route-glow',
          type: 'line',
          source: 'life-route',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': 'rgba(250, 250, 250, 0.42)',
            'line-width': 3,
            'line-blur': 4,
          },
        });
        map.addLayer({
          id: 'life-route',
          type: 'line',
          source: 'life-route',
          layout: {
            'line-cap': 'round',
            'line-join': 'round',
          },
          paint: {
            'line-color': 'rgba(250, 250, 250, 0.54)',
            'line-width': 1,
            'line-dasharray': [2, 2],
          },
        });
        const bounds = new maplibregl.LngLatBounds(NANBU, NANBU).extend(LONGQUANYI).extend(CURRENT_LOCATION);
        map.fitBounds(bounds, {
          padding: { top: 86, right: 84, bottom: 112, left: 84 },
          duration: 900,
          maxZoom: 7.4,
        });
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
