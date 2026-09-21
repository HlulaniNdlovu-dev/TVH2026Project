import { Circle, CircleMarker, Marker, Popup } from 'react-leaflet';
import BaseMap, { FitBounds } from './BaseMap.jsx';
import { siteIcon } from './mapIcons.js';

// The technician's map: the fault site, and the affected customers' area highlighted in red.
export default function AffectedAreaMap({ site, affectedArea }) {
  const points = [site, ...(affectedArea?.houses ?? [])].filter(Boolean);
  const radius = affectedArea?.radiusMeters ?? 100;
  return (
    <BaseMap className="map-md" center={site} zoom={16}>
      <FitBounds points={affectedArea ? [...points, { lat: affectedArea.center.lat + radius / 111320, lng: affectedArea.center.lng }, { lat: affectedArea.center.lat - radius / 111320, lng: affectedArea.center.lng }] : points} />
      {affectedArea && (
        <Circle center={[affectedArea.center.lat, affectedArea.center.lng]} radius={radius} pathOptions={{ color: '#d64545', fillColor: '#d64545', fillOpacity: 0.18, weight: 2 }} />
      )}
      {(affectedArea?.houses ?? []).map((h, i) => (
        <CircleMarker key={i} center={[h.lat, h.lng]} radius={5} pathOptions={{ color: '#fff', weight: 1.5, fillColor: '#d64545', fillOpacity: 1 }} />
      ))}
      {site && (
        <Marker position={[site.lat, site.lng]} icon={siteIcon()}>
          <Popup>{site.name}<br />{site.address}</Popup>
        </Marker>
      )}
    </BaseMap>
  );
}
