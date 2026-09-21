import { useNavigate } from 'react-router-dom';
import { PriorityBadge, StatusBadge } from './StatusBadge.jsx';
import { formatDuration } from '../../utils/format.js';

// Admin list of incidents, most urgent first.
export default function IncidentTable({ incidents, compact = false }) {
  const navigate = useNavigate();
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Incident</th><th>Location</th><th>Priority</th><th>Status</th><th>Customers</th>
            {!compact && <th>Reports</th>}<th>Technician</th><th>Open for</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((i) => (
            <tr key={i.id} className="clickable" onClick={() => navigate(`/admin/incidents/${i.id}`)}>
              <td><strong>{i.id}</strong><div className="muted small">{i.category}</div></td>
              <td>{i.nodeName}<div className="muted small">{i.area}</div></td>
              <td><PriorityBadge level={i.priority.level} overridden={i.priority.overridden} /><div className="muted small">score {i.priority.score}</div></td>
              <td><StatusBadge status={i.status} />{!i.sensorConfirmed && i.status === 'reported' && <div className="muted small">unconfirmed</div>}</td>
              <td>{i.affectedCount}</td>
              {!compact && <td>{i.reportCount}</td>}
              <td>{i.technician ? i.technician.name : <span className="muted">Unassigned</span>}</td>
              <td>{formatDuration(i.minutesOpen)}</td>
            </tr>
          ))}
          {!incidents.length && <tr><td colSpan={compact ? 7 : 8} className="center muted">No incidents to show.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
