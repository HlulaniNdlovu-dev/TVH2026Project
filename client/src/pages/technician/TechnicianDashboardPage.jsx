import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import * as jobService from '../../services/jobService.js';
import { useJobActions } from '../../features/jobs/useJobActions.js';
import TaskCard from '../../features/jobs/TaskCard.jsx';
import RepairStatusActions from '../../features/jobs/RepairStatusActions.jsx';
import DeclineJobModal from '../../features/jobs/DeclineJobModal.jsx';
import Switch from '../../components/Switch.jsx';
import StatCard, { pct } from '../../components/StatCard.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import Icon from '../../components/Icon.jsx';
import { useToast } from '../../components/Toast.jsx';
import { formatDateTime, formatDuration } from '../../utils/format.js';

// Shown instead of an empty "No assigned tasks" page.
function StandingBy({ duty, lastJob, onGoAvailable }) {
  const available = duty === 'available';
  return (
    <div className="card standby">
      <div className={`standby-pulse ${available ? '' : 'off'}`}><Icon name={available ? 'bolt' : 'power'} size={28} /></div>
      <h2>{available ? 'Standing by for the next job' : 'You are set to unavailable'}</h2>
      <p className="muted">
        {available
          ? 'New outages near you will appear here the moment they are assigned. Keep this screen open.'
          : 'You will not be offered new jobs until you switch back to available.'}
      </p>
      {!available && <button type="button" className="btn" onClick={onGoAvailable}>Go available</button>}
      {lastJob && (
        <div className="standby-last">
          <span className="muted small">Last completed job</span>
          <strong>{lastJob.category} · {lastJob.area}</strong>
          <span className="muted small">{lastJob.incidentId} · {formatDateTime(lastJob.closedAt ?? lastJob.resolvedAt)}</span>
        </div>
      )}
    </div>
  );
}

export default function TechnicianDashboardPage() {
  const toast = useToast();
  const { data, error, loading, refresh, setData } = usePolling(jobService.getMyJobs, 3000, [], 'technician:jobs');
  const [declining, setDeclining] = useState(null);
  const current = data?.current;
  const actions = useJobActions(current?.id, refresh);

  if (loading && !data) return <Spinner label="Loading your tasks..." />;
  if (!data) return <Banner tone="error">{error?.message ?? 'Could not load your tasks.'}</Banner>;

  const available = data.duty === 'available';
  const changeDuty = async (isAvailable) => {
    const dutyStatus = isAvailable ? 'available' : 'unavailable';
    setData((d) => ({ ...d, duty: dutyStatus }));
    try {
      await jobService.setDuty(dutyStatus);
      toast(isAvailable ? 'You are available for jobs' : 'You are unavailable');
    } catch (err) {
      toast(err.message, 'error');
    }
    refresh();
  };

  const acceptJob = async (job) => {
    await jobService.acceptJob(job.id).catch((err) => toast(err.message, 'error'));
    refresh();
  };
  const declineJob = async (reason) => {
    await jobService.declineJob(declining.id, reason).then(() => toast('Job declined. It will be offered to someone else.')).catch((err) => toast(err.message, 'error'));
    setDeclining(null);
    refresh();
  };

  const { stats } = data;
  return (
    <div className="stack">
      <div className="page-title">
        <h1>Hi, {data.technician.name.split(' ')[0]}</h1>
        <p>Your work for today.</p>
      </div>
      {error && <Banner tone="warn">Trying to reconnect to the server...</Banner>}

      <div className={`card duty-card ${available ? 'on' : ''}`}>
        <div className="grow">
          <div className="muted small">Duty status</div>
          <h2 style={{ margin: 0 }}>{available ? 'Available' : 'Unavailable'}</h2>
        </div>
        <Switch label="Available for jobs" checked={available} onChange={changeDuty} />
      </div>

      <div className="stat-grid stat-grid-half">
        <StatCard label="Jobs today" value={stats.jobsToday} progress={pct(stats.jobsToday, Math.max(5, stats.jobsToday))} hint="bar: 5 jobs" />
        <StatCard label="Avg completion time" value={stats.avgCompletionMinutes != null ? formatDuration(stats.avgCompletionMinutes) : '-'} progress={pct(stats.avgCompletionMinutes, 120)} tone="blue" hint="bar: 2 h" />
        <StatCard label="Jobs completed" value={stats.jobsCompleted} progress={pct(stats.jobsCompleted, Math.max(10, stats.jobsCompleted))} hint="bar: 10 jobs" />
      </div>

      <section className="stack">
        <h2>Current task</h2>
        {current ? (
          <TaskCard job={current} highlight onAccept={acceptJob} onDecline={setDeclining} busy={actions.busy} />
        ) : (
          <StandingBy duty={data.duty} lastJob={data.history.find((j) => j.state === 'closed')} onGoAvailable={() => changeDuty(true)} />
        )}
      </section>

      {current && <RepairStatusActions job={current} onChange={refresh} />}

      {data.queue.length > 0 && (
        <section className="stack">
          <h2>Up next ({data.queue.length})</h2>
          {data.queue.map((job) => <TaskCard key={job.id} job={job} onAccept={acceptJob} onDecline={setDeclining} />)}
        </section>
      )}

      {data.history.length > 0 && <Link className="btn btn-outline" to="/technician/history">View completed jobs</Link>}
      {declining && <DeclineJobModal onClose={() => setDeclining(null)} onConfirm={declineJob} />}
    </div>
  );
}
