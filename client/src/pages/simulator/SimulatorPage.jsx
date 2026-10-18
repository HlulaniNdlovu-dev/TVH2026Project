import { Link } from 'react-router-dom';
import Logo from '../../components/Logo.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { usePolling } from '../../hooks/usePolling.js';
import * as simulator from '../../services/simulatorService.js';
import { useSimulatorAction } from '../../features/simulator/useSimulatorAction.js';
import ScenarioPanel from '../../features/simulator/ScenarioPanel.jsx';
import TechnicianPanel from '../../features/simulator/TechnicianPanel.jsx';
import EventLog from '../../features/simulator/EventLog.jsx';
import GridTree from '../../features/simulator/GridTree.jsx';

// Control panel for the sensor simulator that runs inside the API. Pretends to be the smart meters,
// transformer sensors and technician phones. Open it in its own tab next to the app.
export default function SimulatorPage() {
  const { data, error, loading, refresh } = usePolling(simulator.getState, 1500);
  const { run, busy } = useSimulatorAction(refresh);

  return (
    <div className="sim-page">
      <header className="sim-top">
        <div>
          <Link to="/login" aria-label="Back to login"><Logo size={30} /></Link>
          <h1>Sensor simulator</h1>
          <p className="muted small">Pretends to be the smart meters, transformer sensors and technician phones.</p>
        </div>
        {data && (
          <span className={`badge ${data.connected ? 'badge-green' : 'badge-red'}`}>
            {data.connected ? 'Running' : `Not running: ${data.lastError ?? 'starting up'}`}
          </span>
        )}
      </header>

      {error && <div className="sim-banner"><Banner tone="error">{error.message}</Banner></div>}
      {loading && !data ? <Spinner /> : data && (
        <main className="sim-layout">
          <ScenarioPanel nodes={data.nodes} run={run} busy={busy} />
          <div className="stack">
            <TechnicianPanel technicians={data.technicians} autoDrive={data.autoDrive} driveSeconds={data.driveSeconds} run={run} busy={busy} />
            <EventLog entries={data.log} />
          </div>
          <GridTree nodes={data.nodes} faultCount={data.faultCount} run={run} busy={busy} />
        </main>
      )}
    </div>
  );
}
