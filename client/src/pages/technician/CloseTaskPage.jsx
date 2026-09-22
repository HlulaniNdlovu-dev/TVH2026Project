import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import * as jobService from '../../services/jobService.js';
import PhotoPicker from '../../components/PhotoPicker.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useToast } from '../../components/Toast.jsx';

const CAUSE_SUGGESTIONS = ['Blown fuse', 'Cable fault', 'Transformer failure', 'Vandalism / theft', 'Overload', 'Tree / weather damage'];

export default function CloseTaskPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: job, loading } = usePolling(() => jobService.getJob(jobId), 5000, [jobId], `technician:task:${jobId}`);

  const [workDone, setWorkDone] = useState(false);
  const [partsUsed, setPartsUsed] = useState('');
  const [faultCause, setFaultCause] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading && !job) return <Spinner />;
  if (!job) return <Banner tone="error">Could not load this task.</Banner>;

  const status = job.incident.status;
  if (job.state !== 'accepted' || !['arrived', 'working', 'paused'].includes(status)) {
    return (
      <div className="stack">
        <Banner tone="warn">
          {job.state === 'closed' ? 'This job is already closed.' : job.state === 'cancelled' ? 'This job was cancelled.' : 'Start the job before you close it.'}
        </Banner>
        <Link className="btn" to={`/technician/tasks/${jobId}`}>Back to task</Link>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!workDone) found.workDone = 'Tick the box to confirm the work is done';
    if (!faultCause.trim()) found.faultCause = 'Describe what caused the fault';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await jobService.closeJob(jobId, { workDone, partsUsed, faultCause, notes, photos });
      toast('Job closed. Power restoration has been requested.');
      navigate('/technician/dashboard', { replace: true });
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="stack">
      <Link to={`/technician/tasks/${jobId}`} className="back-link">← Back to task</Link>
      <div className="page-title">
        <h1>Close task</h1>
        <p>{job.incident.id} · {job.incident.category} · {job.incident.area}</p>
      </div>
      {formError && <Banner tone="error">{formError}</Banner>}

      <div className="card">
        <label className="check-row">
          <input type="checkbox" checked={workDone} onChange={(e) => setWorkDone(e.target.checked)} />
          <span><strong>The work is done</strong><br /><span className="muted small">Power has been restored and the site is safe.</span></span>
        </label>
        {errors.workDone && <span className="error small">{errors.workDone}</span>}
      </div>

      <div className="card">
        <div className="field">
          <label htmlFor="parts">Parts used</label>
          <textarea id="parts" placeholder="e.g. 2 x 60A fuses, 10 m service cable" value={partsUsed} onChange={(e) => setPartsUsed(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="cause">Cause of the fault</label>
          <div className="chip-row">
            {CAUSE_SUGGESTIONS.map((c) => <button type="button" key={c} className="chip" onClick={() => setFaultCause(c)}>{c}</button>)}
          </div>
          <textarea id="cause" placeholder="What caused the outage?" value={faultCause} onChange={(e) => setFaultCause(e.target.value)} />
          {errors.faultCause && <span className="error">{errors.faultCause}</span>}
        </div>
        <div className="field">
          <label htmlFor="notes">Additional notes</label>
          <textarea id="notes" placeholder="Anything the next team should know" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <span className="label">Photos (optional)</span>
          <PhotoPicker value={photos} onChange={setPhotos} max={4} label="Add photo" />
        </div>
      </div>

      <button type="submit" className="btn btn-lg btn-block" disabled={busy}>{busy ? 'Closing job...' : 'Close task'}</button>
    </form>
  );
}
