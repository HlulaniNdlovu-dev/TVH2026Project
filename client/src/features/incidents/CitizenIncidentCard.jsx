import { Link } from 'react-router-dom';
import IncidentStepper from './IncidentStepper.jsx';
import { StatusBadge } from './StatusBadge.jsx';
import Banner from '../../components/Banner.jsx';
import { formatDateTime } from '../../utils/format.js';

// The dashboard card for the citizen's current incident. After it is resolved it stays until the
// "resolved" notification has been opened.
export default function CitizenIncidentCard({ incident }) {
  const resolved = incident.status === 'resolved';
  return (
    <div className={`card incident-card ${resolved ? 'card-accent' : incident.danger ? 'card-danger' : ''}`}>
      <div className="row-between">
        <div>
          <div className="muted small">{incident.reportedByYou ? 'Your reported incident' : 'Outage affecting your meter'}</div>
          <h2 style={{ margin: 0 }}>{incident.category}</h2>
        </div>
        <StatusBadge status={incident.status} />
      </div>
      <div className="muted small" style={{ margin: '4px 0 12px' }}>
        {incident.id} · {incident.area} · reported {formatDateTime(incident.createdAt)}
      </div>

      <IncidentStepper incident={incident} variant="horizontal" />

      <div className="incident-facts">
        {incident.technician && (
          <div>
            <span className="muted small">Technician</span>
            <strong>{incident.technician.name}</strong>
          </div>
        )}
        {incident.status === 'en_route' && (
          <div>
            <span className="muted small">Estimated arrival</span>
            <strong>~{incident.etaMinutes ?? '?'} min</strong>
          </div>
        )}
        {incident.status === 'arrived' && <strong>Technician on site</strong>}
      </div>

      {incident.status === 'paused' && <Banner tone="warn">Repair paused: {incident.pausedReason}. We will update you when work resumes.</Banner>}
      {resolved && (
        <Banner tone="success" action={<Link className="btn btn-sm" to="/citizen/notifications">Open notification</Link>}>
          Your power has been restored. Open the "Power restored" notification to clear this card.
        </Banner>
      )}
      {!resolved && (
        <Link className="btn btn-outline btn-block" style={{ marginTop: 12 }} to="/citizen/incidents">
          Track this incident
        </Link>
      )}
    </div>
  );
}
