import { Marker, Polyline, Popup } from 'react-leaflet';
import BaseMap, { FitBounds } from './BaseMap.jsx';
import { incidentIcon, technicianIcon } from './mapIcons.js';

const tone = (t) => (t.dutyStatus === 'unavailable' ? 'grey' : t.activity === 'En route' ? 'amber' : t.activity === 'Working' || t.activity === 'On site' || t.activity === 'Paused' ? 'green' : 'blue');

// Admin oversight map: where every technician is, and their active route.
export default function TechnicianMap({ technicians }) {
  const located = technicians.filter((t) => t.lat);
  return (
    <BaseMap className="map-md" zoom={12}>
      <FitBounds points={located} />
      {located.map((t) => (
        <Marker key={t.id} position={[t.lat, t.lng]} icon={technicianIcon(t.name, tone(t))} zIndexOffset={600}>
          <Popup><strong>{t.name}</strong><div>{t.activity}</div>{t.currentIncident && <div>{t.currentIncident}</div>}</Popup>
        </Marker>
      ))}
      {located.filter((t) => t.route).map((t) => (
        <Polyline key={`route-${t.id}`} positions={[[t.route.from.lat, t.route.from.lng], [t.route.to.lat, t.route.to.lng]]} pathOptions={{ color: '#178a4a', weight: 4, dashArray: '8 8' }} />
      ))}
      {located.filter((t) => t.site).map((t) => (
        <Marker key={`site-${t.id}`} position={[t.site.lat, t.site.lng]} icon={incidentIcon()} />
      ))}
    </BaseMap>
  );
}
