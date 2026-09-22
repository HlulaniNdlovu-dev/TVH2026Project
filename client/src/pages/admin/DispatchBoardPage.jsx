import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import AssignModal from '../../features/dispatch/AssignModal.jsx';
import { PriorityBadge } from '../../features/incidents/StatusBadge.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useToast } from '../../components/Toast.jsx';
import { formatDuration } from '../../utils/format.js';

const ACTIVITY_TONE = { Idle: 'green', 'Job offered': 'blue', 'En route': 'amber', 'On site': 'green', Working: 'green', Paused: 'amber', Unavailable: 'grey' };

export default function DispatchBoardPage() {
  const toast = useToast();
  const { data, error, loading, refresh } = usePolling(adminService.getDispatchBoard, 3000, [], 'admin:dispatch');
  const [assigning, setAssigning] = useState(null);
  if (loading && !data) return <Spinner />;
  if (!data) return <Banner tone="error">{error?.message}</Banner>;

  return (
    <>
      <PageHeader title="Dispatch board" subtitle="The system assigns automatically. Use this board to step in, or to see who is free." />
      <div className="dispatch-layout">
        <section className="stack">
          <h2>Waiting for a technician ({data.unassigned.length})</h2>
          {data.unassigned.length ? data.unassigned.map((i) => (
            <div key={i.id} className="card card-flat dispatch-item">
              <div className="grow">
                <div className="row"><PriorityBadge level={i.priority.level} overridden={i.priority.overridden} /><Link to={`/admin/incidents/${i.id}`}><strong>{i.id}</strong></Link></div>
                <div>{i.nodeName} · {i.area}</div>
                <div className="muted small">{i.affectedCount} customer(s) · waiting {formatDuration(i.minutesOpen)}</div>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => setAssigning(i)}>Assign</button>
            </div>
          )) : <div className="card card-flat"><p className="muted" style={{ margin: 0 }}>Every verified outage has a technician. Nice work.</p></div>}

          {data.awaitingVerification.length > 0 && (
            <>
              <h2 style={{ marginTop: 10 }}>Awaiting verification ({data.awaitingVerification.length})</h2>
              {data.awaitingVerification.map((i) => (
                <div key={i.id} className="card card-flat dispatch-item">
                  <div className="grow">
                    <Link to={`/admin/incidents/${i.id}`}><strong>{i.id}</strong></Link> · {i.nodeName}
                    <div className="muted small">{i.reportCount} citizen report(s), not yet confirmed by sensors</div>
                  </div>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setAssigning(i)}>Verify and assign</button>
                </div>
              ))}
            </>
          )}
        </section>

        <section className="stack">
          <h2>Technicians</h2>
          {data.technicians.map((t) => (
            <div key={t.id} className="card card-flat">
              <div className="row-between">
                <div><strong>{t.name}</strong> <span className="muted small">{t.employeeId}</span></div>
                <span className={`badge badge-${ACTIVITY_TONE[t.activity] ?? 'grey'}`}>{t.activity}</span>
              </div>
              <div className="muted small">{t.openJobs} open job(s){t.currentIncident ? ` · on ${t.currentIncident}` : ''} · skills: {t.skills.join(', ')}</div>
            </div>
          ))}
        </section>
      </div>

      {assigning && (
        <AssignModal incident={assigning} technicians={data.technicians} onClose={() => setAssigning(null)} onAssigned={() => { setAssigning(null); toast('Technician assigned'); refresh(); }} />
      )}
    </>
  );
}
