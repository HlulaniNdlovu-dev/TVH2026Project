import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import IncidentTable from '../../features/incidents/IncidentTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatDuration, formatTime, timeAgo } from '../../utils/format.js';

export default function AdminDashboardPage() {
  const { data, error, loading } = usePolling(adminService.getOverview, 3000);
  if (loading && !data) return <Spinner label="Loading the grid..." />;
  if (!data) return <Banner tone="error">{error?.message ?? 'Could not load the dashboard.'}</Banner>;
  const k = data.kpis;

  return (
    <>
      <PageHeader title="Grid overview" subtitle="Live health of the network and the response to outages." actions={<Link className="btn" to="/admin/grid">Open live map</Link>} />
      {error && <Banner tone="warn">Trying to reconnect to the server...</Banner>}
      {data.loadsheddingAreas.map((a) => (
        <div key={a.area} style={{ marginBottom: 12 }}>
          <Banner tone="warn"><strong>Loadshedding in {a.area}</strong> (Stage {a.stage}) until {formatTime(a.until)}. Outages there are not dispatched.</Banner>
        </div>
      ))}

      <div className="stat-grid">
        <StatCard label="Active outages" value={k.activeIncidents} icon="alert" tone={k.activeIncidents ? 'red' : 'green'} hint={k.pendingReports ? `${k.pendingReports} report(s) awaiting verification` : 'All verified'} />
        <StatCard label="Customers without power" value={k.customersWithoutPower} icon="bolt" tone={k.customersWithoutPower ? 'red' : 'green'} hint={`of ${k.totalCustomers} monitored${k.customersInLoadshedding ? ` · ${k.customersInLoadshedding} in loadshedding` : ''}`} />
        <StatCard label="Avg response time" value={formatDuration(k.avgResponseMinutes)} icon="clock" tone="blue" hint="report to technician on site" />
        <StatCard label="Avg resolution time" value={formatDuration(k.avgResolutionMinutes)} icon="check" tone="blue" hint="report to power restored" />
        <StatCard label="SLA breaches" value={k.slaBreaches} icon="shield" tone={k.slaBreaches ? 'amber' : 'green'} hint={`${k.unassignedUrgent} urgent job(s) unassigned`} />
        <StatCard label="Technicians available" value={`${k.techniciansAvailable}`} icon="truck" hint={`${k.techniciansBusy} busy · ${k.techniciansUnavailable} unavailable`} />
        <StatCard label="Sensors offline" value={k.sensorsOffline} icon="sensor" tone={k.sensorsOffline ? 'amber' : 'green'} hint={`of ${k.sensorsTotal} sensors`} />
      </div>

      <div className="grid-main">
        <section>
          <div className="row-between" style={{ margin: '24px 0 10px' }}>
            <h2 style={{ margin: 0 }}>Priority queue</h2>
            <Link to="/admin/incidents">All incidents</Link>
          </div>
          <IncidentTable incidents={data.queue} compact />
        </section>
        <section>
          <h2 style={{ margin: '24px 0 10px' }}>Recent activity</h2>
          <div className="card">
            {data.recentEvents.length ? (
              <ul className="timeline">
                {data.recentEvents.map((e, i) => (
                  <li key={i}>
                    <span className="muted small">{timeAgo(e.ts)}</span> <Link to={`/admin/incidents/${e.incidentId}`}>{e.incidentId}</Link> {e.message}
                  </li>
                ))}
              </ul>
            ) : <p className="muted" style={{ margin: 0 }}>Quiet for now. Use the simulator to create an outage.</p>}
          </div>
        </section>
      </div>
    </>
  );
}
