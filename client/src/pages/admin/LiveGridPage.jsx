import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import GridMap, { GridLegend } from '../../features/map/GridMap.jsx';
import { PriorityBadge, StatusBadge } from '../../features/incidents/StatusBadge.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';

export default function LiveGridPage() {
  const { data, error, loading } = usePolling(adminService.getGrid, 2500, [], 'admin:grid');
  const [focus, setFocus] = useState('all');
  if (loading && !data) return <Spinner label="Loading the grid..." />;
  if (!data) return <Banner tone="error">{error?.message ?? 'Could not load the grid.'}</Banner>;

  const off = data.nodes.filter((n) => n.type === 'house' && n.state === 'OFF').length;
  const active = data.incidents.filter((i) => i.status !== 'reported' || i.sensorConfirmed || i.danger);

  return (
    <>
      <PageHeader title="Live grid map" subtitle={`${data.nodes.length} sensors reporting · ${off} customer(s) without power · refreshes every few seconds`} />
      <div className="grid-map-layout">
        <div>
          <div className="tabs" role="tablist" style={{ marginBottom: 10 }}>
            {['all', ...new Set(data.nodes.map((n) => n.area))].map((area) => (
              <button key={area} type="button" role="tab" aria-selected={focus === area} className={focus === area ? 'active' : ''} onClick={() => setFocus(area)}>
                {area === 'all' ? 'All areas' : area}
              </button>
            ))}
          </div>
          <GridMap grid={data} focus={focus} />
          <GridLegend />
        </div>
        <aside className="card map-side">
          <h2>Active incidents ({active.length})</h2>
          {active.length ? (
            <div className="stack-sm">
              {active.sort((a, b) => b.priority.effective - a.priority.effective).map((i) => (
                <Link key={i.id} to={`/admin/incidents/${i.id}`} className="side-incident">
                  <div className="row-between"><strong>{i.id}</strong><PriorityBadge level={i.priority.level} overridden={i.priority.overridden} /></div>
                  <div className="small">{i.nodeName}</div>
                  <div className="row small muted"><StatusBadge status={i.status} /> {i.affectedCount} customers · {i.technician ? i.technician.name : 'unassigned'}</div>
                </Link>
              ))}
            </div>
          ) : <p className="muted">The grid is healthy. Trip a sensor in the simulator to see an incident appear here.</p>}
        </aside>
      </div>
    </>
  );
}
