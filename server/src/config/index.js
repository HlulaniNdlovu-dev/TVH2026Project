// Central place for tunable settings. Everything can be overridden with env vars.
const num = (value, fallback) => (value !== undefined && value !== '' ? Number(value) : fallback);

export const config = {
  port: num(process.env.PORT, 4000),
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
  remoteReportWeight: 0.3,
  maxOpenJobsPerTechnician: 3,
  // Artificial delay (ms) added to every db stub call so it behaves like a real database.
  dbLatencyMs: num(process.env.DB_LATENCY_MS, 2),
};
