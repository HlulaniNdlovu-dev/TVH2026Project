import { Link } from 'react-router-dom';
import { CircleMarker, Marker, Polyline, Popup } from 'react-leaflet';
import BaseMap, { FitBounds } from './BaseMap.jsx';
import { incidentIcon, substationIcon, technicianIcon, transformerIcon } from './mapIcons.js';
import { PriorityBadge, StatusBadge } from '../incidents/StatusBadge.jsx';
import { formatWatts, timeAgo } from '../../utils/format.js';

const stateColor = (node) => {
  if (node.state === 'OFF') return node.offReason === 'loadshedding' ? '#e59a1a' : '#d64545';
  return node.online ? '#22a45d' : '#9aa9a0';
};

function NodePopup({ node }) {
  return (
    <div>
      <strong>{node.type === 'house' ? `Meter ${node.meterNumber}` : node.name}</strong>
      <div>{node.area} · {node.type}</div>
      <div>State: <strong>{node.state}</strong>{node.offReason === 'loadshedding' ? ' (loadshedding)' : ''}</div>
      <div>Load: {formatWatts(node.watts)}</div>
      <div className="muted">Last heartbeat {timeAgo(node.lastHeartbeat)}{node.online ? '' : ' (sensor offline)'}</div>
      {node.critical && <div>Critical: {node.critical}</div>}
    </div>
  );
}

// Live map of the whole grid. Lines go substation -> transformer -> house and turn red when a branch is down.
export default function GridMap({ grid, focus = 'all', className = 'map-lg' }) {
  const byId = new Map(grid.nodes.map((n) => [n.id, n]));
  const focused = focus === 'all' ? grid.nodes : grid.nodes.filter((n) => n.area === focus);
  return (
    <BaseMap className={className} zoom={13}>
      <FitBounds points={focused} fitKey={focus} />
      {grid.nodes
        .filter((n) => n.parentId && byId.get(n.parentId))
        .map((n) => {
          const parent = byId.get(n.parentId);
          return (
            <Polyline
              key={`line-${n.id}`}
              positions={[[parent.lat, parent.lng], [n.lat, n.lng]]}
              pathOptions={{ color: n.state === 'OFF' ? (n.offReason === 'loadshedding' ? '#e59a1a' : '#d64545') : '#9fd5b4', weight: n.type === 'transformer' ? 3.5 : 2, opacity: 0.9 }}
            />
          );
        })}
      {grid.nodes.filter((n) => n.type === 'house').map((n) => (
        <CircleMarker key={n.id} center={[n.lat, n.lng]} radius={n.critical ? 9 : 6.5} pathOptions={{ color: '#fff', weight: 1.5, fillColor: stateColor(n), fillOpacity: 1 }}>
          <Popup><NodePopup node={n} /></Popup>
        </CircleMarker>
      ))}
      {grid.nodes.filter((n) => n.type === 'transformer').map((n) => (
        <Marker key={n.id} position={[n.lat, n.lng]} icon={transformerIcon(n.state === 'OFF')}>
          <Popup><NodePopup node={n} /></Popup>
        </Marker>
      ))}
      {grid.nodes.filter((n) => n.type === 'substation').map((n) => (
        <Marker key={n.id} position={[n.lat, n.lng]} icon={substationIcon(n.state === 'OFF')}>
          <Popup><NodePopup node={n} /></Popup>
        </Marker>
      ))}
      {grid.incidents.filter((i) => i.lat && (i.status !== 'reported' || i.sensorConfirmed || i.danger)).map((i) => (
        <Marker key={i.id} position={[i.lat, i.lng]} icon={incidentIcon()} zIndexOffset={500}>
          <Popup>
            <strong>{i.id}</strong> · {i.nodeName}
            <div className="row" style={{ margin: '6px 0' }}><PriorityBadge level={i.priority.level} overridden={i.priority.overridden} /><StatusBadge status={i.status} /></div>
            <div>{i.affectedCount} customer(s) · {i.technician ? i.technician.name : 'unassigned'}</div>
            <Link to={`/admin/incidents/${i.id}`}>Open incident</Link>
          </Popup>
        </Marker>
      ))}
      {grid.technicians.filter((t) => t.lat).map((t) => (
        <Marker key={t.id} position={[t.lat, t.lng]} icon={technicianIcon(t.name, t.activity === 'Unavailable' ? 'grey' : 'blue')} zIndexOffset={800}>
          <Popup><strong>{t.name}</strong><div>{t.activity}</div></Popup>
        </Marker>
      ))}
    </BaseMap>
  );
}

export function GridLegend() {
  return (
    <div className="map-legend">
      <span><i className="dot" /> Power on</span>
      <span><i className="dot dot-red" /> Power off (fault)</span>
      <span><i className="dot dot-amber" /> Loadshedding</span>
      <span><i className="dot dot-grey" /> Sensor offline</span>
      <span><b className="mk-mini mk-sub-mini">S</b> Substation</span>
      <span><b className="mk-mini mk-tr-mini">T</b> Transformer</span>
    </div>
  );
}
