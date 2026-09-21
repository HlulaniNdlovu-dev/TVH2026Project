import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import TechnicianMap from '../../features/map/TechnicianMap.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { timeAgo } from '../../utils/format.js';

const TONE = { Idle: 'green', 'Job offered': 'blue', 'En route': 'amber', 'On site': 'green', Working: 'green', Paused: 'amber', Unavailable: 'grey' };

export default function TechnicianOversightPage() {
  const { data, error, loading } = usePolling(adminService.getTechnicians, 2500);
  if (loading && !data) return <Spinner />;
  if (!data) return <Banner tone="error">{error?.message}</Banner>;

  return (
    <>
      <PageHeader title="Technician oversight" subtitle="GPS position, duty status and active routes. Customers never see this view." />
      <TechnicianMap technicians={data} />
      <div className="map-legend" style={{ marginBottom: 18 }}>
        <span><b className="mk-mini" style={{ background: 'var(--blue)', borderRadius: '50%' }}>T</b> Available</span>
        <span><b className="mk-mini" style={{ background: '#d98a12', borderRadius: '50%' }}>T</b> En route</span>
        <span><b className="mk-mini" style={{ background: 'var(--green-600)', borderRadius: '50%' }}>T</b> On site</span>
        <span><b className="mk-mini" style={{ background: '#8a978f', borderRadius: '50%' }}>T</b> Unavailable</span>
        <span>Dashed line: active route</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Technician</th><th>Duty</th><th>Activity</th><th>Current incident</th><th>ETA</th><th>Open jobs</th><th>Done today</th><th>Last GPS</th></tr></thead>
          <tbody>
            {data.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.name}</strong><div className="muted small">{t.employeeId} · {t.skills.join(', ')}</div></td>
                <td><span className={`badge ${t.dutyStatus === 'available' ? 'badge-green' : 'badge-grey'}`}>{t.dutyStatus === 'available' ? 'Available' : 'Unavailable'}</span></td>
                <td><span className={`badge badge-${TONE[t.activity] ?? 'grey'}`}>{t.activity}</span></td>
                <td>{t.currentIncident ? <Link to={`/admin/incidents/${t.currentIncident}`}>{t.currentIncident}</Link> : <span className="muted">-</span>}</td>
                <td>{t.route?.etaMinutes ? `~${t.route.etaMinutes} min` : '-'}</td>
                <td>{t.openJobs}</td>
                <td>{t.completedToday}</td>
                <td className="muted">{timeAgo(t.lastLocationAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
