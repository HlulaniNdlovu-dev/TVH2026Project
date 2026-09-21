import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import { getIncidents } from '../../services/citizenService.js';
import IncidentStepper from '../../features/incidents/IncidentStepper.jsx';
import { StatusBadge } from '../../features/incidents/StatusBadge.jsx';
import Banner from '../../components/Banner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatDateTime } from '../../utils/format.js';

function CurrentIncident({ incident }) {
  return (
    <div className={`card ${incident.danger ? 'card-danger' : 'card-accent'}`}>
      <div className="row-between">
        <div>
          <h2 style={{ margin: 0 }}>{incident.category}</h2>
          <div className="muted small">{incident.id} · {incident.area} · reported {formatDateTime(incident.createdAt)}</div>
        </div>
        <StatusBadge status={incident.status} />
      </div>
      {incident.myMeters.length > 0 && <p className="small muted" style={{ marginTop: 8 }}>Affects meter {incident.myMeters.join(', ')}</p>}
      {incident.status === 'paused' && <Banner tone="warn">Repair paused: {incident.pausedReason}. We will update you when work resumes.</Banner>}
      <hr className="divider" />
      <IncidentStepper incident={incident} />
      <p className="small muted" style={{ marginBottom: 0 }}>
        For the safety of our technicians we only show the stage of their journey and an estimated arrival time, never their live location.
      </p>
    </div>
  );
}

function HistoryItem({ incident }) {
  return (
    <div className="card card-flat history-item">
      <div className="row-between">
        <strong>{incident.category}</strong>
        <StatusBadge status="resolved" />
      </div>
      <div className="muted small">{incident.id} · {formatDateTime(incident.createdAt)} → {formatDateTime(incident.resolvedAt)}</div>
      {incident.myMeters.length > 0 && <div className="small">Meter {incident.myMeters.join(', ')}</div>}
      {incident.technician && <div className="small">Fixed by technician {incident.technician.employeeId}</div>}
      {incident.resolutionSummary && <div className="small muted">Cause: {incident.resolutionSummary}</div>}
    </div>
  );
}

export default function IncidentTrackerPage() {
  const { data, error, loading } = usePolling(getIncidents, 4000);
  if (loading && !data) return <Spinner label="Loading your incidents..." />;
  if (!data) return <Banner tone="error">{error?.message ?? 'Could not load your incidents.'}</Banner>;

  return (
    <div className="stack">
      <div className="page-title">
        <h1>Incident tracker</h1>
        <p>Follow your current incident and see past ones.</p>
      </div>

      <section className="stack">
        <h2>Current</h2>
        {data.current.length ? (
          data.current.map((i) => <CurrentIncident key={i.id} incident={i} />)
        ) : (
          <div className="card card-flat">
            <EmptyState title="No current incidents">
              Everything looks fine. <Link to="/citizen/report">Report a problem</Link> if your power is off.
            </EmptyState>
          </div>
        )}
      </section>

      <section className="stack">
        <h2>History</h2>
        {data.history.length ? (
          data.history.map((i) => <HistoryItem key={i.id} incident={i} />)
        ) : (
          <p className="muted">Resolved incidents will appear here.</p>
        )}
      </section>
    </div>
  );
}
