import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { TSHWANE_CENTER } from '../../utils/geo.js';
import { useTheme } from '../theme/ThemeContext.jsx';

// Dark mode swaps the bright OpenStreetMap tiles for CARTO's dark ones (same OpenStreetMap data).
const TILES = {
  light: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' },
  dark: { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' },
};

// Zooms to a set of points. It only does so the first time (or when `fitKey` changes),
// so the map does not jump around while the data refreshes.
export function FitBounds({ points, fitKey = 'default', maxZoom = 16 }) {
  const map = useMap();
  const lastKey = useRef(null);
  useEffect(() => {
    if (!points.length || lastKey.current === fitKey) return;
    lastKey.current = fitKey;
    map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [36, 36], maxZoom });
  }, [points, fitKey, map, maxZoom]);
  return null;
}

export default function BaseMap({ center = TSHWANE_CENTER, zoom = 13, className = '', children }) {
  const tiles = TILES[useTheme()?.theme] ?? TILES.light;
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className={`map ${className}`}>
      <TileLayer key={tiles.url} attribution={tiles.attribution} url={tiles.url} />
      {children}
    </MapContainer>
  );
}
