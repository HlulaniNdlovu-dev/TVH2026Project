import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import { getDashboard } from '../../services/citizenService.js';
import { useAuth } from '../../features/auth/useAuth.js';
import CitizenIncidentCard from '../../features/incidents/CitizenIncidentCard.jsx';
import MeterPowerCard from '../../features/meters/MeterPowerCard.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import Icon from '../../components/Icon.jsx';
import { formatDate, formatTime } from '../../utils/format.js';

const AREA_ICON = { operational: 'check', outage_nearby: 'alert', loadshedding: 'bolt' };
const AREA_TITLE = { operational: 'Grid fully operational', outage_nearby: 'Outages nearby', loadshedding: 'Loadshedding' };

function NextSlot({ slot }) {
  if (!slot) return <p className="muted">No loadshedding is scheduled for your area.</p>;
  const now = Date.now();
  const active = new Date(slot.start).getTime() <= now && now <= new Date(slot.end).getTime();
  return (
    <div>
      <div className="slot-time">{formatTime(slot.start)} – {formatTime(slot.end)}</div>
      <div className="muted">{active ? 'Happening now' : formatDate(slot.start)} · Stage {slot.stage}</div>
    </div>
  );
}

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const { data, error, loading } = usePolling(getDashboard, 4000);

  if (loading && !data) return <Spinner label="Loading your dashboard..." />;
  if (!data) return <Banner tone="error">{error?.message ?? 'Could not load your dashboard.'}</Banner>;

  return (
    <div className="stack">
      <div className="page-title">
        <h1>Hello, {user.name.split(' ')[0]}</h1>
        <p>Here is what is happening with your power.</p>
      </div>
      {error && <Banner tone="warn">Trying to reconnect to the server...</Banner>}

      {data.incident ? (
        <CitizenIncidentCard incident={data.incident} />
      ) : (
        <div className="card card-flat no-incident">
          <span className="feature-icon"><Icon name="check" size={22} /></span>
          <div className="grow">
            <h3 style={{ margin: 0 }}>No active incident</h3>
            <p className="muted" style={{ margin: 0 }}>Nothing is reported for your meters right now.</p>
          </div>
          <Link to="/citizen/report" className="btn btn-outline btn-sm">Report outage</Link>
        </div>
      )}

      <section>
        <h2>Your power supply</h2>
        <div className="stack-sm">
          {data.meters.map((m) => <MeterPowerCard key={m.meterNumber} meter={m} />)}
        </div>
      </section>

      <section className="grid-2">
        <div className={`card area-card area-${data.area.state}`}>
          <div className="row">
            <span className="area-icon"><Icon name={AREA_ICON[data.area.state]} size={22} /></span>
            <div className="grow">
              <div className="muted small">Area status · {data.area.name}</div>
              <h3 style={{ margin: 0 }}>{AREA_TITLE[data.area.state]}</h3>
            </div>
          </div>
          <p style={{ margin: '10px 0 0' }}>{data.area.message}</p>
        </div>
        <div className="card">
          <div className="muted small">Next loadshedding slot</div>
          <NextSlot slot={data.nextLoadshedding} />
        </div>
      </section>
    </div>
  );
}
