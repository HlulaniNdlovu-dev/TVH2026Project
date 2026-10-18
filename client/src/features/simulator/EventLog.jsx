export default function EventLog({ entries }) {
  return (
    <section className="card sim-card">
      <h2>Event log</h2>
      <ul className="sim-log">
        {entries.length ? entries.map((l, i) => (
          <li key={`${l.ts}-${i}`} className={`sim-log-${l.level}`}>
            <span className="muted">{new Date(l.ts).toLocaleTimeString()}</span> {l.message}
          </li>
        )) : <li className="muted">Nothing yet</li>}
      </ul>
    </section>
  );
}
