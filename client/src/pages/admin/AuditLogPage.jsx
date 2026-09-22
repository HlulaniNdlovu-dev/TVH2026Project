import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import PageHeader from '../../components/PageHeader.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { formatDateTime } from '../../utils/format.js';

const ACTION_LABELS = {
  priority_override: 'Priority override',
  priority_override_removed: 'Override removed',
  reassign: 'Reassignment',
  manual_assign: 'Manual assignment',
  decline_job: 'Job declined',
  verify_incident: 'Manual verification',
  loadshedding_upload: 'Schedule upload',
  seed: 'System',
};

export default function AuditLogPage() {
  const { data, error, loading } = usePolling(adminService.getAuditLog, 5000, [], 'admin:audit');
  if (loading && !data) return <Spinner />;
  if (!data) return <Banner tone="error">{error?.message}</Banner>;

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every override, reassignment, decline and manual action, with who did it and why." />
      <div className="table-wrap">
        <table>
          <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Item</th><th>Details</th><th>Reason</th></tr></thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id}>
                <td className="muted" style={{ whiteSpace: 'nowrap' }}>{formatDateTime(e.ts)}</td>
                <td>{e.actorName}</td>
                <td><span className="badge">{ACTION_LABELS[e.action] ?? e.action}</span></td>
                <td className="mono">{e.entityId}</td>
                <td>{e.details}</td>
                <td>{e.reason ?? <span className="muted">-</span>}</td>
              </tr>
            ))}
            {!data.length && <tr><td colSpan={6} className="center muted">Nothing logged yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
