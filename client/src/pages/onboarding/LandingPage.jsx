import { Link, Navigate } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import HeroHouses from '../../components/HeroHouses.jsx';
import { useAuth } from '../../features/auth/useAuth.js';
import { homeForRole } from '../../features/auth/AuthContext.jsx';

const FEATURES = [
  { title: 'Report in seconds', text: 'Tell the City about a power problem with your meter number and location. No queues, no call centres.' },
  { title: 'Live repair progress', text: 'See when a technician is assigned, on the way, on site and when your power is back.' },
  { title: 'Smart grid sensors', text: 'Meters, transformers and substations report in automatically, so faults are found before you call.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to={homeForRole(user.role)} replace />;

  return (
    <div className="landing">
      <div className="landing-bg" aria-hidden="true" />
      <header className="landing-nav">
        <Logo size={38} />
        <div className="row">
          <Link to="/register" className="btn btn-ghost">Create account</Link>
          <Link to="/login" className="btn">Log in</Link>
        </div>
      </header>

      <main className="landing-hero">
        <div className="hero-copy">
          <h1>Power outages, <span>connected.</span></h1>
          <p className="lead">
            PowerLink joins residents, technicians and the municipality on one live platform, from the moment the lights go out until they come back on.
          </p>
          <div className="row hero-actions">
            <Link to="/login" className="btn btn-lg">Log in to PowerLink</Link>
            <Link to="/register" className="btn btn-lg btn-outline">Register your meter</Link>
          </div>
        </div>
        <HeroHouses />
      </main>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <article key={f.title} className="feature">
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </article>
        ))}
      </section>

      <footer className="landing-foot">Tshwane Varsity Hackathon 2026 · Smart Outage Management</footer>
    </div>
  );
}
