import BoltMark from './BoltMark.jsx';

// PowerLink wordmark: the shared BoltMark lightning logo + the "PowerLink" text.
// The mark's colours are fixed by the BoltMark brand implementation.
export function LogoMark({ size = 36 }) {
  return <BoltMark size={size} />;
}

export default function Logo({ size = 34, text = true, light = false, className = '' }) {
  return (
    <span className={`logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <LogoMark size={size} />
      {text && (
        <span style={{ fontWeight: 800, fontSize: size * 0.62, letterSpacing: '-0.02em', color: light ? '#fff' : 'var(--ink)' }}>
          Power<span style={{ color: light ? '#c9f0d8' : 'var(--green-600)' }}>Link</span>
        </span>
      )}
    </span>
  );
}
