import { useEffect, useMemo, useState } from 'react';
import * as simulator from '../../services/simulatorService.js';

// Thandi's rental is on this transformer, so it is the best one to fail during the demo.
const DEFAULT_TRANSFORMER = 'TR-MAM-2';

const keepOrDefault = (current, options, fallback) => {
  if (options.some((o) => o.id === current)) return current;
  if (options.some((o) => o.id === fallback)) return fallback;
  return options[0]?.id ?? '';
};

export default function ScenarioPanel({ nodes, run, busy }) {
  const transformers = useMemo(() => nodes.filter((n) => n.type === 'transformer'), [nodes]);
  const substations = useMemo(() => nodes.filter((n) => n.type === 'substation'), [nodes]);
  const areas = useMemo(() => [...new Set(nodes.map((n) => n.area))], [nodes]);

  const [transformerId, setTransformerId] = useState('');
  const [substationId, setSubstationId] = useState('');
  const [area, setArea] = useState('');
  const [minutes, setMinutes] = useState(2);
  const [overrun, setOverrun] = useState(false);

  // Fill the dropdowns once the grid has loaded, and keep the choice when the grid refreshes.
  useEffect(() => {
    setTransformerId((id) => keepOrDefault(id, transformers, DEFAULT_TRANSFORMER));
    setSubstationId((id) => keepOrDefault(id, substations));
    setArea((a) => (areas.includes(a) ? a : areas[0] ?? ''));
  }, [transformers, substations, areas]);

  return (
    <section className="card sim-card">
      <h2>Quick scenarios</h2>
      <p className="muted small">Trip something and watch the admin map, incidents and citizen apps react.</p>

      <div className="row">
        <button className="btn btn-sm" disabled={busy} onClick={() => run(() => simulator.runScenario('ownedHouse'))}>Trip a customer&apos;s meter</button>
        <button className="btn btn-sm" disabled={busy} onClick={() => run(() => simulator.runScenario('anyHouse'))}>Trip a random house</button>
      </div>

      <div className="row sim-row">
        <select value={transformerId} onChange={(e) => setTransformerId(e.target.value)} aria-label="Transformer">
          {transformers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.area})</option>)}
        </select>
        <button className="btn btn-sm btn-warn" disabled={busy || !transformerId} onClick={() => run(() => simulator.runScenario('transformer', transformerId))}>Fail transformer</button>
      </div>

      <div className="row sim-row">
        <select value={substationId} onChange={(e) => setSubstationId(e.target.value)} aria-label="Substation">
          {substations.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.area})</option>)}
        </select>
        <button className="btn btn-sm btn-danger" disabled={busy || !substationId} onClick={() => run(() => simulator.runScenario('substation', substationId))}>Fail substation</button>
      </div>

      <hr className="divider" />
      <h3>Loadshedding</h3>
      <div className="row sim-row">
        <select value={area} onChange={(e) => setArea(e.target.value)} aria-label="Area">
          {areas.map((a) => <option key={a}>{a}</option>)}
        </select>
        <input className="sim-minutes" type="number" min="1" max="30" value={minutes} onChange={(e) => setMinutes(e.target.value)} aria-label="Minutes" />
        <span className="muted small">min</span>
      </div>
      <label className="row small muted sim-check">
        <input type="checkbox" checked={overrun} onChange={(e) => setOverrun(e.target.checked)} />
        Power stays off 4 min after the schedule ends (becomes a real fault)
      </label>
      <div className="row sim-row">
        <button className="btn btn-sm" disabled={busy || !area} onClick={() => run(() => simulator.startLoadshedding(area, Number(minutes) || 2, overrun))}>Start loadshedding</button>
      </div>

      <hr className="divider" />
      <div className="row">
        <button className="btn btn-sm btn-outline" disabled={busy} onClick={() => run(simulator.restoreAll, 'Whole grid restored')}>Restore everything</button>
        <button
          className="btn btn-sm btn-ghost"
          disabled={busy}
          onClick={() => window.confirm('Reset all demo data (accounts, incidents, notifications) to the seed state?') && run(simulator.resetDemo, 'Demo data reset')}
        >
          Reset demo data
        </button>
      </div>
    </section>
  );
}
