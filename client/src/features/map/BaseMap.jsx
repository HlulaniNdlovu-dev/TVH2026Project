import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { TSHWANE_CENTER } from '../../utils/geo.js';

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
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom className={`map ${className}`}>
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {children}
    </MapContainer>
  );
}
