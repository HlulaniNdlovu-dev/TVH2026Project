import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import * as jobService from '../../services/jobService.js';
import { photoUrl } from '../../services/api.js';
import { useJobActions } from '../../features/jobs/useJobActions.js';
import DeclineJobModal from '../../features/jobs/DeclineJobModal.jsx';
import PauseJobModal from '../../features/jobs/PauseJobModal.jsx';
import AffectedAreaMap from '../../features/map/AffectedAreaMap.jsx';
import { PriorityBadge, StatusBadge } from '../../features/incidents/StatusBadge.jsx';
import Banner from '../../components/Banner.jsx';
import Icon from '../../components/Icon.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatDateTime, formatTime } from '../../utils/format.js';
import { googleMapsDirections } from '../../utils/geo.js';

export default function TaskDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { data: job, error, loading, refresh } = usePolling(() => jobService.getJob(jobId), 3000, [jobId]);
  const actions = useJobActions(jobId, refresh);
  const [declining, setDeclining] = useState(false);
  const [pausing, setPausing] = useState(false);

  if (loading && !job) return <Spinner label="Loading task..." />;
  if (!job) return <Banner tone="error">{error?.message ?? 'Could not load this task.'}</Banner>;

  const { incident, site, affectedArea, technicianLocation } = job;
  const closed = ['closed', 'cancelled', 'declined'].includes(job.state);
  const inProgress = ['arrived', 'working', 'paused'].includes(incident.status) && !closed;
  const canTravel = job.state === 'accepted' && ['dispatched', 'en_route'].includes(incident.status);
  // The route map is only useful between accepting the job and arriving on site (Start Job).
  const showRouteMap = canTravel && !closed && site;

  // Navigate opens the route in Google Maps, and tells the customer you are on your way.
  const navigateNow = async () => {
    if (incident.status === 'dispatched') await actions.travel();
    window.open(googleMapsDirections(site.lat, site.lng), '_blank', 'noopener');
  };

  return (
    <div className="stack">
      <Link to="/technician/dashboard" className="back-link">← Back to dashboard</Link>

      <div>
        <div className="row"><PriorityBadge level={incident.priority.level} /><StatusBadge status={incident.status} /><span className="muted small">{incident.id}</span></div>
        <h1 style={{ margin: '8px 0 2px' }}>{incident.category}</h1>
        <div className="muted">{incident.area} · assigned {formatDateTime(job.offeredAt)}</div>
      </div>

      {incident.danger && <Banner tone="error"><strong>Safety warning:</strong> a downed line or sparking equipment was reported. Treat the site as live and isolate before approaching.</Banner>}
      {job.state === 'cancelled' && <Banner tone="warn">This job was cancelled: {job.cancelReason ?? 'reassigned'}. You are free for new work.</Banner>}
      {job.state === 'closed' && <Banner tone="success">You closed this job. Well done.</Banner>}
      {job.state === 'declined' && <Banner tone="info">You declined this job.</Banner>}

      {job.state === 'pending' && (
        <div className="card card-accent">
          <h2>New job offered</h2>
          <p className="muted">{job.reasoning ? `Why you: ${job.reasoning}.` : 'You have been assigned this job.'}</p>
          <div className="row">
            <button type="button" className="btn grow" disabled={actions.busy} onClick={actions.accept}>Accept job</button>
            <button type="button" className="btn btn-warn grow" disabled={actions.busy} onClick={() => setDeclining(true)}>Decline</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Job description</h2>
        <p style={{ marginBottom: 6 }}>{incident.description}</p>
        <p className="muted small">Generated automatically from sensor data and citizen reports.</p>
        <div className="detail-facts">
          <div><span className="muted small">Affected customers</span><strong>{incident.affectedCount}</strong></div>
          <div><span className="muted small">Location</span><strong>{site?.name}</strong></div>
          {incident.criticalFacilities.length > 0 && <div><span className="muted small">Critical facility</span><strong>{incident.criticalFacilities.join(', ')}</strong></div>}
        </div>
        {job.reports.length > 0 && (
          <>
            <hr className="divider" />
            <h3>Citizen reports</h3>
            <div className="stack-sm">
              {job.reports.map((r, i) => (
                <div key={i} className="report-line">
                  <div className="grow"><strong>{r.category}</strong><div className="small">{r.description}</div></div>
                  {r.photoId && <a className="photo-link" href={photoUrl(r.photoId)} target="_blank" rel="noreferrer"><img src={photoUrl(r.photoId)} alt="Citizen report" /></a>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showRouteMap && (
        <div className="card">
          <div className="row-between"><h2 style={{ margin: 0 }}>Route to site</h2><span className="badge badge-red">Affected area</span></div>
          <p className="muted small" style={{ margin: '4px 0 10px' }}>{site.address}. The dashed line is your route; the red area shows where customers are without power.</p>
          <AffectedAreaMap site={site} affectedArea={affectedArea} technician={technicianLocation} />
          <div className="row" style={{ marginTop: 12 }}>
            <button type="button" className="btn grow" disabled={!canTravel || actions.busy} onClick={navigateNow}>
              <Icon name="navigate" size={18} /> {incident.status === 'en_route' ? 'Open navigation' : 'Navigate'}
            </button>
            <button type="button" className="btn btn-outline grow" disabled={!canTravel || actions.busy} onClick={actions.start}>Start Job</button>
          </div>
          {incident.status === 'en_route' && <p className="small" style={{ marginBottom: 0, marginTop: 8 }}>The customer can see you are on your way{incident.etaMinutes ? ` (ETA ~${incident.etaMinutes} min)` : ''}. Tap Start Job when you arrive.</p>}
        </div>
      )}

      {inProgress && (
        <div className="card card-accent">
          <div className="row-between"><h2 style={{ margin: 0 }}>{incident.status === 'paused' ? 'Job paused' : 'Job in progress'}</h2><StatusBadge status={incident.status} /></div>
          {incident.status === 'paused' && incident.pausedReason && <p className="muted">Reason: {incident.pausedReason}</p>}
          <div className="row" style={{ marginTop: 12 }}>
            {incident.status === 'paused' ? (
              <button type="button" className="btn grow" disabled={actions.busy} onClick={actions.resume}>Resume job</button>
            ) : (
              <button type="button" className="btn btn-warn grow" disabled={actions.busy} onClick={() => setPausing(true)}>Pause job</button>
            )}
            <button type="button" className="btn grow" disabled={actions.busy} onClick={() => navigate(`/technician/tasks/${job.id}/close`)}>Complete job</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Timeline</h2>
        <ul className="timeline">
          {[...incident.timeline].reverse().map((e, i) => (
            <li key={i}><span className="muted small">{formatTime(e.ts)}</span> {e.message}</li>
          ))}
        </ul>
      </div>

      {declining && (
        <DeclineJobModal busy={actions.busy} onClose={() => setDeclining(false)} onConfirm={async (reason) => {
          const ok = await actions.decline(reason);
          if (ok) navigate('/technician/dashboard');
        }} />
      )}
      {pausing && (
        <PauseJobModal busy={actions.busy} onClose={() => setPausing(false)} onConfirm={async (reason) => {
          await actions.pause(reason);
          setPausing(false);
        }} />
      )}
    </div>
  );
}
