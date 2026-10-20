import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell, { AuthField, AuthPasswordField } from './AuthShell.jsx';
import AddressPicker from '../../features/map/AddressPicker.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { homeForRole } from '../../features/auth/AuthContext.jsx';
import { geocodeAddress } from '../../services/geocodingService.js';

// `confirm` is tracked for client-side feedback only and is NOT sent to the API.
const EMPTY = { name: '', phone: '', email: '', password: '', confirm: '', meterNumber: '', address: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Enter your full name';
  if (!/^(\+27|0)\d{9}$/.test(form.phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid phone number, e.g. 082 123 4567';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address';
  if (form.password.length < 4) errors.password = 'Use at least 4 characters';
  if (!form.confirm) errors.confirm = 'Re-enter your password';
  else if (form.confirm !== form.password) errors.confirm = 'Passwords do not match';
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

  // Live confirm-password feedback (mirrors the prototype's match hint).
  const confirmHint = () => {
    if (!form.confirm) return null;
    return form.confirm === form.password ? 'Passwords match' : 'Passwords do not match';
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      let point = position;
      if (!point) point = await geocodeAddress(form.address).catch(() => null);
      // Send only the fields the API accepts; `confirm` is excluded.
      const { confirm, ...payload } = form;
      const created = await register({ ...payload, lat: point?.lat, lng: point?.lng });
      navigate(homeForRole(created.role), { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell mode="register">
      <section id="register">
        <h1 className="serif">Create your account</h1>
        <p className="sub">Register your home and meter so we can tell you about outages and repairs.</p>

        {formError && (
          <div className="banner banner-error" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <div className="r2">
            <AuthField
              id="name"
              label="Full name"
              icon="user"
              type="text"
              autoComplete="name"
              placeholder="Your full name"
              value={form.name}
              onChange={set('name')}
              error={errors.name}
            />
            <AuthField
              id="phone"
              label="Phone contact"
              icon="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="082 123 4567"
              value={form.phone}
              onChange={set('phone')}
              error={errors.phone}
            />
          </div>

          <AuthField
            id="email"
            label="Email"
            icon="mail"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />

          <div className="r2">
            <AuthPasswordField
              id="password"
              label="Password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={form.password}
              onChange={set('password')}
              error={errors.password}
            />
            <AuthPasswordField
              id="confirm"
              label="Confirm password"
              autoComplete="new-password"
              placeholder="Re-enter it"
              value={form.confirm}
              onChange={set('confirm')}
              hint={confirmHint()}
              error={errors.confirm}
            />
          </div>

          <AuthField
            id="meter"
            label="Meter number"
            icon="bolt"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 04100000005"
            hint="Found on your prepaid meter or electricity bill."
            value={form.meterNumber}
            onChange={set('meterNumber')}
            error={errors.meterNumber}
          />

          <AddressPicker
            address={form.address}
            onAddressChange={(address) => setForm((f) => ({ ...f, address }))}
            position={position}
            onPositionChange={setPosition}
            error={errors.address}
          />

          <button className="go" type="submit" disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
          <p className="alt">
            Already registered? <Link to="/login">Log in</Link>
          </p>
        </form>
      </section>
    </AuthShell>
  );
}
