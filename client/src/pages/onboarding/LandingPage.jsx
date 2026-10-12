import { Link, Navigate } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import Icon from '../../components/Icon.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { homeForRole } from '../../features/auth/AuthContext.jsx';
import heroImage from '../../assets/hero-grid.jpg';

const HIGHLIGHTS = [
  { value: '24/7', label: 'Live grid monitoring' },
  { value: '3', label: 'Connected stakeholder roles' },
  { value: 'End-to-end', label: 'Outage lifecycle tracking' },
  { value: 'Real-time', label: 'Status updates to residents' },
];

const FEATURES = [
  { icon: 'report', title: 'Report in seconds', text: 'Residents log a power problem with their meter number and location. No queues, no call centres.' },
  { icon: 'navigate', title: 'Live repair progress', text: 'Follow every incident from technician assignment to en route, on site and power restored.' },
  { icon: 'sensor', title: 'Smart grid sensors', text: 'Meters, transformers and substations report in automatically, so faults are found before anyone calls.' },
  { icon: 'truck', title: 'Intelligent dispatch', text: 'Prioritise incidents by impact and assign the nearest available technician from one board.' },
  { icon: 'chart', title: 'Operational analytics', text: 'Track response times, recurring faults and load-shedding impact across every region.' },
  { icon: 'shield', title: 'Accountable by design', text: 'A full audit trail records every action, giving the municipality clear oversight.' },
];

const STAKEHOLDERS = [
  { icon: 'home', title: 'Residents', text: 'Report outages, check whether your power is on and receive notifications as repairs progress.', points: ['Meter-linked reporting', 'Live incident tracker', 'Instant notifications'] },
  { icon: 'wrench', title: 'Technicians', text: 'Receive jobs on the go, navigate to site and update repair status from the field.', points: ['Mobile task queue', 'Route maps to site', 'Photo close-out'] },
  { icon: 'dashboard', title: 'Municipality', text: 'See the whole grid at a glance, dispatch crews and manage load-shedding schedules.', points: ['Live grid map', 'Dispatch board', 'Analytics & audit log'] },
];

const STEPS = [
  { title: 'Detect', text: 'A resident reports a fault or a grid sensor raises an alert.' },
  { title: 'Dispatch', text: 'Operators prioritise the incident and assign a technician.' },
  { title: 'Repair', text: 'The technician travels to site and updates progress live.' },
  { title: 'Restore', text: 'Power returns and every affected resident is notified.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  return (
    <div className="landing">
      <section className="lp-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="lp-hero-overlay" aria-hidden="true" />
        <header className="lp-nav">
          <Logo size={36} light />
          <nav className="lp-nav-links" aria-label="Sections">
            <a href="#platform">Platform</a>
            <a href="#stakeholders">Who it serves</a>
            <a href="#how-it-works">How it works</a>
          </nav>
          <div className="lp-nav-actions">
            <Link to="/register" className="btn lp-btn-ghost">Create account</Link>
            <Link to="/login" className="btn lp-btn-light">Log in</Link>
          </div>
        </header>

        <div className="lp-hero-inner">
          <span className="lp-eyebrow">City of Tshwane · Smart Outage Management</span>
          <h1>Keeping the city powered, <span>together.</span></h1>
          <p className="lp-lead">
            PowerLink connects residents, field technicians and the municipality on one live platform, from the moment the lights go out until they come back on.
          </p>
          <div className="lp-hero-actions">
            <Link to="/login" className="btn btn-lg">Log in to PowerLink</Link>
            <Link to="/register" className="btn btn-lg lp-btn-outline-light">Register your meter</Link>
          </div>
        </div>
      </section>

      <section className="lp-highlights" aria-label="Platform highlights">
        {HIGHLIGHTS.map((h) => (
          <div key={h.label} className="lp-highlight">
            <strong>{h.value}</strong>
            <span>{h.label}</span>
          </div>
        ))}
      </section>

      <section id="platform" className="lp-section">
        <div className="lp-section-head">
          <span className="lp-kicker">The platform</span>
          <h2>One system for the entire outage lifecycle</h2>
          <p>Purpose-built tools that replace phone queues and spreadsheets with a single, transparent source of truth.</p>
        </div>
        <div className="lp-features">
          {FEATURES.map((f) => (
            <article key={f.title} className="lp-feature">
              <span className="lp-feature-icon"><Icon name={f.icon} size={22} /></span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="stakeholders" className="lp-section lp-section-alt">
        <div className="lp-section-head">
          <span className="lp-kicker">Who it serves</span>
          <h2>Built for everyone who keeps the lights on</h2>
        </div>
        <div className="lp-stakeholders">
          {STAKEHOLDERS.map((s) => (
            <article key={s.title} className="lp-stakeholder">
              <span className="lp-feature-icon"><Icon name={s.icon} size={22} /></span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <ul>
                {s.points.map((p) => (
                  <li key={p}><Icon name="check" size={16} />{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="lp-section">
        <div className="lp-section-head">
          <span className="lp-kicker">How it works</span>
          <h2>From fault to restored in four clear steps</h2>
        </div>
        <ol className="lp-steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="lp-step">
              <span className="lp-step-num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-cta">
        <div className="lp-cta-inner">
          <div>
            <h2>Ready to connect to PowerLink?</h2>
            <p>Register your meter today and stay informed whenever your power is affected.</p>
          </div>
          <div className="lp-hero-actions">
            <Link to="/register" className="btn btn-lg lp-btn-light">Get started</Link>
            <Link to="/login" className="btn btn-lg lp-btn-outline-light">Log in</Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <Logo size={30} light />
            <p>A connected, real-time outage management platform for the City of Tshwane.</p>
          </div>
          <div className="lp-footer-col">
            <h4>Platform</h4>
            <a href="#platform">Features</a>
            <a href="#stakeholders">Who it serves</a>
            <a href="#how-it-works">How it works</a>
          </div>
          <div className="lp-footer-col">
            <h4>Account</h4>
            <Link to="/login">Log in</Link>
            <Link to="/register">Create account</Link>
          </div>
        </div>
        <div className="lp-footer-base">
          <span>© {new Date().getFullYear()} PowerLink</span>
          <span>Tshwane Varsity Hackathon 2026 · Smart Outage Management</span>
        </div>
      </footer>
    </div>
  );
}
