import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import Banner from '../../components/Banner.jsx';
import AddressPicker from '../../features/map/AddressPicker.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { homeForRole } from '../../features/auth/AuthContext.jsx';
import { geocodeAddress } from '../../services/geocodingService.js';

const EMPTY = { name: '', phone: '', email: '', password: '', meterNumber: '', address: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Enter your full name';
  if (!/^(\+27|0)\d{9}$/.test(form.phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid phone number, e.g. 082 123 4567';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address';
  if (form.password.length < 4) errors.password = 'Use at least 4 characters';
  if (!/^\d{8,13}$/.test(form.meterNumber.replace(/\s/g, ''))) errors.meterNumber = 'Meter numbers have 8 to 13 digits';
  if (!form.address.trim()) errors.address = 'Enter your address';
  return errors;
}

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [position, setPosition] = useState(null);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      // If the pin was not placed, try to find the address automatically.
      let point = position;
      if (!point) {
        point = await geocodeAddress(form.address).catch(() => null);
      }
      const created = await register({ ...form, lat: point?.lat, lng: point?.lng });
      navigate(homeForRole(created.role), { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <Link to="/" aria-label="PowerLink home"><Logo size={40} /></Link>
        <h1>Create your account</h1>
        <p className="muted">Register your home and meter so we can tell you about outages and repairs.</p>
        {formError && <Banner tone="error">{formError}</Banner>}

        <form onSubmit={submit} noValidate style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" type="text" autoComplete="name" value={form.name} onChange={set('name')} />
            {errors.name && <span className="error">{errors.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="phone">Phone contact</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="082 123 4567" value={form.phone} onChange={set('phone')} />
            <span className="hint">You will use this number to log in.</span>
            {errors.phone && <span className="error">{errors.phone}</span>}
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>
          <div className="field">
            <label htmlFor="meter">Meter number</label>
            <input id="meter" type="text" inputMode="numeric" placeholder="e.g. 04100000005" value={form.meterNumber} onChange={set('meterNumber')} />
            <span className="hint">Found on your prepaid meter or electricity bill.</span>
            {errors.meterNumber && <span className="error">{errors.meterNumber}</span>}
          </div>

          <AddressPicker address={form.address} onAddressChange={(address) => setForm((f) => ({ ...f, address }))} position={position} onPositionChange={setPosition} error={errors.address} />

          <button className="btn btn-block btn-lg" type="submit" disabled={busy} style={{ marginTop: 18 }}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="center small" style={{ marginTop: 16 }}>Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
