import './env.js';
// Central place for tunable settings. Everything can be overridden with env vars.
const num = (value, fallback) => (value !== undefined && value !== '' ? Number(value) : fallback);

export const config = {
  port: num(process.env.PORT, 4000),
  // Extra browser origins allowed to call the API (comma separated). localhost and the hosted frontend are always allowed.
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  frontendUrl: process.env.FRONTEND_URL || 'https://tvh2026project.onrender.com',
  // Shared secret the simulator sends with every telemetry call.
  deviceKey: process.env.DEVICE_KEY || 'powerlink-sim-key',
  // A sensor must stay OFF this long before it becomes an incident (filters flickers).
  debounceSeconds: num(process.env.OUTAGE_DEBOUNCE_SECONDS, 10),
  // After a repair is closed, ignore OFF readings for this long so the sensor can report ON.
  graceSeconds: num(process.env.REPAIR_GRACE_SECONDS, 45),
  // How long after a loadshedding window ends before a still-off node counts as a fault.
  loadsheddingGraceMinutes: num(process.env.LOADSHEDDING_GRACE_MINUTES, 2),
  // A pending job offer that is not answered in this time is offered to someone else.
  offerTimeoutSeconds: num(process.env.OFFER_TIMEOUT_SECONDS, 300),
  // A sensor with no heartbeat for this long is shown as offline.
  sensorOfflineSeconds: num(process.env.SENSOR_OFFLINE_SECONDS, 30),
  avgSpeedKmh: num(process.env.AVG_SPEED_KMH, 40),
  // Reports made within this distance of the registered meter are trusted fully.
  trustRadiusMeters: num(process.env.TRUST_RADIUS_METERS, 200),
  // 1 real second of use counts as this many seconds on a prepaid meter (demo speed-up).
  unitsDemoFactor: num(process.env.UNITS_DEMO_FACTOR, 60),
  remoteReportWeight: 0.3,
  maxOpenJobsPerTechnician: 3,
};
