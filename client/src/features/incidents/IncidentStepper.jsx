import { STEPS, stepIndex } from './incidentLabels.js';
import { formatTime } from '../../utils/format.js';
import Icon from '../../components/Icon.jsx';

// Shows how far an incident has progressed. The citizen sees stages only, never a technician's location.
export default function IncidentStepper({ incident, variant = 'vertical' }) {
  const current = stepIndex(incident.status);
  const resolved = incident.status === 'resolved';
  const paused = incident.status === 'paused';
  // "Dispatched" waits (pulsing) until the technician accepts, then turns green.
  const awaiting = Boolean(incident.awaitingAcceptance);
  const accepted = incident.status === 'dispatched' && !awaiting;
  const at = Object.fromEntries((incident.steps ?? []).map((s) => [s.status, s.at]));
  at.dispatched = awaiting ? null : incident.acceptedAt ?? at.dispatched;

  const stateOf = (i) => {
    if (resolved || i < current) return 'done';
    if (i === current) return accepted ? 'done' : 'now';
    return 'todo';
  };

  const label = (step) => (step.status === 'dispatched' && awaiting ? 'Dispatching' : step.label);

  const detail = (status) => {
    if (status === 'dispatched') {
      if (awaiting) return 'Finding a technician…';
      if (incident.technician) return `Technician ${incident.technician.employeeId} accepted`;
    }
    if (status === 'en_route' && incident.status === 'en_route' && incident.etaMinutes) return `Estimated arrival in ~${incident.etaMinutes} min`;
    if (status === 'working' && paused) return `Paused: ${incident.pausedReason}`;
    if (status === 'working' && incident.resumedAt) return `Resumed · ${formatTime(incident.resumedAt)}`;
    return null;
  };

  const modifiers = (i) => {
    if (i !== current) return '';
    if (paused) return 'paused';
    if (awaiting) return 'pending';
    return '';
  };

  if (variant === 'horizontal') {
    return (
      <div className="stepper-h" aria-label="Incident progress">
        {STEPS.map((step, i) => (
          <span key={step.status} className={`seg ${stateOf(i) === 'todo' ? '' : stateOf(i)} ${modifiers(i)}`} title={label(step)} />
        ))}
      </div>
    );
  }

  return (
    <ol className="stepper-v">
      {STEPS.map((step, i) => {
        const state = stateOf(i);
        const extra = detail(step.status);
        return (
          <li key={step.status} className={`step ${state} ${modifiers(i)}`}>
            <span className="step-dot">{state === 'done' ? <Icon name="check" size={14} /> : null}</span>
            <div className="step-body">
              <div className="step-label">{label(step)}</div>
              {at[step.status] && state !== 'todo' && <div className="step-time">{formatTime(at[step.status])}</div>}
              {extra && state !== 'todo' && <div className="step-extra">{extra}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
