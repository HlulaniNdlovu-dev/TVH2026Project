import { Link } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from '../incidents/StatusBadge.jsx';
import Icon from '../../components/Icon.jsx';
import { formatDateTime } from '../../utils/format.js';

// A job in a list. Jobs that have not been accepted yet get Accept / Decline buttons.
export default function TaskCard({ job, highlight = false, onAccept, onDecline, busy }) {
  return (
    <div className={`card task-card ${highlight ? 'card-accent' : 'card-flat'} ${job.danger ? 'task-danger' : ''}`}>
      <div className="row-between">
        <div className="row">
          <PriorityBadge level={job.priorityLevel} />
          <StatusBadge status={job.status} />
          {job.state === 'pending' && <span className="badge badge-dark">New offer</span>}
        </div>
        <span className="muted small">{job.incidentId}</span>
      </div>
      <h3 style={{ margin: '10px 0 2px' }}>{job.category}</h3>
      <div className="task-meta">
        <span><Icon name="pin" size={15} /> {job.area}</span>
        <span><Icon name="users" size={15} /> {job.affectedCount} customer(s)</span>
        {job.status === 'en_route' && job.etaMinutes && <span><Icon name="clock" size={15} /> ETA {job.etaMinutes} min</span>}
      </div>
      {job.danger && <div className="banner banner-error" style={{ margin: '10px 0 0' }}>Safety hazard reported</div>}
      <div className="muted small" style={{ margin: '8px 0 12px' }}>Assigned {formatDateTime(job.offeredAt)}</div>

      {job.state === 'pending' ? (
        <div className="row">
          <button type="button" className="btn grow" disabled={busy} onClick={() => onAccept?.(job)}>Accept</button>
          <button type="button" className="btn btn-warn grow" disabled={busy} onClick={() => onDecline?.(job)}>Decline</button>
        </div>
      ) : null}
      <Link className={`btn ${job.state === 'pending' ? 'btn-ghost' : ''} btn-block`} style={{ marginTop: job.state === 'pending' ? 6 : 0 }} to={`/technician/tasks/${job.id}`}>
        {job.state === 'pending' ? 'View details' : 'Open task'}
      </Link>
    </div>
  );
}
