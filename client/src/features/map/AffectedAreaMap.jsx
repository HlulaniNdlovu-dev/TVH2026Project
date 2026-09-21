import { Circle, CircleMarker, Marker, Polyline, Popup } from 'react-leaflet';
import BaseMap, { FitBounds } from './BaseMap.jsx';
import { siteIcon, technicianIcon } from './mapIcons.js';

// The technician's map: the fault site, the affected customers' area in red and, when known, the route from the technician.
export default function AffectedAreaMap({ site, affectedArea, technician }) {
  const points = [site, technician, ...(affectedArea?.houses ?? [])].filter(Boolean);
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
      {technician && site && <Polyline positions={[[technician.lat, technician.lng], [site.lat, site.lng]]} pathOptions={{ color: '#178a4a', weight: 4, dashArray: '8 8' }} />}
      {technician && <Marker position={[technician.lat, technician.lng]} icon={technicianIcon('You', 'green')} zIndexOffset={600}><Popup>Your position</Popup></Marker>}
      {site && (
        <Marker position={[site.lat, site.lng]} icon={siteIcon()}>
          <Popup>{site.name}<br />{site.address}</Popup>
        </Marker>
      )}
    </BaseMap>
  );
}
