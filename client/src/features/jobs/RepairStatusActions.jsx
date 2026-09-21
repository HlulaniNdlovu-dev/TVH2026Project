import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobActions } from './useJobActions.js';
import PauseJobModal from './PauseJobModal.jsx';
import { StatusBadge } from '../incidents/StatusBadge.jsx';

// "Update repair status": a shortcut for the current job. It only offers the steps that make sense right now.
export default function RepairStatusActions({ job, onChange }) {
  const navigate = useNavigate();
  const actions = useJobActions(job.id, onChange);
  const [pausing, setPausing] = useState(false);

  const complete = () => navigate(`/technician/tasks/${job.id}/close`);
  const { status, state } = job;
  let buttons;

  if (state === 'pending') {
    buttons = <p className="muted" style={{ margin: 0 }}>Accept the job first (see the task above).</p>;
  } else if (status === 'dispatched') {
    buttons = (
      <>
        <button type="button" className="btn" disabled={actions.busy} onClick={actions.travel}>Start travelling</button>
        <button type="button" className="btn btn-outline" disabled={actions.busy} onClick={actions.start}>Start job</button>
      </>
    );
  } else if (status === 'en_route') {
    buttons = <button type="button" className="btn" disabled={actions.busy} onClick={actions.start}>Arrived: start job</button>;
  } else if (status === 'working' || status === 'arrived') {
    buttons = (
      <>
        <button type="button" className="btn btn-warn" disabled={actions.busy} onClick={() => setPausing(true)}>Pause job</button>
        <button type="button" className="btn" disabled={actions.busy} onClick={complete}>Mark completed</button>
      </>
    );
  } else if (status === 'paused') {
    buttons = (
      <>
        <button type="button" className="btn" disabled={actions.busy} onClick={actions.resume}>Resume job</button>
        <button type="button" className="btn btn-outline" disabled={actions.busy} onClick={complete}>Mark completed</button>
      </>
    );
  } else {
    buttons = <p className="muted" style={{ margin: 0 }}>No status update available.</p>;
  }

  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>Update repair status</h2>
        <StatusBadge status={status} />
      </div>
      {status === 'paused' && job.pausedReason && <p className="small muted">Paused: {job.pausedReason}</p>}
      <div className="row status-actions">{buttons}</div>
      {pausing && (
        <PauseJobModal
          busy={actions.busy}
          onClose={() => setPausing(false)}
          onConfirm={async (reason) => {
            await actions.pause(reason);
            setPausing(false);
          }}
        />
      )}
    </div>
  );
}
