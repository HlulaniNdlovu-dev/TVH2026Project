// Light/dark toggle. Presentational: the parent owns the theme value and persistence.
// The label/title describe the NEXT action. `inline` fits it into a top bar or sidebar
// instead of floating in the corner.
export default function ThemeToggle({ theme, onToggle, inline = false }) {
  const next = theme === 'dark' ? 'light' : 'dark';
  const label = `Switch to ${next} mode`;
  return (
    <button
      type="button"
      className={inline ? 'btn btn-ghost btn-sm theme-inline' : 'pl-theme-btn'}
      data-state={theme}
      onClick={onToggle}
      aria-label={label}
      title={label}
    >
      <svg className="moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
      <svg className="sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}