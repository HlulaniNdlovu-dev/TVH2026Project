import { usePolling } from '../../hooks/usePolling.js';
import * as jobService from '../../services/jobService.js';
import { StatusBadge } from '../../features/incidents/StatusBadge.jsx';
import Banner from '../../components/Banner.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatDateTime } from '../../utils/format.js';

function HistoryJob({ job }) {
  const cancelled = job.state === 'cancelled';
  return (
    <details className="card card-flat history-job">
      <summary>
        <div className="grow">
          <strong>{job.category}</strong>
          <div className="muted small">{job.incidentId} · {job.area} · {formatDateTime(job.closedAt ?? job.resolvedAt ?? job.offeredAt)}</div>
        </div>
        {cancelled ? <span className="badge badge-amber">Cancelled</span> : <StatusBadge status="resolved" />}
      </summary>
      <div className="history-body">
        {cancelled ? (
          <p className="small">{job.cancelReason ?? 'This job was cancelled.'}</p>
        ) : (
          <>
            <div><span className="muted small">Cause of fault</span><div>{job.faultCause ?? '-'}</div></div>
            <div><span className="muted small">Parts used</span><div>{job.partsUsed || 'None recorded'}</div></div>
            {job.notes && <div><span className="muted small">Notes</span><div>{job.notes}</div></div>}
          </>
        )}
        <div className="muted small">{job.affectedCount} customer(s) affected</div>
      </div>
    </details>
  );
}

export default function TaskHistoryPage() {
  const { data, error, loading } = usePolling(jobService.getMyJobs, 8000);
  if (loading && !data) return <Spinner />;
  if (!data) return <Banner tone="error">{error?.message ?? 'Could not load your history.'}</Banner>;

  return (
    <div className="stack">
      <div className="page-title"><h1>Completed tasks</h1><p>{data.stats.jobsCompleted} jobs completed in total.</p></div>
      {data.history.length ? (
        <div className="stack-sm">{data.history.map((job) => <HistoryJob key={job.id} job={job} />)}</div>
      ) : (
        <EmptyState title="No completed jobs yet">Jobs you finish will be listed here.</EmptyState>
      )}
    </div>
  );
}
