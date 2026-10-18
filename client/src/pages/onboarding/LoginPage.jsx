import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import Banner from '../../components/Banner.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import ServerWakeBanner from '../../features/server/ServerWakeBanner.jsx';
import { useServerStatus } from '../../features/server/serverStatus.js';

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
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="back-link">&larr; Back to home</Link>
        <Link to="/" aria-label="PowerLink home"><Logo size={40} /></Link>
        <h1>Welcome back</h1>
        <p className="muted">Log in with your phone number.</p>

        <ServerWakeBanner />
        {error && <Banner tone="error">{error}</Banner>}

        <form onSubmit={submit} noValidate style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="082 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn btn-block btn-lg" type="submit" disabled={busy || !awake}>{busy ? 'Logging in...' : 'Log in'}</button>
        </form>

        <p className="center small" style={{ marginTop: 16 }}>
          New to PowerLink? <Link to="/register">Create an account</Link>
        </p>
        <Link to="/simulator" className="btn btn-outline btn-block" target="_blank" rel="noreferrer">Open the sensor simulator</Link>

        <details className="demo-accounts">
          <summary>Demo accounts</summary>
          <div className="stack-sm" style={{ marginTop: 10 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.role} type="button" className="option" onClick={() => { setPhone(a.phone); setPassword(a.password); }}>
                <strong>{a.role}</strong> · {a.name}
                <div className="muted small">{a.phone} / {a.password}</div>
              </button>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
}
