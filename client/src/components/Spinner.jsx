export default function Spinner({ label }) {
  return (
    <div role="status" aria-live="polite">
      <div className="spinner" />
      {label && <p className="center muted small">{label}</p>}
    </div>
  );
}
