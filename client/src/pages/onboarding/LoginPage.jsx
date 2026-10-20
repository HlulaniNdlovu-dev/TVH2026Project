import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell, { AuthField, AuthPasswordField } from './AuthShell.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import ServerWakeBanner from '../../features/server/ServerWakeBanner.jsx';
import { useServerStatus } from '../../features/server/serverStatus.js';

// Existing demo accounts (unchanged credentials). The backend is phone-only.
const DEMO_ACCOUNTS = [
  { role: 'Citizen', name: 'Thandi Mokoena', phone: '082 123 4567', password: 'password' },
  { role: 'Technician', name: 'Thabo Maseko', phone: '071 111 1111', password: 'password' },
  { role: 'Admin', name: 'Palesa Ndlovu', phone: '070 000 0000', password: 'admin' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const awake = useServerStatus() === 'awake';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!phone.trim() || !password) return setError('Enter your phone number and password.');
    setBusy(true);
    try {
      // Opens the user's own pages; the user id in the address is all the app needs from then on.
      await login(phone, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <AuthShell mode="login">
      <section id="login">
        <h1 className="serif">Welcome back</h1>
        <p className="sub">Log in with your phone number.</p>

        <ServerWakeBanner />
        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit} noValidate>
          <AuthField
            id="phone"
            label="Phone number"
            icon="user"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="082 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <AuthPasswordField
            id="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="go" type="submit" disabled={busy || !awake}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
          <p className="alt">
            New to PowerLink? <Link to="/register">Create an account</Link>
          </p>
        </form>

        <Link to="/simulator" className="go go-out" target="_blank" rel="noreferrer">
          Open the sensor simulator
        </Link>

        <details className="demo">
          <summary>Demo accounts</summary>
          <div>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.role}
                type="button"
                onClick={() => {
                  setPhone(a.phone);
                  setPassword(a.password);
                }}
              >
                <b>{a.role}</b>, {a.name}
                <small>{a.phone} / {a.password}</small>
              </button>
            ))}
          </div>
        </details>
      </section>
    </AuthShell>
  );
}
