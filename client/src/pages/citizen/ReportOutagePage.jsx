import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePolling } from '../../hooks/usePolling.js';
import { useGeolocation } from '../../hooks/useGeolocation.js';
import { getMeters, submitReport } from '../../services/citizenService.js';
import { useMeta } from '../../features/meta/MetaContext.jsx';
import { StatusBadge } from '../../features/incidents/StatusBadge.jsx';
import PhotoPicker from '../../components/PhotoPicker.jsx';
import Banner from '../../components/Banner.jsx';
import Spinner from '../../components/Spinner.jsx';
import { distanceMeters } from '../../utils/geo.js';
import { formatDistance, formatTime } from '../../utils/format.js';

function ReportResult({ result, onAnother }) {
  return (
    <div className="stack">
      <div className="page-title"><h1>Report received</h1></div>
      {result.loadshedding ? (
        <Banner tone="info">
          Your area is in scheduled Stage {result.loadshedding.stage} loadshedding until {formatTime(result.loadshedding.end)}. This is not a fault, so no technician has been dispatched.
        </Banner>
      ) : (
        <div className="card card-accent">
          <div className="row-between">
            <h2 style={{ margin: 0 }}>{result.incident.id}</h2>
            <StatusBadge status={result.incident.status} />
          </div>
          <p className="muted" style={{ marginTop: 6 }}>
            {result.incident.status === 'reported'
              ? 'We are checking your report against our sensors and other reports nearby.'
              : 'Your report has been verified and linked to an outage. We will keep you updated.'}
          </p>
        </div>
      )}
      {result.tip && <Banner tone="warn">{result.tip}</Banner>}
      <div className="row">
        <Link to="/citizen/incidents" className="btn">Track my incident</Link>
        <Link to="/citizen/dashboard" className="btn btn-outline">Back to dashboard</Link>
        <button type="button" className="btn btn-ghost" onClick={onAnother}>Report another</button>
      </div>
    </div>
  );
}

export default function ReportOutagePage() {
  const meta = useMeta();
  const { data: meters, loading } = usePolling(getMeters, 6000);
  const geo = useGeolocation();

  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [meterNumber, setMeterNumber] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!meterNumber && meters?.length) setMeterNumber(meters[0].meterNumber);
  }, [meters, meterNumber]);

  if (loading && !meters) return <Spinner />;
  if (result) return <ReportResult result={result} onAnother={() => { setResult(null); setDescription(''); setPhotos([]); setCategory(''); }} />;

  const meter = meters?.find((m) => m.meterNumber === meterNumber);
  const away = geo.position && meter ? distanceMeters(geo.position, meter) : null;
  const remote = away != null && away > 200;

  const locationText = {
    loading: 'Finding your location...',
    denied: 'Location permission denied',
    unavailable: 'Location unavailable',
  }[geo.status] ?? (geo.position ? `${geo.position.lat.toFixed(5)}, ${geo.position.lng.toFixed(5)}` : '');

  const submit = async (event) => {
    event.preventDefault();
    const found = {};
    if (!category) found.category = 'Choose what kind of problem this is';
    if (!description.trim()) found.description = 'Please describe the problem';
    if (!meterNumber) found.meter = 'Choose a meter';
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      setResult(await submitReport({
        category, description, meterNumber, photo: photos[0] ?? null,
        lat: geo.position?.lat ?? null, lng: geo.position?.lng ?? null,
      }));
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="stack">
      <div className="page-title">
        <h1>Report an outage</h1>
        <p>Tell us what is wrong. The more detail, the faster we can help.</p>
      </div>
      {formError && <Banner tone="error">{formError}</Banner>}

      <div className="card">
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a category...</option>
            {meta.reportCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {errors.category && <span className="error">{errors.category}</span>}
        </div>

        <div className="field">
          <label htmlFor="meter">Meter</label>
          <select id="meter" value={meterNumber} onChange={(e) => setMeterNumber(e.target.value)}>
            {(meters ?? []).map((m) => (
              <option key={m.meterNumber} value={m.meterNumber}>{m.label} · {m.meterNumber}{m.state === 'OFF' ? ' (off)' : ''}</option>
            ))}
          </select>
          {meter && <span className="hint">{meter.address}</span>}
          {errors.meter && <span className="error">{errors.meter}</span>}
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" placeholder="For example: the whole street lost power at 18:40 and I heard a loud bang." value={description} onChange={(e) => setDescription(e.target.value)} />
          {errors.description && <span className="error">{errors.description}</span>}
        </div>

        <div className="field">
          <span className="label">Photo</span>
          <PhotoPicker value={photos} onChange={setPhotos} max={1} />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="location">Your current location</label>
          <input id="location" type="text" readOnly value={locationText} />
          {geo.position && meter && (
            <span className={remote ? 'error' : 'hint'} style={remote ? { color: 'var(--amber)' } : undefined}>
              {remote
                ? `You are ${formatDistance(away)} from this meter. Reports from away from the property get a lower priority.`
                : `Location verified: you are at the property (${formatDistance(away)} from the meter).`}
            </span>
          )}
          {geo.status !== 'ready' && geo.status !== 'loading' && (
            <span className="hint">
              We could not read your location, so this report will be treated as coming from away from the property.{' '}
              <button type="button" className="btn btn-ghost btn-sm" onClick={geo.retry}>Try again</button>
            </span>
          )}
        </div>
      </div>

      <button type="submit" className="btn btn-lg btn-block" disabled={busy}>{busy ? 'Sending report...' : 'Log report'}</button>
    </form>
  );
}
