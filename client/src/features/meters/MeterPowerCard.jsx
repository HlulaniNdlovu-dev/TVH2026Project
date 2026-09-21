import { formatWatts } from '../../utils/format.js';

const FULL_UNITS = 100;
const LOW_UNITS = 10;

// The citizen's smart meter: prepaid units left come first, the live power draw is secondary.
export default function MeterPowerCard({ meter }) {
  const on = meter.state === 'ON';
  const loadshedding = meter.offReason === 'loadshedding';
  const units = meter.units ?? 0;
  const low = units < LOW_UNITS;
  const percent = Math.min(100, (units / FULL_UNITS) * 100);
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
        <span className={`watts ${low ? 'units-low' : ''}`}>{units.toFixed(1)}</span>
        <span className="meter-unit-label">units left{low ? ' - running low, buy more soon' : ''}</span>
      </div>
      <div className={`meter-bar ${low ? 'meter-bar-low' : ''}`} aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
      <div className="meter-secondary muted small">
        {on ? `Using ${formatWatts(meter.watts)} right now` : 'Not using power right now'} · {meter.online ? 'live from your meter' : 'sensor not reporting'}
      </div>
      <div className="muted small" style={{ marginTop: 4 }}>{meter.address}</div>
    </div>
  );
}
