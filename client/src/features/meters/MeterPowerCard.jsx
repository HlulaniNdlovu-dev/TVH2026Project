import { formatWatts } from '../../utils/format.js';

const MAX_WATTS = 3500;

// Live reading from the citizen's smart meter sensor.
export default function MeterPowerCard({ meter }) {
  const on = meter.state === 'ON';
  const loadshedding = meter.offReason === 'loadshedding';
  const percent = Math.min(100, (meter.watts / MAX_WATTS) * 100);
  return (
    <div className={`card meter-card ${on ? 'meter-on' : loadshedding ? 'meter-ls' : 'meter-off'}`}>
      <div className="row-between">
        <div>
          <strong>{meter.label}</strong>
          <div className="muted small">Meter {meter.meterNumber}</div>
        </div>
        <span className={`badge ${on ? 'badge-green' : loadshedding ? 'badge-amber' : 'badge-red'}`}>
          {on ? 'Power on' : loadshedding ? 'Loadshedding' : 'Power off'}
        </span>
      </div>
      <div className="meter-reading">
        <span className="watts">{on ? formatWatts(meter.watts) : '0 W'}</span>
        <span className="muted small">{meter.online ? 'live from your meter' : 'sensor not reporting'}</span>
      </div>
      <div className="meter-bar" aria-hidden="true"><span style={{ width: `${on ? percent : 0}%` }} /></div>
      <div className="muted small" style={{ marginTop: 6 }}>{meter.address}</div>
    </div>
  );
}
