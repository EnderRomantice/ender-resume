'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import styles from './ChengduMap.module.css';

const NANBU: [number, number] = [106.0611, 31.3532];
const OTHER_LOCATION: [number, number] = [104.2746, 30.5565];
const FALLBACK_CURRENT_LOCATION: [number, number] = [104.0668, 30.5728];
const MAP_CENTER: [number, number] = [105.1679, 30.9549];
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';
const announceMapReady = () => window.dispatchEvent(new Event('ender:map-ready'));

type LocationSummary = {
  current: [number, number];
  live: boolean;
  distance: string | null;
};

function distanceBetween([lng1, lat1]: [number, number], [lng2, lat2]: [number, number]) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(lat2 - lat1);
  const longitudeDelta = toRadians(lng2 - lng1);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function readBrowserLocation() {
  return new Promise<[number, number] | null>((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    let settled = false;
    const finish = (location: [number, number] | null) => {
      if (settled) return;
      settled = true;
      resolve(location);
    };

    const timeout = window.setTimeout(() => finish(null), 4500);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        window.clearTimeout(timeout);
        finish([coords.longitude, coords.latitude]);
      },
      () => {
        window.clearTimeout(timeout);
        finish(null);
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, timeout: 4000 }
    );
  });
}

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
  const [locationSummary, setLocationSummary] = useState<LocationSummary>({
    current: FALLBACK_CURRENT_LOCATION,
    live: false,
    distance: null,
  });

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
      const browserLocation = await readBrowserLocation();
      if (cancelled) return;

      const currentLocation = browserLocation ?? FALLBACK_CURRENT_LOCATION;
      const live = browserLocation !== null;
      const distance = live ? distanceBetween(OTHER_LOCATION, currentLocation) : null;
      setLocationSummary({
        current: currentLocation,
        live,
        distance: distance !== null ? `${distance.toFixed(1)} km` : null,
      });

      const maplibregl = await import('maplibre-gl');
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: live ? currentLocation : MAP_CENTER,
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
        markerEl.setAttribute(
          'aria-label',
          live ? 'Your live location from this browser' : 'Current location marker in Chengdu, Sichuan'
        );
        const avatar = document.createElement('img');
        avatar.src = '/ender.jpg';
        avatar.alt = '';
        markerEl.appendChild(avatar);
        const label = document.createElement('span');
        label.className = styles.selfLabel;
        label.textContent = 'YOU';
        markerEl.appendChild(label);
        return markerEl;
      };

      const createOtherMarker = () => {
        const markerEl = document.createElement('div');
        markerEl.className = styles.otherMarker;
        markerEl.setAttribute('aria-label', 'Other person location in Chengdu');
        markerEl.innerHTML = `
          <span class="${styles.otherLabel}">OTHER</span>
          <span class="${styles.markerIcon} ${styles.residenceMarker}">${RESIDENCE_ICON}</span>
        `;
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
          element: createOtherMarker(),
          anchor: 'bottom',
        })
          .setLngLat(OTHER_LOCATION)
          .addTo(map),
        new maplibregl.Marker({
          element: createAvatarMarker(),
          anchor: 'bottom',
        })
          .setLngLat(currentLocation)
          .addTo(map),
      ];
      map.once('load', () => {
        if (live) {
          map.addSource('location-distance', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates: [OTHER_LOCATION, currentLocation] },
            },
          });
          map.addLayer({
            id: 'location-distance-casing',
            type: 'line',
            source: 'location-distance',
            paint: { 'line-color': '#050505', 'line-width': 7, 'line-opacity': 0.82 },
          });
          map.addLayer({
            id: 'location-distance',
            type: 'line',
            source: 'location-distance',
            paint: { 'line-color': '#f8fff9', 'line-width': 2.5, 'line-opacity': 0.96 },
          });
        }

        const bounds = new maplibregl.LngLatBounds(OTHER_LOCATION, OTHER_LOCATION).extend(currentLocation);
        map.fitBounds(bounds, {
          padding: { top: 120, right: 120, bottom: 130, left: 120 },
          duration: 900,
          maxZoom: 10.6,
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
    <div
      className={styles.mapShell}
      aria-label={locationSummary.live ? 'Map showing your live location and another location in Chengdu' : 'Map centered on Chengdu, Sichuan, China'}
    >
      <div className={styles.loading}>Loading Chengdu map</div>
      <div ref={containerRef} className={styles.map} />
      {locationSummary.live && locationSummary.distance && (
        <div className={styles.distanceBadge} aria-label={`Distance between locations: ${locationSummary.distance}`}>
          <span className={styles.distanceKicker}>You ↔ Other</span>
          <span>{locationSummary.distance}</span>
        </div>
      )}
      <div className={styles.plate}>
        <span className={styles.kicker}>Currently based in</span>
        <span className={styles.city}>{locationSummary.live ? 'Live · Chengdu' : 'Chengdu, Sichuan'}</span>
        <span className={styles.coords}>
          {locationSummary.current[1].toFixed(4)} N · {locationSummary.current[0].toFixed(4)} E
        </span>
      </div>
    </div>
  );
}
