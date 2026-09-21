import { STEPS, stepIndex } from './incidentLabels.js';
import { formatTime } from '../../utils/format.js';
import Icon from '../../components/Icon.jsx';

// Shows how far an incident has progressed. The citizen sees stages only, never a technician's location.
export default function IncidentStepper({ incident, variant = 'vertical' }) {
  const current = stepIndex(incident.status);
  const resolved = incident.status === 'resolved';
  const at = Object.fromEntries((incident.steps ?? []).map((s) => [s.status, s.at]));

  const detail = (status) => {
    if (status === 'dispatched' && incident.technician) return `Technician ${incident.technician.employeeId}`;
    if (status === 'en_route' && incident.status === 'en_route' && incident.etaMinutes) return `Estimated arrival in ~${incident.etaMinutes} min`;
    if (status === 'working' && incident.status === 'paused') return `Paused: ${incident.pausedReason}`;
    return null;
  };

  if (variant === 'horizontal') {
    return (
      <div className="stepper-h" aria-label="Incident progress">
        {STEPS.map((step, i) => (
          <span key={step.status} className={`seg ${i < current || resolved ? 'done' : i === current ? 'now' : ''} ${incident.status === 'paused' && i === current ? 'paused' : ''}`} title={step.label} />
        ))}
      </div>
    );
  }

  return (
    <ol className="stepper-v">
      {STEPS.map((step, i) => {
        const state = resolved || i < current ? 'done' : i === current ? 'now' : 'todo';
        const extra = detail(step.status);
        return (
          <li key={step.status} className={`step ${state} ${incident.status === 'paused' && state === 'now' ? 'paused' : ''}`}>
            <span className="step-dot">{state === 'done' ? <Icon name="check" size={14} /> : null}</span>
            <div className="step-body">
              <div className="step-label">{step.label}</div>
              {at[step.status] && state !== 'todo' && <div className="step-time">{formatTime(at[step.status])}</div>}
              {extra && state !== 'todo' && <div className="step-extra">{extra}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
