const num = (value, fallback) => (value !== undefined && value !== '' ? Number(value) : fallback);

export const config = {
  // Where the PowerLink API lives. Change this to point the simulator at a hosted backend.
  apiUrl: (process.env.API_URL || 'http://localhost:4000/api').replace(/\/$/, ''),
  deviceKey: process.env.DEVICE_KEY || 'powerlink-sim-key',
  // Control panel port.
  port: num(process.env.PORT, 5050),
  tickMs: 1000,
  heartbeatSeconds: num(process.env.HEARTBEAT_SECONDS, 5),
  topologyRefreshSeconds: 10,
  commandPollSeconds: 2,
  technicianPollSeconds: 2,
  // Real driving speed used to move technicians (km/h) and how much faster than real time to run.
  technicianSpeedKmh: 40,
  defaultSpeedMultiplier: num(process.env.SPEED_MULTIPLIER, 10),
};
