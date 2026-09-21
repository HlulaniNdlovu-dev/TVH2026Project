import { ResponsiveContainer } from 'recharts';

export const CHART_COLORS = ['#178a4a', '#2b6cd6', '#e59a1a', '#d64545', '#7fd0a1', '#7a8f83', '#8b5fd6'];

// A titled card that gives a chart a fixed height.
export default function ChartCard({ title, subtitle, height = 260, empty, children }) {
  return (
    <div className="card chart-card">
      <h3 style={{ marginBottom: 2 }}>{title}</h3>
      {subtitle && <p className="muted small" style={{ marginBottom: 10 }}>{subtitle}</p>}
      {empty ? <p className="muted center" style={{ padding: '40px 0' }}>{empty}</p> : (
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
