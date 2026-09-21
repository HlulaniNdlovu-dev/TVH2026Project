export default function EmptyState({ title, children, icon }) {
  return (
    <div className="empty">
      {icon}
      {title && <h3 style={{ color: 'var(--ink)' }}>{title}</h3>}
      {children && <div>{children}</div>}
    </div>
  );
}
