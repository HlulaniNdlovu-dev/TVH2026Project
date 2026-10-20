import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BoltMark from '../../components/BoltMark.jsx';

const FEATURES = [
  {
    title: 'Report and detect',
    text: 'Residents report with a meter number, category and photo, while sensors raise alerts on their own.',
    visual: (
      <>
        <div className="mc">
          <b>Report an outage</b>
          <div className="fl">No power at all</div>
          <div className="fl">Home, 04100000002</div>
          <span className="btnm">Log report</span>
        </div>
        <div className="mc">
          <div className="mr">
            <span>Sensor signal</span>
            <span className="ch rd">Supply lost</span>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Verify and prioritise',
    text: 'Nearby reports are grouped into one incident and ranked by danger, customers affected and medical need.',
    visual: (
      <>
        <div className="mc">
          <div className="mr">
            <span>INC-1051 Mamelodi</span>
            <span className="ch rd">High</span>
          </div>
          <div className="mr">
            <span>INC-1049 Eersterust</span>
            <span className="ch a">Medium</span>
          </div>
          <div className="mr">
            <span>INC-1043 Nellmapius</span>
            <span className="ch g">Low</span>
          </div>
        </div>
        <div className="mc">
          <div className="mr">
            <span>Reports grouped</span>
            <b>3 into 1</b>
          </div>
        </div>
      </>
    ),
  },
  {
    title: 'Dispatch and assign',
    text: 'Jobs go to the best match by skill, distance, workload and duty status, with every change recorded.',
    visual: (
      <>
        <div className="mc">
          <div className="mr">
            <span>
              <i className="av">T</i>PL-101
            </span>
            <span className="ch g">Available</span>
          </div>
          <div className="mr">
            <span>
              <i className="av">N</i>PL-102
            </span>
            <span className="ch b">En route</span>
          </div>
          <div className="mr">
            <span>
              <i className="av">P</i>PL-103
            </span>
            <span className="ch a">On site</span>
          </div>
        </div>
        <div className="mc">
          <div className="mr">
            <span>Best match</span>
            <b>PL-101, 2.1 km</b>
          </div>
        </div>
      </>
    ),
  },
];

const SIGNALS = [
  { c: '#c93c37', label: 'Network outage', see: 'Meters and transformer lose supply together.', action: 'Dispatch a matched technician.' },
  { c: '#e0a02b', label: 'Tripped breaker', see: 'Supply reaches the meter, but the home is dark.', action: 'Guide the resident first, escalate if it persists.' },
  { c: '#2f6fb0', label: 'Loadshedding', see: 'The outage starts inside a published slot.', action: 'No dispatch, unless power stays off after the slot.' },
  { c: '#7a8a82', label: 'Brief flicker', see: 'Supply drops for seconds and returns.', action: 'Log it. No dispatch.' },
];

const STATS = [
  { n: '60', l: 'Sensors monitored' },
  { n: '3', l: 'Areas in the pilot' },
  { n: '7', l: 'Job stages tracked end to end' },
  { n: '3', l: 'Connected roles' },
];

const TABS = [
  {
    id: 'res',
    label: 'Residents',
    heading: 'Know what is happening with your power.',
    copy: 'Tell the City what is wrong and see every step until your power is back.',
    points: ['Add a photo and share your location', 'See each stage and when to expect the technician', 'Medical needs get a higher priority'],
    visual: (
      <>
        <div className="mc">
          <div className="mr">
            <span><b>Home</b></span>
            <span className="ch g">Power on</span>
          </div>
          <div className="mr">
            <span>Meter 04100000002</span>
            <em>1.06 kW live</em>
          </div>
          <div className="mr">
            <span>Area status, Mamelodi</span>
            <span className="ch a">1 outage nearby</span>
          </div>
        </div>
        <div className="mc">
          <div className="mr">
            <span><b>INC-1051</b></span>
            <span className="ch b">Verified</span>
          </div>
          <div className="mr">
            <span>Next: dispatch</span>
            <em>ETA shared</em>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'tech',
    label: 'Technicians',
    heading: 'The right job, in the field, first time.',
    copy: 'Technicians receive jobs matched to their skills and update progress as they work.',
    points: ['See your assigned jobs and set your duty status', 'Update the job from en route to resolved', 'Log work done, delays and reasons'],
    visual: (
      <>
        <div className="mc">
          <div className="mr">
            <span><b>INC-1051, Mamelodi</b></span>
            <span className="ch rd">High</span>
          </div>
          <div className="mr">
            <span>Transformer fault</span>
            <em>Assigned to you</em>
          </div>
          <span className="btnm">Start journey</span>
        </div>
        <div className="mc">
          <div className="mr">
            <span><i className="dt on" />Available</span>
            <em>Duty status</em>
          </div>
        </div>
      </>
    ),
  },
  {
    id: 'ops',
    label: 'City operations',
    heading: 'The whole grid in one view.',
    copy: 'Operations see every incident, step in on dispatch when needed, and learn from the data.',
    points: ['Live grid map, incidents and dispatch board', 'Take over any job, and each edit is logged', 'Spot recurring problems early'],
    visual: (
      <>
        <div className="mc">
          <div className="mr">
            <span>Active outages</span>
            <b>1</b>
          </div>
          <div className="mr">
            <span>Customers without power</span>
            <b>6</b>
          </div>
          <div className="mr">
            <span>Technicians available</span>
            <b>3</b>
          </div>
          <div className="mr">
            <span>Sensors offline</span>
            <b>0</b>
          </div>
        </div>
        <div className="mc">
          <div className="mr">
            <span>Mamelodi Transformer 2</span>
            <span className="ch a">Recurring</span>
          </div>
        </div>
      </>
    ),
  },
];

const SECTIONS = ['features', 'signals', 'roles'];

export default function LandingPage() {
  const [active, setActive] = useState('features');
  const [tab, setTab] = useState('res');
  const [scrolled, setScrolled] = useState(false);

  // Scrollspy + sticky-nav shadow. Passive listener, cleaned up on unmount.
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
      const line = window.innerHeight * 0.4;
      let current = '';
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      if (current) setActive(current);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const onTabKey = (e, index) => {
    let next = null;
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next !== null) {
      e.preventDefault();
      setTab(TABS[next].id);
      document.getElementById(`tab-${TABS[next].id}`)?.focus();
    }
  };

  return (
    <div className="pl-landing">
      <header className={`hx-nav${scrolled ? ' up' : ''}`}>
        <Link to="/" className="hx-logo">
          <BoltMark size={34} />
          <b>
            Power<span>Link</span>
          </b>
        </Link>
        <nav className="hx-links" aria-label="Sections">
          <a href="#features" data-spy="features" className={active === 'features' ? 'on' : ''}>Platform</a>
          <a href="#signals" data-spy="signals" className={active === 'signals' ? 'on' : ''}>Why PowerLink</a>
          <a href="#roles" data-spy="roles" className={active === 'roles' ? 'on' : ''}>Who it is for</a>
        </nav>
        <div className="hx-acts">
          <Link to="/register" className="hx-link">Create account</Link>
          <Link to="/login" className="hx-dark">Log in</Link>
        </div>
      </header>

      <section className="hx">
        <div className="wrap">
          <div className="hx-grid">
            <div className="hx-copy">
              <span className="hx-pill">
                <i />
                PowerLink Operations
              </span>
              <h1>
                Know when the power is out. Know when it is <em>coming back.</em>
              </h1>
              <ul>
                <li>No queues and no call centres</li>
                <li>Faults found before you call</li>
                <li>Clear updates at every step</li>
              </ul>
              <div className="hx-cta">
                <Link to="/citizen/report" className="hx-dark big">Report an outage</Link>
                <Link to="/register" className="hx-tl">Register your meter</Link>
              </div>
            </div>
            <div className="hx-dev">
              <div className="hx-screen" role="img" aria-label="Transmission towers at sunset" />
              <div className="hx-float">
                <span className="hx-ic">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
                  </svg>
                </span>
                <div>
                  <b>Sensor-first detection</b>
                  <small>Meters, transformers and substations report in automatically.</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div className="stats">
          {STATS.map((s) => (
            <div key={s.l}>
              <b>{s.n}</b>
              <span>{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mq" aria-hidden="true">
        <div className="mq-t">
          {[0, 1].map((k) => (
            <span key={k} style={{ display: 'contents' }}>
              <span>PowerLink</span><i>&bull;</i>
              <span>Detect</span><i>&bull;</i>
              <span>Verify</span><i>&bull;</i>
              <span>Prioritise</span><i>&bull;</i>
              <span>Dispatch</span><i>&bull;</i>
              <span>Track</span><i>&bull;</i>
              <span>Restore</span><i>&bull;</i>
            </span>
          ))}
        </div>
      </div>

      <main>
        <section className="sec wrap" id="features">
          <p className="eyebrow a">The platform</p>
          <h2>One platform for every step of an outage.</h2>
          <p className="sub">From the first sensor alert to a confirmed repair, each step has its own tools, and they all share one live picture.</p>
          <div className="pg">
            {FEATURES.map((f) => (
              <article className="pc" key={f.title}>
                <div className="pv">{f.visual}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="sec wrap" id="signals">
          <div className="dkb">
            <p className="eyebrow a">Why PowerLink</p>
            <h2>Not every blackout needs a truck.</h2>
            <p className="sub">PowerLink reads the signals first, so crews go where the City is actually needed.</p>
            <div className="rows">
              {SIGNALS.map((s) => (
                <div className="rw" key={s.label} style={{ '--c': s.c }}>
                  <h3><i />{s.label}</h3>
                  <div>
                    <span className="lbl">We see</span>
                    <p>{s.see}</p>
                  </div>
                  <div>
                    <span className="lbl">We do</span>
                    <p className="do">{s.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec wrap" id="roles">
          <p className="eyebrow a">Who it is for</p>
          <h2>Built for everyone involved.</h2>
          <div className="tabs" role="tablist" aria-label="Who PowerLink is for">
            {TABS.map((t, i) => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                className={`tab${tab === t.id ? ' on' : ''}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`tp-${t.id}`}
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {t.label}
              </button>
            ))}
          </div>
          {TABS.map((t) => (
            <div
              key={t.id}
              id={`tp-${t.id}`}
              className={`tp${tab === t.id ? ' on' : ''}`}
              role="tabpanel"
              aria-labelledby={`tab-${t.id}`}
              hidden={tab !== t.id}
            >
              <div>
                <h3 className="serif">{t.heading}</h3>
                <p>{t.copy}</p>
                <ul>
                  {t.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
              <div className="tv">
                {t.visual}
                <small>Example data</small>
              </div>
            </div>
          ))}
        </section>
      </main>
      <footer className="foot">
        <div className="wrap fgrid">
          <div>
            <span className="lk">
              <BoltMark size={34} />
              <b className="wm">
                Power<span>Link</span>
              </b>
            </span>
            <p>Smart outage management for the City. Detect, verify, dispatch, track and restore.</p>
          </div>
          <div>
            <h4>Platform</h4>
            <a href="#features">Capabilities</a>
            <a href="#signals">Why PowerLink</a>
            <a href="#roles">Who it is for</a>
          </div>
          <div>
            <h4>Residents</h4>
            <Link to="/citizen/report">Report an outage</Link>
            <Link to="/register">Register your meter</Link>
            <Link to="/login">Log in</Link>
          </div>
          <div>
            <h4>Teams</h4>
            <a href="#roles">Technicians</a>
            <a href="#roles">City operations</a>
            <Link to="/login">Staff login</Link>
          </div>
        </div>
        <div className="wrap legal">&copy; 2026 PowerLink. Prototype by Innovation Pushers, Tshwane Varsity Hackathon. Figures and examples are demo data.</div>
      </footer>
    </div>
  );
}
