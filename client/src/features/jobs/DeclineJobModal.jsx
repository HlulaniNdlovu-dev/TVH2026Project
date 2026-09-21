import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { useMeta } from '../meta/MetaContext.jsx';

const OTHER = '__other__';

// Declining needs a reason: pick a suggested one or write your own.
export default function DeclineJobModal({ onClose, onConfirm, busy }) {
  const meta = useMeta();
  const [choice, setChoice] = useState('');
  const [custom, setCustom] = useState('');

  const reason = choice === OTHER ? custom.trim() : meta.declineReasons.find((r) => r.value === choice)?.label ?? '';

  return (
    <Modal title="Decline this job?" onClose={onClose}>
      <p className="muted">Tell the dispatcher why, so the job can go to someone else.</p>
      <div className="option-list">
        {meta.declineReasons.map((r) => (
          <button key={r.value} type="button" className={`option ${choice === r.value ? 'selected' : ''}`} onClick={() => setChoice(r.value)}>{r.label}</button>
        ))}
        <button type="button" className={`option ${choice === OTHER ? 'selected' : ''}`} onClick={() => setChoice(OTHER)}>Other reason...</button>
      </div>
      {choice === OTHER && (
        <div className="field">
          <label htmlFor="decline-other">Your reason</label>
          <textarea id="decline-other" autoFocus value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Explain why you cannot take this job" />
        </div>
      )}
      <button type="button" className="btn btn-danger btn-block" disabled={!reason || busy} onClick={() => onConfirm(reason)}>
        {busy ? 'Declining...' : 'Decline job'}
      </button>
    </Modal>
  );
}
