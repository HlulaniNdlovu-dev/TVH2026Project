import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import Banner from '../../components/Banner.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { homeForRole } from '../../features/auth/AuthContext.jsx';

const DEMO_ACCOUNTS = [
  { role: 'Citizen', name: 'Thandi Mokoena', phone: '082 123 4567', password: 'password' },
  { role: 'Technician', name: 'Thabo Maseko', phone: '071 111 1111', password: 'password' },
  { role: 'Admin', name: 'Palesa Ndlovu', phone: '070 000 0000', password: 'admin' },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!phone.trim() || !password) return setError('Enter your phone number and password.');
    setBusy(true);
    try {
      const signedIn = await login(phone, password);
      navigate(homeForRole(signedIn.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" aria-label="PowerLink home"><Logo size={40} /></Link>
        <h1>Welcome back</h1>
        <p className="muted">Log in with your phone number.</p>

        {params.get('expired') && <Banner tone="warn">Your session ended (the demo may have been reset). Please log in again.</Banner>}
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
          <button className="btn btn-block btn-lg" type="submit" disabled={busy}>{busy ? 'Logging in...' : 'Log in'}</button>
        </form>

        <p className="center small" style={{ marginTop: 16 }}>
          New to PowerLink? <Link to="/register">Create an account</Link>
        </p>

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
