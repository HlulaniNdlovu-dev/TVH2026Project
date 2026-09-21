import Icon from './Icon.jsx';

// tone: green | red | amber | blue | grey
// With `progress` (0-100) the card shows a left-to-right bar instead of an icon.
export default function StatCard({ label, value, hint, icon, progress, tone = 'green' }) {
  const hasBar = progress != null;
  return (
    <div className={`stat-card stat-${tone}${hasBar ? ' stat-bar-card' : ''}`}>
      {icon && !hasBar && (
        <span className="stat-icon">
          <Icon name={icon} size={20} />
        </span>
      )}
      <div className="stat-body">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value ?? '-'}</div>
        {hasBar && (
          <div className="stat-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        )}
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}

// value out of max, as a 0-100 bar length.
export const pct = (value, max) => (max > 0 && value != null ? Math.min(100, (value / max) * 100) : 0);
