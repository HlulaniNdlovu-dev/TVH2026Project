import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { useMeta } from '../meta/MetaContext.jsx';

// The standard delay codes. The customer sees the reason in their notification.
export default function PauseJobModal({ onClose, onConfirm, busy }) {
  const meta = useMeta();
  const [choice, setChoice] = useState('');

  return (
    <Modal title="Why are you pausing?" onClose={onClose}>
      <p className="muted">Choose the reason. The customer will be told the repair is paused.</p>
      <div className="option-list">
        {meta.pauseReasons.map((r) => (
          <button key={r.value} type="button" className={`option ${choice === r.value ? 'selected' : ''}`} onClick={() => setChoice(r.value)}>{r.label}</button>
        ))}
      </div>
      <button type="button" className="btn btn-block" disabled={!choice || busy} onClick={() => onConfirm(choice)}>
        {busy ? 'Pausing...' : 'Pause job'}
      </button>
    </Modal>
  );
}
