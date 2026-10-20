import Switch from '../../components/Switch.jsx';
import * as simulator from '../../services/simulatorService.js';

export default function TechnicianPanel({ technicians, autoDrive, driveSeconds, run, busy }) {
  return (
    <section className="card sim-card">
      <h2>Technicians</h2>
      <p className="muted small">Technicians who tap &quot;Navigate&quot; drive to the incident and arrive in about {driveSeconds} seconds.</p>
      <div className="row">
        <Switch checked={autoDrive} disabled={busy} label="Auto-drive technicians" onChange={(on) => run(() => simulator.setAutoDrive(on))} />
        <span className="small">Auto-drive technicians</span>
      </div>
      <ul className="sim-list">
        {technicians.length ? technicians.map((t) => (
          <li key={t.id}>
            <span>{t.name}</span>
            <span className={`badge ${t.destination ? 'badge-blue' : t.dutyStatus === 'available' ? 'badge-green' : ''}`}>{t.destination ? 'driving' : t.dutyStatus}</span>
          </li>
        )) : <li className="muted">No technicians yet</li>}
      </ul>
    </section>
  );
}
