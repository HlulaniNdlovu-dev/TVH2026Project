import * as simulator from '../../services/simulatorService.js';

function NodeRow({ node, label, run, busy }) {
  const dot = node.powered ? '' : node.fault === 'loadshedding' ? 'dot-amber' : 'dot-red';
  return (
    <div className="sim-node">
      <span className={`dot ${dot}`} />
      <span className="grow">
        {label}
        {node.fault && <span className="badge sim-tag">{node.fault}</span>}
      </span>
      {node.fault
        ? <button className="btn btn-sm btn-outline sim-mini" disabled={busy} onClick={() => run(() => simulator.restore(node.id))}>Restore</button>
        : <button className="btn btn-sm btn-danger sim-mini" disabled={busy} onClick={() => run(() => simulator.trip(node.id))}>Trip</button>}
    </div>
  );
}

// Substation -> transformer -> house, each with a Trip / Restore button.
export default function GridTree({ nodes, faultCount, run, busy }) {
  const childrenOf = (id) => nodes.filter((n) => n.parentId === id);
  const off = nodes.filter((n) => !n.powered).length;

  return (
    <section className="card sim-card sim-wide">
      <h2>Grid <small className="muted">{nodes.length} sensors, {off} without power, {faultCount} active fault(s)</small></h2>
      {nodes.filter((n) => n.type === 'substation').map((s) => (
        <div key={s.id}>
          <NodeRow node={s} label={<strong>{s.name}</strong>} run={run} busy={busy} />
          <div className="sim-children">
            {childrenOf(s.id).map((t) => (
              <div key={t.id}>
                <NodeRow node={t} label={<strong>{t.name}</strong>} run={run} busy={busy} />
                <div className="sim-children sim-houses">
                  {childrenOf(t.id).map((h) => (
                    <NodeRow
                      key={h.id}
                      node={h}
                      label={<>{h.meterNumber}{h.ownerName && <span className="badge sim-tag">{h.ownerName}</span>}</>}
                      run={run}
                      busy={busy}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
