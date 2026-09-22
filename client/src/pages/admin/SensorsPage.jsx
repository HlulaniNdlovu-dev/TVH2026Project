import { useState } from 'react';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard, { pct } from '../../components/StatCard.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatWatts, timeAgo } from '../../utils/format.js';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'off', label: 'Power off' },
  { value: 'offline', label: 'Not reporting' },
  { value: 'flicker', label: 'Flickering' },
];

const TYPE_LABEL = { substation: 'Substation', transformer: 'Transformer', house: 'Meter' };

export default function SensorsPage() {
  const { data, error, loading } = usePolling(adminService.getSensors, 3000, [], 'admin:sensors');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  if (loading && !data) return <Spinner />;
  if (!data) return <Banner tone="error">{error?.message}</Banner>;

  const shown = data
    .filter((s) => (filter === 'off' ? s.state === 'OFF' : filter === 'offline' ? !s.online : filter === 'flicker' ? s.flickerCount > 0 : true))
    .filter((s) => !query || `${s.name} ${s.meterNumber ?? ''} ${s.owner ?? ''} ${s.area}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader title="Sensors" subtitle="Health of every smart meter, transformer and substation sensor." />
      <div className="stat-grid stat-grid-half" style={{ marginBottom: 18 }}>
        <StatCard label="Sensors" value={data.length} progress={pct(data.filter((s) => s.online).length, data.length)} hint={`${data.filter((s) => s.online).length} reporting`} />
        <StatCard label="Reporting power off" value={data.filter((s) => s.state === 'OFF').length} progress={pct(data.filter((s) => s.state === 'OFF').length, data.length)} tone="red" hint={`of ${data.length} sensors`} />
        <StatCard label="Not reporting" value={data.filter((s) => !s.online).length} progress={pct(data.filter((s) => !s.online).length, data.length)} tone="amber" hint="no heartbeat for 30 s" />
        <StatCard label="Flicker events" value={data.reduce((sum, s) => sum + s.flickerCount, 0)} progress={pct(data.reduce((sum, s) => sum + s.flickerCount, 0), Math.max(20, data.reduce((sum, s) => sum + s.flickerCount, 0)))} tone="blue" hint="brief drops that were ignored (bar: 20)" />
      </div>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="tabs">
          {FILTERS.map((f) => <button key={f.value} type="button" className={filter === f.value ? 'active' : ''} onClick={() => setFilter(f.value)}>{f.label}</button>)}
        </div>
        <input type="search" placeholder="Search meter, owner or area" value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 280 }} aria-label="Search sensors" />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Sensor</th><th>Type</th><th>Area</th><th>State</th><th>Load</th><th>Battery</th><th>Heartbeat</th><th>Flickers</th></tr></thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.type === 'house' ? s.meterNumber : s.name}</strong><div className="muted small">{s.id}{s.owner ? ` · ${s.owner}` : ''}</div></td>
                <td>{TYPE_LABEL[s.type]}</td>
                <td>{s.area}</td>
                <td><span className={`badge ${s.state === 'ON' ? 'badge-green' : s.offReason === 'loadshedding' ? 'badge-amber' : 'badge-red'}`}>{s.state === 'ON' ? 'ON' : s.offReason === 'loadshedding' ? 'OFF (loadshedding)' : 'OFF'}</span></td>
                <td>{formatWatts(s.watts)}</td>
                <td>{s.battery}%</td>
                <td><span className={s.online ? '' : 'error'} style={s.online ? undefined : { color: 'var(--amber)', fontWeight: 600 }}>{timeAgo(s.lastHeartbeat)}</span></td>
                <td>{s.flickerCount}</td>
              </tr>
            ))}
            {!shown.length && <tr><td colSpan={8} className="center muted">No sensors match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
