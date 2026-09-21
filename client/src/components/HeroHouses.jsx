// Animated artwork for the landing page: three houses linked by a power line, lighting up in turn.
export default function HeroHouses() {
  return (
    <svg className="hero-art" viewBox="0 0 520 300" role="img" aria-label="Three houses connected by a power line">
      <defs>
        <linearGradient id="hero-house" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22a45d" />
          <stop offset="1" stopColor="#0f6a38" />
        </linearGradient>
      </defs>
      <path id="hero-line" d="M90 92 Q 175 30 260 76 T 430 92" className="hero-line" fill="none" />
      <circle r="6" className="hero-pulse">
        <animateMotion dur="3.2s" repeatCount="indefinite" path="M90 92 Q 175 30 260 76 T 430 92" />
      </circle>
      <ellipse cx="260" cy="272" rx="230" ry="10" fill="#0f6a38" opacity="0.08" />

      <g className="hero-house h1">
        <path d="M30 150 L90 96 L150 150 V262 H30Z" fill="url(#hero-house)" />
        <rect className="win" x="52" y="170" width="26" height="26" rx="4" />
        <rect className="win" x="102" y="170" width="26" height="26" rx="4" />
        <rect x="74" y="216" width="32" height="46" rx="4" fill="#fff" />
      </g>
      <g className="hero-house h2">
        <path d="M180 120 L260 44 L340 120 V262 H180Z" fill="url(#hero-house)" />
        <rect className="win" x="206" y="140" width="32" height="32" rx="4" />
        <rect className="win" x="282" y="140" width="32" height="32" rx="4" />
        <rect className="win" x="206" y="188" width="32" height="32" rx="4" />
        <rect x="244" y="206" width="32" height="56" rx="4" fill="#fff" />
        <circle cx="260" cy="92" r="10" fill="#fff" />
      </g>
      <g className="hero-house h3">
        <path d="M370 150 L430 96 L490 150 V262 H370Z" fill="url(#hero-house)" />
        <rect className="win" x="392" y="170" width="26" height="26" rx="4" />
        <rect className="win" x="442" y="170" width="26" height="26" rx="4" />
        <rect x="414" y="216" width="32" height="46" rx="4" fill="#fff" />
      </g>
    </svg>
  );
}
