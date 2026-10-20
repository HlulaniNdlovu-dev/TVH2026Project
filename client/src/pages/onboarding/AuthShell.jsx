import { useState } from 'react';
import { Link } from 'react-router-dom';
import BoltMark from '../../components/BoltMark.jsx';

// Stroke icons ported from the prototype's inline <symbol> sprite.
const PATHS = {
  user: ['c:12,8,4', 'M4 21c1-4 4-6 8-6s7 2 8 6'],
  phone: ['M7 2.5h10a2.5 2.5 0 0 1 2.5 2.5v14a2.5 2.5 0 0 1-2.5 2.5H7A2.5 2.5 0 0 1 4.5 19V5A2.5 2.5 0 0 1 7 2.5z', 'M11 18.5h2'],
  mail: ['M3 5h18a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 21 19H3a2.5 2.5 0 0 1-2.5-2.5v-9A2.5 2.5 0 0 1 3 5z', 'M3.5 7l8.5 6 8.5-6'],
  lock: ['M5 11h14a2.5 2.5 0 0 1 2.5 2.5v6A2.5 2.5 0 0 1 19 22H5a2.5 2.5 0 0 1-2.5-2.5v-6A2.5 2.5 0 0 1 5 11z', 'M8 11V8a4 4 0 0 1 8 0v3'],
  bolt: ['M13 3 5 14h6l-1 7 8-11h-6z'],
  pin: ['M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z', 'c:12,10,2.5'],
};

function AuthIcon({ name }) {
  const parts = PATHS[name] ?? [];
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {parts.map((p) =>
        p.startsWith('c:') ? (
          <circle key={p} cx={p.slice(2).split(',')[0]} cy={p.slice(2).split(',')[1]} r={p.slice(2).split(',')[2]} />
        ) : (
          <path key={p} d={p} />
        ),
      )}
    </svg>
  );
}

// Icon-led text field. Extra input props are spread onto the <input>.
export function AuthField({ id, label, icon, hint, error, ...input }) {
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <div className="in">
        <AuthIcon name={icon} />
        <input id={id} {...input} />
      </div>
      {hint && <p className="hint">{hint}</p>}
      {error && <p className="hint" style={{ color: '#d9534f' }}>{error}</p>}
    </div>
  );
}

// Password field with a Show/Hide toggle.
export function AuthPasswordField({ id, label, hint, error, ...input }) {
  const [show, setShow] = useState(false);
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      <div className="in">
        <AuthIcon name="lock" />
        <input id={id} type={show ? 'text' : 'password'} {...input} />
        <button
          type="button"
          className="show"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={show}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && <p className="hint">{hint}</p>}
      {error && <p className="hint" style={{ color: '#d9534f' }}>{error}</p>}
    </div>
  );
}

// Split-panel shell: photo panel (left on login, right on register) + form column.
export default function AuthShell({ mode, children }) {
  const register = mode === 'register';
  return (
    <div className={`pl-auth${register ? ' is-register' : ''}`}>
      <aside className="panel">
        <div className="photo">
          <div className="pin">
            <Link to="/" className="back">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
              Back to website
            </Link>
            <div className="ptw">
              {register ? (
                <div className="pt pt-r">
                  <h2 className="serif">Register your home and meter.</h2>
                  <p>So we can tell you about outages and repairs in your area, before you have to ask.</p>
                </div>
              ) : (
                <div className="pt pt-l">
                  <h2 className="serif">Know when the power is out. Know when it is coming back.</h2>
                  <p>Log in to report an outage, follow the repair stage by stage and get updates by SMS and in the app.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className="fs">
        <div className="fw">
          <div className="brand">
            <span className="lk2">
              <BoltMark size={44} />
              <b>
                Power<span>Link</span>
              </b>
            </span>
          </div>
          {children}
          <p className="foot">Prototype for the Tshwane Varsity Hackathon 2026. Demo data only.</p>
        </div>
      </main>
    </div>
  );
}