import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import ChartCard, { CHART_COLORS } from '../../features/analytics/ChartCard.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import StatCard from '../../components/StatCard.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatDuration } from '../../utils/format.js';

const AXIS = { fontSize: 12, fill: '#5d6f63' };
const GRID = '#e4ece7';

// ResponsiveContainer hands its measured size to its child, so these wrappers must pass it to the chart.
function Donut({ data, width, height }) {
  return (
    <PieChart width={width} height={height}>
      <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="82%" paddingAngle={2}>
        {data.map((entry, i) => <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
      </Pie>
      <Tooltip />
      <Legend verticalAlign="bottom" iconType="circle" />
    </PieChart>
  );
}

function HBar({ data, color = CHART_COLORS[0], width, height }) {
  return (
    <BarChart width={width} height={height} data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
      <CartesianGrid stroke={GRID} horizontal={false} />
      <XAxis type="number" tick={AXIS} allowDecimals={false} />
      <YAxis type="category" dataKey="name" tick={AXIS} width={150} />
      <Tooltip />
      <Bar dataKey="value" name="Incidents" fill={color} radius={[0, 6, 6, 0]} />
    </BarChart>
  );
}

export default function AnalyticsPage() {
  const { data, error, loading } = usePolling(adminService.getAnalytics, 10000);
  if (loading && !data) return <Spinner label="Crunching the numbers..." />;
  if (!data) return <Banner tone="error">{error?.message}</Banner>;
  const k = data.kpis;

  return (
    <>
      <PageHeader title="Grid and technician analytics" subtitle="The last 30 days: response, resolution, hotspots and recurring faults." />

      <div className="stat-grid">
        <StatCard label="Incidents (30 days)" value={k.incidents30d} icon="alert" tone="blue" />
        <StatCard label="Avg response time" value={formatDuration(k.avgResponseMinutes)} icon="clock" hint="to technician on site" />
        <StatCard label="Avg resolution time" value={formatDuration(k.avgResolutionMinutes)} icon="check" />
        <StatCard label="First-time fix rate" value={k.firstTimeFixRate != null ? `${k.firstTimeFixRate}%` : '-'} icon="wrench" hint="resolved without pausing" />
        <StatCard label="Flickers ignored" value={k.flickerEvents} icon="refresh" tone="amber" hint="brief drops, no dispatch" />
      </div>

      <div className="grid-charts">
        <div className="span-2">
          <ChartCard title="Incidents and resolution time" subtitle="Daily incidents (bars) and average time to restore power in minutes (line), last 14 days.">
            <ComposedChart data={data.trend} margin={{ left: 0, right: 10 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tick={AXIS} />
              <YAxis yAxisId="l" tick={AXIS} allowDecimals={false} />
              <YAxis yAxisId="r" orientation="right" tick={AXIS} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="l" dataKey="incidents" name="Incidents" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
              <Line yAxisId="r" type="monotone" dataKey="avgResolution" name="Avg resolution (min)" stroke={CHART_COLORS[1]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
            </ComposedChart>
          </ChartCard>
        </div>

        <ChartCard title="Fault causes" subtitle="What technicians recorded when closing jobs." empty={!data.causes.length && 'No closed jobs yet.'}>
          <HBar data={data.causes} />
        </ChartCard>

        <ChartCard title="Where faults occur" subtitle="Incidents by part of the network.">
          <Donut data={data.byType} />
        </ChartCard>

        <ChartCard title="Real faults vs loadshedding" subtitle="Loadshedding outages are recognised and not dispatched.">
          <Donut data={data.loadsheddingVsFaults} />
        </ChartCard>

        <ChartCard title="Why work was delayed" subtitle="Pause reasons logged by technicians." empty={!data.delayReasons.length && 'No delays recorded.'}>
          <HBar data={data.delayReasons} color={CHART_COLORS[2]} />
        </ChartCard>

        <div className="card span-2">
          <h3>Failure hotspots and recurring faults</h3>
          <p className="muted small">Assets with 3 or more incidents in 30 days are flagged as recurring and are candidates for planned maintenance.</p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Asset</th><th>Area</th><th>Incidents</th><th>Trend</th></tr></thead>
              <tbody>
                {data.hotspots.map((h) => (
                  <tr key={h.nodeId}>
                    <td><strong>{h.name}</strong></td>
                    <td>{h.area}</td>
                    <td>
                      <span className="bar-track" style={{ display: 'inline-block', width: 90, verticalAlign: 'middle', marginRight: 8 }}><span style={{ width: `${(h.incidents / data.hotspots[0].incidents) * 100}%`, background: h.recurring ? 'var(--red)' : undefined }} /></span>
                      {h.incidents}
                    </td>
                    <td>{h.recurring ? <span className="badge badge-red">Recurring</span> : <span className="badge badge-green">Normal</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card span-2">
          <h3>Technician performance</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Technician</th><th>Jobs done</th><th>Avg response</th><th>Avg repair time</th></tr></thead>
              <tbody>
                {data.technicians.map((t) => (
                  <tr key={t.name}><td><strong>{t.name}</strong></td><td>{t.jobs}</td><td>{formatDuration(t.avgResponse)}</td><td>{formatDuration(t.avgRepair)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <ChartCard title="Incidents by area" subtitle="Last 30 days.">
          <HBar data={data.byArea} color={CHART_COLORS[1]} />
        </ChartCard>
      </div>
    </>
  );
}
