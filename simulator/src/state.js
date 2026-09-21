// Everything the simulator "knows": the grid it is pretending to be, and the faults injected into it.
export const state = {
  connected: false,
  lastError: null,
  lastSync: null,
  nodes: [], // topology from the backend
  byId: new Map(),
  children: new Map(),
  faults: new Map(), // nodeId -> { kind, until (ms epoch or null) }
  baseWatts: new Map(), // house nodeId -> typical draw
  lastSent: new Map(), // nodeId -> 'ON' | 'OFF'
  technicians: [],
  autoDrive: true,
  speedMultiplier: 10,
  log: [],
};

export function addLog(message, level = 'info') {
  state.log.unshift({ ts: new Date().toISOString(), message, level });
  state.log.length = Math.min(state.log.length, 60);
  console.log(`[${level}] ${message}`);
}
