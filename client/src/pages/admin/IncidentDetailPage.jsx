import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import { photoUrl } from '../../services/api.js';
import PriorityPanel from '../../features/incidents/PriorityPanel.jsx';
import { PriorityBadge, StatusBadge } from '../../features/incidents/StatusBadge.jsx';
import AssignModal from '../../features/dispatch/AssignModal.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useToast } from '../../components/Toast.jsx';
import { formatDateTime, formatDistance, formatDuration } from '../../utils/format.js';

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
  const toast = useToast();
  const { data: incident, error, loading, refresh } = usePolling(() => adminService.getIncident(incidentId), 3000, [incidentId], `admin:incident:${incidentId}`);
  const board = usePolling(adminService.getDispatchBoard, 6000, [], 'admin:dispatch');
  const [assigning, setAssigning] = useState(false);

  if (loading && !incident) return <Spinner />;
  if (!incident) return <Banner tone="error">{error?.message ?? 'Incident not found.'}</Banner>;

  const closed = ['resolved', 'merged'].includes(incident.status);
  const verify = async () => {
    try {
      await adminService.verifyIncident(incident.id);
      toast('Incident verified');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <Link to="/admin/incidents" className="back-link">← All incidents</Link>
      <PageHeader
        title={`${incident.id} · ${incident.nodeName}`}
        subtitle={`${incident.category} · ${incident.area} · opened ${formatDateTime(incident.createdAt)} (${formatDuration(incident.minutesOpen)})`}
        actions={<><PriorityBadge level={incident.priority.level} overridden={incident.priority.overridden} /><StatusBadge status={incident.status} /></>}
      />
      {incident.danger && <div style={{ marginBottom: 12 }}><Banner tone="error"><strong>Safety hazard reported</strong> (downed line or sparking equipment).</Banner></div>}

      <div className="detail-layout">
        <div className="stack">
          <div className="card">
            <h2>Summary</h2>
            <p>{incident.description}</p>
            <div className="detail-facts">
              <div><span className="muted small">Source</span><strong>{incident.sensorConfirmed ? 'Sensor confirmed' : 'Citizen report only'}</strong></div>
              <div><span className="muted small">Customers affected</span><strong>{incident.affectedCount}</strong></div>
              <div><span className="muted small">Reports grouped</span><strong>{incident.reports.length}</strong></div>
              {incident.criticalFacilities.length > 0 && <div><span className="muted small">Critical facility</span><strong>{incident.criticalFacilities.join(', ')}</strong></div>}
              {incident.status === 'paused' && <div><span className="muted small">Paused because</span><strong>{incident.pausedReason}</strong></div>}
              {incident.etaMinutes && incident.status === 'en_route' && <div><span className="muted small">ETA</span><strong>~{incident.etaMinutes} min</strong></div>}
            </div>
            {incident.status === 'reported' && (
              <div style={{ marginTop: 14 }}>
                <Banner tone="info" action={<button type="button" className="btn btn-sm" onClick={verify}>Verify now</button>}>
                  Not yet confirmed by sensors. It will be verified automatically once the sensors agree, a second neighbour reports, or you verify it.
                </Banner>
              </div>
            )}
            {incident.resolution && (
              <>
                <hr className="divider" />
                <h3>Resolution</h3>
                <p style={{ marginBottom: 4 }}><strong>Cause:</strong> {incident.resolution.faultCause}</p>
                {incident.resolution.partsUsed && <p style={{ marginBottom: 4 }}><strong>Parts used:</strong> {incident.resolution.partsUsed}</p>}
                {incident.resolution.notes && <p style={{ marginBottom: 4 }}><strong>Notes:</strong> {incident.resolution.notes}</p>}
                <p className="muted small" style={{ marginBottom: 0 }}>{incident.resolution.auto ? 'Closed automatically when sensors reported power back.' : `Closed by ${incident.resolution.resolvedBy}.`}</p>
              </>
            )}
          </div>

          <div className="card">
            <h2>Reports ({incident.reports.length})</h2>
            {incident.reports.length ? incident.reports.map((r) => (
              <div key={r.id} className="report-line" style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="grow">
                  <strong>{r.reporter}</strong> <span className="muted small">· meter {r.meterNumber} · {formatDateTime(r.createdAt)}</span>
                  <div className="small"><span className={`badge ${r.atProperty ? 'badge-green' : 'badge-amber'}`}>{r.atProperty ? 'At property' : `Away${r.distanceMeters != null ? ` (${formatDistance(r.distanceMeters)})` : ''}`}</span> {r.category}</div>
                  <div>{r.description}</div>
                </div>
                {r.photoId && <a className="photo-link" href={photoUrl(r.photoId)} target="_blank" rel="noreferrer"><img src={photoUrl(r.photoId)} alt="Report" /></a>}
              </div>
            )) : <p className="muted">No citizen reports. This outage was detected by sensors alone.</p>}
          </div>

          <div className="card">
            <h2>Affected meters ({incident.affectedMeters.length})</h2>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Meter</th><th>Owner</th><th>Address</th><th>State</th></tr></thead>
                <tbody>
                  {incident.affectedMeters.map((m) => (
                    <tr key={m.nodeId}>
                      <td className="mono">{m.meterNumber}</td>
                      <td>{m.owner ?? <span className="muted">Unregistered</span>}</td>
                      <td>{m.critical ? <strong>{m.critical}</strong> : m.address}</td>
                      <td><span className={`badge ${m.state === 'OFF' ? 'badge-red' : 'badge-green'}`}>{m.state}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Technician</h2>
            {incident.technician ? (
              <>
                <p style={{ marginBottom: 4 }}><strong>{incident.technician.name}</strong></p>
                {incident.job && <p className="muted small">{incident.job.assignedBy}{incident.job.reasoning ? ` · ${incident.job.reasoning}` : ''} · offer {incident.job.state}</p>}
              </>
            ) : <p className="muted">{closed ? 'No technician assigned.' : 'Waiting for a technician. The system assigns the best available match automatically.'}</p>}
            {incident.declinedBy.length > 0 && <p className="small muted">Declined by: {incident.declinedBy.join(', ')}</p>}
            {!closed && (
              <button type="button" className="btn btn-outline btn-block" disabled={!board.data} onClick={() => setAssigning(true)}>
                {incident.technician ? 'Reassign technician' : 'Assign technician manually'}
              </button>
            )}
          </div>

          <PriorityPanel incident={incident} onChanged={refresh} />

          <div className="card">
            <h2>Timeline</h2>
            <ul className="timeline">
              {[...incident.timeline].reverse().map((e, i) => (
                <li key={i}>
                  <span className="muted small">{formatDateTime(e.ts)}</span><br />
                  {e.message}{e.reason ? <span className="muted"> · “{e.reason}”</span> : null}
                  {e.actor && e.actor !== 'system' && <span className="muted small"> · {e.actor}</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {assigning && board.data && (
        <AssignModal incident={incident} technicians={board.data.technicians} onClose={() => setAssigning(false)} onAssigned={() => { setAssigning(false); toast('Technician assigned'); refresh(); }} />
      )}
    </>
  );
}
