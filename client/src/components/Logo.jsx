// PowerLink wordmark with three houses side by side, joined by a "link" line.
export function LogoMark({ size = 36, color = '#178a4a', accent = '#ffffff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path d="M15 21 H49" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <g fill={color}>
        <path d="M5 31 L15 21 L25 31 V46 H5Z" />
        <path d="M21 27 L32 15 L43 27 V46 H21Z" />
        <path d="M39 31 L49 21 L59 31 V46 H39Z" />
      </g>
      <g fill={accent}>
        <rect x="29.5" y="36" width="5" height="10" rx="1" />
        <rect x="11.5" y="37" width="4" height="9" rx="1" />
        <rect x="48.5" y="37" width="4" height="9" rx="1" />
      </g>
    </svg>
  );
}

export default function Logo({ size = 34, text = true, light = false, className = '' }) {
  return (
    <span className={`logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <LogoMark size={size} color={light ? '#ffffff' : '#178a4a'} accent={light ? '#178a4a' : '#ffffff'} />
      {text && (
        <span style={{ fontWeight: 800, fontSize: size * 0.62, letterSpacing: '-0.02em', color: light ? '#fff' : 'var(--ink)' }}>
          Power<span style={{ color: light ? '#c9f0d8' : 'var(--green-600)' }}>Link</span>
        </span>
      )}
    </span>
  );
}
