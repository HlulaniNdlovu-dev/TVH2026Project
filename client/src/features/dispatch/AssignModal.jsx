import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import Banner from '../../components/Banner.jsx';
import * as adminService from '../../services/adminService.js';

const REASONS = ['Closest available technician', 'Matching skills for this fault', 'Balancing workload', 'Customer or critical-facility priority'];

// Manual dispatch. A reason is mandatory so the audit log explains every change.
export default function AssignModal({ incident, technicians, onClose, onAssigned }) {
  const [technicianId, setTechnicianId] = useState(technicians.find((t) => t.dutyStatus === 'available')?.id ?? technicians[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const reassigning = Boolean(incident.technician);

  const submit = async (event) => {
    event.preventDefault();
    if (!reason.trim()) return setError('Please give a reason.');
    setBusy(true);
    try {
      await adminService.assignTechnician(incident.id, technicianId, reason.trim());
      onAssigned();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title={reassigning ? `Reassign ${incident.id}` : `Assign ${incident.id}`} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {reassigning && <Banner tone="warn">Currently assigned to {incident.technician.name}. They will be released from this job.</Banner>}
        {error && <Banner tone="error">{error}</Banner>}
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="assign-tech">Technician</label>
          <select id="assign-tech" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name} · {t.dutyStatus === 'available' ? t.activity : 'Unavailable'} · {t.openJobs} open job(s)</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="assign-reason">Reason</label>
          <div className="chip-row">
            {REASONS.map((r) => <button type="button" key={r} className="chip" onClick={() => setReason(r)}>{r}</button>)}
          </div>
          <input id="assign-reason" type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why this technician?" />
        </div>
        <button type="submit" className="btn btn-block" disabled={busy || !technicianId}>{busy ? 'Assigning...' : reassigning ? 'Reassign technician' : 'Assign technician'}</button>
      </form>
    </Modal>
  );
}
