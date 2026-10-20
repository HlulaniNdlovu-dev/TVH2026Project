// How the simulator talks to PowerLink. By default it calls the telemetry endpoints over HTTP (standalone mode).
// When the simulator runs inside the API process, the server swaps in a transport that calls its services
// directly, so readings and technician positions never cross the network.
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

const httpTransport = {
  description: config.apiUrl,
  getTopology: () => call('GET', '/telemetry/topology'),
  postReadings: (readings) => call('POST', '/telemetry/readings', { readings }),
  getCommands: () => call('GET', '/telemetry/commands'),
  getTechnicians: () => call('GET', '/telemetry/technicians'),
  postLocations: (locations) => call('POST', '/telemetry/technician-locations', { locations }),
  startLoadshedding: (area, minutes, stage) => call('POST', '/telemetry/loadshedding', { area, minutes, stage }),
  resetBackend: () => call('POST', '/demo/reset', {}),
};

let transport = httpTransport;

// Replaces the HTTP calls. `next` has the same method names and returns the same shapes as httpTransport.
export function useTransport(next) {
  transport = next;
}

export const target = () => transport.description;
export const getTopology = () => transport.getTopology();
export const postReadings = (readings) => transport.postReadings(readings);
export const getCommands = () => transport.getCommands();
export const getTechnicians = () => transport.getTechnicians();
export const postLocations = (locations) => transport.postLocations(locations);
export const startLoadshedding = (area, minutes, stage = 2) => transport.startLoadshedding(area, minutes, stage);
export const resetBackend = () => transport.resetBackend();
