// Starts the simulator's loops and holds the control panel's actions, so the same code runs either in the
// standalone simulator (index.js) or inside the PowerLink API process.
import { config } from './config.js';
import { state, addLog } from './state.js';
import * as engine from './engine.js';
import * as api from './api.js';

// Runs an async job on a loop without ever overlapping itself or crashing the process.
function every(seconds, name, job) {
  let running = false;
  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await job();
      state.connected = true;
    } catch (err) {
      state.connected = false;
      state.lastError = `${name}: ${err.message}`;
    } finally {
      running = false;
    }
  }, seconds * 1000);
}

let started = false;
export function startSimulation() {
  if (started) return;
  started = true;
  engine.syncTopology().then(() => addLog(`Connected. Simulating ${state.nodes.length} sensors.`, 'ok')).catch((err) => {
    state.lastError = `Cannot reach the API: ${err.message}`;
    addLog(state.lastError, 'error');
  });
  every(config.tickMs / 1000, 'sensors', () => (state.nodes.length ? engine.tick() : engine.syncTopology()));
  every(config.topologyRefreshSeconds, 'topology', engine.syncTopology);
  every(config.commandPollSeconds, 'commands', engine.pollCommands);
  every(config.technicianPollSeconds, 'technicians', engine.driveTechnicians);
}

// What the control panel shows.
export function snapshot() {
  return {
    connected: state.connected,
    lastError: state.lastError,
    lastSync: state.lastSync,
    apiUrl: api.target(),
    autoDrive: state.autoDrive,
    driveSeconds: config.driveSeconds,
    faultCount: state.faults.size,
    technicians: state.technicians,
    log: state.log,
    nodes: state.nodes.map((n) => ({
      id: n.id, type: n.type, name: n.name, parentId: n.parentId, area: n.area, meterNumber: n.meterNumber, ownerName: n.ownerName,
      powered: engine.isPowered(n), fault: state.faults.get(n.id)?.kind ?? null,
    })),
  };
}

// Every control panel button. Each takes the request body and returns a small result object (or nothing).
export const actions = {
  trip: ({ nodeId }) => engine.trip(nodeId),
  restore: ({ nodeId }) => engine.restore(nodeId),
  restoreAll: () => engine.restoreAll(),
  scenario: (name, { nodeId }) => {
    const fn = engine.scenarios[name];
    if (!fn) throw new Error('Unknown scenario');
    return { nodeId: fn(nodeId) };
  },
  loadshedding: ({ area, minutes, overrun }) => engine.loadshedding(area, Number(minutes) || 2, overrun ? 4 : 0),
  technicians: ({ autoDrive }) => {
    if (autoDrive !== undefined) state.autoDrive = Boolean(autoDrive);
    addLog(`Technician driving ${state.autoDrive ? 'on' : 'paused'}`);
  },
  resetBackend: async () => {
    await api.resetBackend();
    state.faults.clear();
    state.lastSent.clear();
    state.drives.clear();
    await engine.syncTopology();
    addLog('Backend demo data reset to the seed state', 'ok');
  },
};
