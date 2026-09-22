import { useState } from 'react';
import { usePolling } from '../../hooks/usePolling.js';
import * as adminService from '../../services/adminService.js';
import PageHeader from '../../components/PageHeader.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { useToast } from '../../components/Toast.jsx';
import { formatDateTime } from '../../utils/format.js';

const SAMPLE = `area,stage,start,end
Mamelodi,2,2026-09-25 18:00,2026-09-25 20:30
Eersterust,2,2026-09-25 20:00,2026-09-25 22:30
Nellmapius,3,2026-09-26 06:00,2026-09-26 08:30`;

function downloadSample() {
  const url = URL.createObjectURL(new Blob([SAMPLE], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'loadshedding-schedule-sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function LoadsheddingPage() {
  const toast = useToast();
  const { data, loading, refresh } = usePolling(adminService.getLoadshedding, 5000, [], 'admin:loadshedding');
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState('');
  const [replace, setReplace] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const chooseFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setCsv(await file.text());
    setError('');
  };

  const upload = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await adminService.uploadLoadshedding(csv, replace);
      toast(`${result.added} slot(s) uploaded`);
      if (result.errors.length) setError(`Some rows were skipped: ${result.errors.join('; ')}`);
      setCsv('');
      setFileName('');
      refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const now = Date.now();
  const upcoming = (data ?? []).filter((w) => new Date(w.end).getTime() > now - 3600000);

  return (
    <>
      <PageHeader title="Loadshedding" subtitle="Upload the schedule. Outages that match a scheduled slot are not dispatched." />
      <div className="detail-layout">
        <div className="card">
          <h2>Upload a schedule</h2>
          <p className="muted small">CSV columns: <span className="mono">area, stage, start, end</span>. Areas: Mamelodi, Eersterust, Nellmapius, or All.</p>
          {error && <Banner tone="error">{error}</Banner>}
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="csv-file">CSV file</label>
            <input id="csv-file" type="file" accept=".csv,text/csv" onChange={chooseFile} />
            {fileName && <span className="hint">{fileName} loaded</span>}
          </div>
          <div className="field">
            <label htmlFor="csv-text">Or paste the CSV</label>
            <textarea id="csv-text" className="mono" value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={SAMPLE} />
          </div>
          <label className="check-row"><input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /><span>Replace the existing schedule</span></label>
          <div className="row">
            <button type="button" className="btn" disabled={!csv.trim() || busy} onClick={upload}>{busy ? 'Uploading...' : 'Upload schedule'}</button>
            <button type="button" className="btn btn-ghost" onClick={downloadSample}>Download sample</button>
          </div>
        </div>

        <div className="card">
          <h2>How it is used</h2>
          <ul className="plain-list">
            <li>Sensor outages that start inside a slot are marked <strong>loadshedding</strong> and no technician is sent.</li>
            <li>Citizen reports inside a slot get a "this is loadshedding" reply.</li>
            <li>If power stays off well after the slot ends, the outage becomes a real fault automatically.</li>
            <li>Danger reports (downed lines, sparking) are always handled.</li>
          </ul>
        </div>
      </div>

      <h2 style={{ margin: '24px 0 10px' }}>Schedule</h2>
      {loading && !data ? <Spinner /> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Area</th><th>Stage</th><th>Starts</th><th>Ends</th><th>Source</th><th /></tr></thead>
            <tbody>
              {upcoming.map((w) => {
                const active = new Date(w.start).getTime() <= now && now <= new Date(w.end).getTime();
                return (
                  <tr key={w.id}>
                    <td><strong>{w.area}</strong></td>
                    <td>Stage {w.stage}</td>
                    <td>{formatDateTime(w.start)}</td>
                    <td>{formatDateTime(w.end)}</td>
                    <td className="muted">{w.source}</td>
                    <td>{active && <span className="badge badge-amber">Active now</span>}</td>
                  </tr>
                );
              })}
              {!upcoming.length && <tr><td colSpan={6} className="center muted">No upcoming slots.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
