import { useState } from 'react';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import IncidentTable from '../../features/incidents/IncidentTable.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';

const FILTERS = [
  { value: 'open', label: 'Open' },
  { value: 'reported', label: 'Awaiting verification' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
];

export default function IncidentsPage() {
  const [filter, setFilter] = useState('open');
  const { data, error, loading } = usePolling(() => adminService.getIncidents(filter), 4000, [filter], `admin:incidents:${JSON.stringify(filter)}`);

  return (
    <>
      <PageHeader title="Incidents" subtitle="Grouped reports and sensor detections, ranked by system-calculated priority." />
      <div className="tabs" role="tablist" style={{ marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button key={f.value} type="button" role="tab" aria-selected={filter === f.value} className={filter === f.value ? 'active' : ''} onClick={() => setFilter(f.value)}>{f.label}</button>
        ))}
      </div>
      {loading && !data ? <Spinner /> : !data ? <Banner tone="error">{error?.message}</Banner> : <IncidentTable incidents={data} />}
    </>
  );
}
