import Icon from './Icon.jsx';

// tone: green | red | amber | blue | grey
export default function StatCard({ label, value, hint, icon, tone = 'green' }) {
  return (
    <div className={`stat-card stat-${tone}`}>
      {icon && (
        <span className="stat-icon">
          <Icon name={icon} size={20} />
        </span>
      )}
      <div className="stat-body">
        <div className="stat-value">{value ?? '-'}</div>
        <div className="stat-label">{label}</div>
        {hint && <div className="stat-hint">{hint}</div>}
      </div>
    </div>
  );
}
