const num = (value, fallback) => (value !== undefined && value !== '' ? Number(value) : fallback);

export const config = {
  // Standalone mode only: where the PowerLink API lives.
  apiUrl: (process.env.API_URL || 'http://localhost:4000/api').replace(/\/$/, ''),
  deviceKey: process.env.DEVICE_KEY || 'powerlink-sim-key',
  // Standalone mode only: control panel port.
  port: num(process.env.PORT, 5050),
  tickMs: 1000,
  heartbeatSeconds: num(process.env.HEARTBEAT_SECONDS, 5),
  topologyRefreshSeconds: 5,
  commandPollSeconds: 1,
  technicianPollSeconds: 1,
  // A technician who taps "Navigate" reaches the site in this many seconds, however far away it is.
  driveSeconds: num(process.env.DRIVE_SECONDS, 12),
};
