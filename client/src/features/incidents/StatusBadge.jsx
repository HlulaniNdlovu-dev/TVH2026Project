import { PRIORITY_TONE, STATUS_LABELS, STATUS_TONE } from './incidentLabels.js';

// `awaiting`: dispatched, but the technician has not accepted the job yet.
export function StatusBadge({ status, awaiting = false }) {
  if (status === 'dispatched' && awaiting) return <span className="badge badge-amber">Awaiting technician</span>;
  return <span className={`badge badge-${STATUS_TONE[status] ?? 'grey'}`}>{STATUS_LABELS[status] ?? status}</span>;
}

export function PriorityBadge({ level, overridden }) {
  return (
    <span className={`badge badge-${PRIORITY_TONE[level] ?? 'grey'}`}>
      {String(level ?? 'low').toUpperCase()}
      {overridden ? ' (override)' : ''}
    </span>
  );
}
