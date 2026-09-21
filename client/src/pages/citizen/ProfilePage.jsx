import { useState } from 'react';
import { useAuth } from '../../features/auth/useAuth.js';
import * as citizenService from '../../services/citizenService.js';
import AddressPicker from '../../features/map/AddressPicker.jsx';
import Modal from '../../components/Modal.jsx';
import Switch from '../../components/Switch.jsx';
import Banner from '../../components/Banner.jsx';
import { useToast } from '../../components/Toast.jsx';

function AddMeterModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ meterNumber: '', label: '', address: '' });
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!/^\d{8,13}$/.test(form.meterNumber.replace(/\s/g, ''))) return setError('Meter numbers have 8 to 13 digits');
    if (!form.address.trim()) return setError('Enter the address of this property');
    setBusy(true);
    try {
      onAdded(await citizenService.addMeter({ ...form, lat: position?.lat, lng: position?.lng }));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <Modal title="Add a meter" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {error && <Banner tone="error">{error}</Banner>}
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="new-meter">Meter number</label>
          <input id="new-meter" type="text" inputMode="numeric" value={form.meterNumber} onChange={(e) => setForm({ ...form, meterNumber: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="new-label">Name (optional)</label>
          <input id="new-label" type="text" placeholder="e.g. Rental property" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </div>
        <AddressPicker address={form.address} onAddressChange={(address) => setForm({ ...form, address })} position={position} onPositionChange={setPosition} />
        <button type="submit" className="btn btn-block" disabled={busy} style={{ marginTop: 16 }}>{busy ? 'Adding...' : 'Add meter'}</button>
      </form>
    </Modal>
  );
}

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: user.name, phone: user.phone, email: user.email, address: user.address });
  const [prefs, setPrefs] = useState(user.prefs ?? { inApp: true, sms: true });
  const [medical, setMedical] = useState(Boolean(user.medical));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      refreshUser(await citizenService.updateProfile({ ...form, prefs, medical }));
      toast('Profile saved');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeMeter = async (meterNumber) => {
    if (!window.confirm(`Remove meter ${meterNumber} from your account?`)) return;
    try {
      refreshUser(await citizenService.removeMeter(meterNumber));
      toast('Meter removed');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="stack">
      <div className="page-title"><h1>Profile</h1><p>Your details and how we contact you.</p></div>

      <form onSubmit={save} className="stack" noValidate>
        {error && <Banner tone="error">{error}</Banner>}
        <div className="card">
          <h2>Contact details</h2>
          <div className="field"><label htmlFor="p-name">Full name</label><input id="p-name" type="text" value={form.name} onChange={set('name')} /></div>
          <div className="field"><label htmlFor="p-phone">Phone contact</label><input id="p-phone" type="tel" value={form.phone} onChange={set('phone')} /></div>
          <div className="field"><label htmlFor="p-email">Email</label><input id="p-email" type="email" value={form.email} onChange={set('email')} /></div>
          <div className="field" style={{ marginBottom: 0 }}><label htmlFor="p-address">Address</label><input id="p-address" type="text" value={form.address} onChange={set('address')} /></div>
        </div>

        <div className="card">
          <h2>Notification preferences</h2>
          <div className="pref-row">
            <div><strong>In-app notifications</strong><div className="muted small">Updates on your incidents inside PowerLink.</div></div>
            <Switch label="In-app notifications" checked={prefs.inApp} onChange={(inApp) => setPrefs({ ...prefs, inApp })} />
          </div>
          <div className="pref-row">
            <div><strong>SMS alerts</strong><div className="muted small">A text message at {form.phone}.</div></div>
            <Switch label="SMS alerts" checked={prefs.sms} onChange={(sms) => setPrefs({ ...prefs, sms })} />
          </div>
          <div className="pref-row">
            <div><strong>Medical dependency</strong><div className="muted small">Someone at home relies on electricity for medical equipment. Outages get a higher priority.</div></div>
            <Switch label="Medical dependency" checked={medical} onChange={setMedical} />
          </div>
        </div>

        <button type="submit" className="btn btn-block" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button>
      </form>

      <div className="card">
        <div className="row-between"><h2 style={{ margin: 0 }}>My meters</h2><button type="button" className="btn btn-outline btn-sm" onClick={() => setAdding(true)}>Add meter</button></div>
        <div className="stack-sm" style={{ marginTop: 12 }}>
          {user.meters.map((m) => (
            <div key={m.meterNumber} className="meter-option">
              <div className="grow">
                <strong>{m.label}</strong> <span className="mono muted">{m.meterNumber}</span>
                <div className="muted small">{m.address}</div>
              </div>
              {user.meters.length > 1 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeMeter(m.meterNumber)}>Remove</button>}
            </div>
          ))}
        </div>
      </div>

      <button type="button" className="btn btn-outline btn-block" onClick={logout}>Log out</button>
      {adding && <AddMeterModal onClose={() => setAdding(false)} onAdded={(updated) => { refreshUser(updated); setAdding(false); toast('Meter added'); }} />}
    </div>
  );
}
