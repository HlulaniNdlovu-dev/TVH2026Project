// Runs the sensor simulator (../../../simulator) inside this process.
//
// The simulator is still its own code: it pretends to be the smart meters, transformer sensors and technician
// phones. Here it simply calls the telemetry services directly instead of the telemetry HTTP endpoints, so its
// readings reach the grid in the same instant and there is only one service to host. The control panel lives
// in the client at /simulator and talks to /api/simulator/*.
import { useTransport } from '../../../simulator/src/api.js';
import { startSimulation, snapshot, actions } from '../../../simulator/src/runner.js';
import { state as simState } from '../../../simulator/src/state.js';
import { syncTopology } from '../../../simulator/src/engine.js';
import * as telemetry from './telemetryService.js';
import * as loadshedding from './loadsheddingService.js';
import * as demo from './demoService.js';

const inProcessTransport = {
  description: 'this server (built in)',
  getTopology: async () => ({ nodes: await telemetry.topology() }),
  postReadings: (readings) => telemetry.ingest(readings),
  getCommands: async () => ({ commands: await telemetry.popCommands() }),
  getTechnicians: async () => ({ technicians: await telemetry.technicianTargets() }),
  postLocations: (locations) => telemetry.updateLocations(locations),
  startLoadshedding: async (area, minutes, stage) => ({ window: await loadshedding.injectWindow({ area, minutes, stage }) }),
  resetBackend: () => demo.resetData(),
};

export function start() {
  useTransport(inProcessTransport);
  startSimulation();
}

export const getState = snapshot;
export { actions };

// After the demo data is reset, the simulated grid starts healthy again too.
export function clearFaults() {
  simState.faults.clear();
  simState.lastSent.clear();
  simState.drives.clear();
  syncTopology().catch(() => {});
}
