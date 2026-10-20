import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell, { AuthField, AuthPasswordField } from './AuthShell.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { homeForRole } from '../../features/auth/AuthContext.jsx';

// Existing demo accounts (unchanged credentials). The backend is phone-only.
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
    <AuthShell mode="login">
      <section id="login">
        <h1 className="serif">Welcome back</h1>
        <p className="sub">Log in with your phone number.</p>

        {params.get('expired') && (
          <div className="banner banner-warn" role="status">
            Your session ended (the demo may have been reset). Please log in again.
          </div>
        )}
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
          <button className="go" type="submit" disabled={busy}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
          <p className="alt">
            New to PowerLink? <Link to="/register">Create an account</Link>
          </p>
        </form>

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
