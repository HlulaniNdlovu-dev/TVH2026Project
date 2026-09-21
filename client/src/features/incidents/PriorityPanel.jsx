import { useState } from 'react';
import { PriorityBadge } from './StatusBadge.jsx';
import Banner from '../../components/Banner.jsx';
import * as adminService from '../../services/adminService.js';
import { useToast } from '../../components/Toast.jsx';

const LABELS = {
  customers: 'Customers affected',
  criticalFacilities: 'Critical facilities',
  vulnerableCustomers: 'Vulnerable customers',
  dangerReport: 'Danger reported',
  citizenReports: 'Citizen reports (weighted)',
  sensorConfirmed: 'Sensor confirmed',
  waitingTime: 'Waiting time',
  extendedLoadshedding: 'Overran loadshedding',
};

// Shows how the system scored an incident and lets an admin override the level (with a reason).
export default function PriorityPanel({ incident, onChanged }) {
  const toast = useToast();
  const [level, setLevel] = useState(incident.override?.level ?? incident.priority.calculatedLevel);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const max = Math.max(50, ...Object.values(incident.priorityBreakdown));

  const apply = async (chosen) => {
    if (!reason.trim() && chosen !== 'clear') return setError('A reason is required to override the priority.');
    setBusy(true);
    setError('');
    try {
      await adminService.overridePriority(incident.id, chosen, reason.trim());
      toast(chosen === 'clear' ? 'Override removed' : 'Priority overridden');
      setReason('');
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <div className="row-between">
        <h2 style={{ margin: 0 }}>Priority</h2>
        <PriorityBadge level={incident.priority.level} overridden={incident.priority.overridden} />
      </div>
      <p className="muted small" style={{ margin: '4px 0 10px' }}>
        System score {incident.priority.score} ({incident.priority.calculatedLevel})
        {incident.override && <> · overridden to <strong>{incident.override.level}</strong> by {incident.override.by}: “{incident.override.reason}”</>}
      </p>
      {Object.entries(incident.priorityBreakdown).map(([key, value]) => (
        <div className="bar-row" key={key}>
          <span>{LABELS[key] ?? key}</span>
          <span className="bar-track"><span style={{ width: `${(value / max) * 100}%` }} /></span>
          <strong>{value}</strong>
        </div>
      ))}
      {['resolved', 'merged'].includes(incident.status) ? null : (
        <>
          <hr className="divider" />
          <h3>Override priority</h3>
          {error && <Banner tone="error">{error}</Banner>}
          <div className="row" style={{ marginTop: 8 }}>
            <select value={level} onChange={(e) => setLevel(e.target.value)} style={{ width: 'auto' }} aria-label="Priority level">
              {['critical', 'high', 'medium', 'low'].map((l) => <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>)}
            </select>
            <input type="text" className="grow" placeholder="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Override reason" />
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button type="button" className="btn btn-sm" disabled={busy} onClick={() => apply(level)}>Apply override</button>
            {incident.override && <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={() => apply('clear')}>Remove override</button>}
          </div>
        </>
      )}
    </div>
  );
}
