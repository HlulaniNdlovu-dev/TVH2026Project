// Thin client for the PowerLink telemetry endpoints.
import { config } from './config.js';

async function call(method, path, body) {
  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-device-key': config.deviceKey },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `${method} ${path} failed (${res.status})`);
  return data;
}

export const getTopology = () => call('GET', '/telemetry/topology');
export const postReadings = (readings) => call('POST', '/telemetry/readings', { readings });
export const getCommands = () => call('GET', '/telemetry/commands');
export const getTechnicians = () => call('GET', '/telemetry/technicians');
export const postLocations = (locations) => call('POST', '/telemetry/technician-locations', { locations });
export const startLoadshedding = (area, minutes, stage = 2) => call('POST', '/telemetry/loadshedding', { area, minutes, stage });
export const resetBackend = () => call('POST', '/demo/reset', {});
