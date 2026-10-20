// PowerLink lightning-mark logo (from the approved onboarding prototype).
export default function BoltMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#1b5e34" />
      <path d="M30 9 18 25h11L17 40" fill="none" stroke="#fff" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="30" cy="9" r="4.6" fill="#f2b705" />
      <circle cx="17" cy="40" r="4.6" fill="#d0f0c0" />
    </svg>
  );
}