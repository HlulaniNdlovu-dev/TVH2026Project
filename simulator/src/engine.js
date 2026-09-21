// The "physics": which nodes have power, what they report, and how technicians move.
import { config } from './config.js';
import { state, addLog } from './state.js';
import * as api from './api.js';

/* ---------------- grid model ---------------- */

export async function syncTopology() {
  const { nodes } = await api.getTopology();
  state.nodes = nodes;
  state.byId = new Map(nodes.map((n) => [n.id, n]));
  state.children = new Map();
  nodes.forEach((n) => {
    if (!n.parentId) return;
    if (!state.children.has(n.parentId)) state.children.set(n.parentId, []);
    state.children.get(n.parentId).push(n);
  });
  nodes.filter((n) => n.type === 'house' && !state.baseWatts.has(n.id)).forEach((n) => state.baseWatts.set(n.id, 250 + Math.random() * 1700));
  [...state.faults.keys()].forEach((id) => { if (!state.byId.has(id)) state.faults.delete(id); });
  [...state.lastSent.keys()].forEach((id) => { if (!state.byId.has(id)) state.lastSent.delete(id); });
  state.connected = true;
  state.lastError = null;
  state.lastSync = new Date().toISOString();
}

// A node has power when neither it nor any ancestor is faulted.
export function isPowered(node) {
  let cur = node;
  while (cur) {
    if (state.faults.has(cur.id)) return false;
    cur = cur.parentId ? state.byId.get(cur.parentId) : null;
  }
  return true;
}

export function descendants(nodeId) {
  const out = [];
  const stack = [...(state.children.get(nodeId) ?? [])];
  while (stack.length) {
    const n = stack.pop();
    out.push(n);
    stack.push(...(state.children.get(n.id) ?? []));
  }
  return out;
}

const houseWatts = (house) => {
  const base = state.baseWatts.get(house.id) ?? 500;
  return Math.round(base * (0.92 + Math.random() * 0.16));
};

function readingFor(node) {
  const powered = isPowered(node);
  let watts = 0;
  if (powered) {
    watts = node.type === 'house' ? houseWatts(node) : descendants(node.id).filter((d) => d.type === 'house' && isPowered(d)).reduce((sum, h) => sum + (state.baseWatts.get(h.id) ?? 500), 0);
  }
  return { sensorId: node.id, state: powered ? 'ON' : 'OFF', watts, battery: 100 - (node.id.length * 7) % 25, timestamp: new Date().toISOString() };
}

/* ---------------- fault injection ---------------- */

export function trip(nodeId, kind = 'manual', seconds = null) {
  const node = state.byId.get(nodeId);
  if (!node) throw new Error(`Unknown node ${nodeId}`);
  state.faults.set(nodeId, { kind, until: seconds ? Date.now() + seconds * 1000 : null });
  addLog(`${kind === 'flicker' ? 'Flicker on' : 'Tripped'} ${label(node)}`, 'fault');
}

export function restore(nodeId) {
  const node = state.byId.get(nodeId);
  if (!node) return;
  // A repair fixes the node and everything below it.
  [node, ...descendants(nodeId)].forEach((n) => state.faults.delete(n.id));
  addLog(`Restored ${label(node)}`, 'ok');
}

export function restoreAll() {
  state.faults.clear();
  addLog('Restored the whole grid', 'ok');
}

export const label = (node) => (node.type === 'house' ? `house ${node.meterNumber}${node.ownerName ? ` (${node.ownerName})` : ''}` : node.name);

export async function loadshedding(area, minutes, overrunMinutes = 0) {
  await api.startLoadshedding(area, minutes);
  const substations = state.nodes.filter((n) => n.type === 'substation' && n.area === area);
  const seconds = (minutes + overrunMinutes) * 60;
  substations.forEach((s) => state.faults.set(s.id, { kind: 'loadshedding', until: Date.now() + seconds * 1000 }));
  addLog(`Loadshedding in ${area} for ${minutes} min${overrunMinutes ? ` (power stays off ${overrunMinutes} min longer)` : ''}`, 'fault');
}

/* ---------------- sending readings ---------------- */

let ticks = 0;

export async function tick() {
  ticks += 1;
  const now = Date.now();
  [...state.faults.entries()].forEach(([id, fault]) => {
    if (fault.until && fault.until <= now) {
      state.faults.delete(id);
      addLog(`Power back on at ${label(state.byId.get(id) ?? { name: id, type: 'node' })} (timer ended)`, 'ok');
    }
  });

  const heartbeat = ticks % config.heartbeatSeconds === 0;
  const batch = [];
  state.nodes.forEach((node) => {
    const reading = readingFor(node);
    const changed = state.lastSent.get(node.id) !== reading.state;
    if (changed || heartbeat) {
      batch.push(reading);
      state.lastSent.set(node.id, reading.state);
    }
  });
  if (batch.length) await api.postReadings(batch);
}

// The backend asks us to change the physical world (for example: a technician finished a repair).
export async function pollCommands() {
  const { commands } = await api.getCommands();
  commands.forEach((cmd) => {
    if (cmd.type === 'restore') restore(cmd.nodeId);
  });
}

/* ---------------- technicians ---------------- */

const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;
function distance(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function driveTechnicians() {
  const { technicians } = await api.getTechnicians();
  const stepMeters = (config.technicianSpeedKmh / 3.6) * state.speedMultiplier * config.technicianPollSeconds;
  const locations = technicians.map((t) => {
    let { lat, lng } = t;
    if (state.autoDrive && t.destination) {
      const remaining = distance({ lat, lng }, t.destination);
      if (remaining > 25) {
        const fraction = Math.min(1, stepMeters / remaining);
        lat += (t.destination.lat - lat) * fraction;
        lng += (t.destination.lng - lng) * fraction;
      }
    }
    return { technicianId: t.id, lat, lng, destination: t.destination };
  });
  state.technicians = locations.map((l) => ({ ...technicians.find((t) => t.id === l.technicianId), lat: l.lat, lng: l.lng }));
  await api.postLocations(locations.map(({ technicianId, lat, lng }) => ({ technicianId, lat, lng })));
}

/* ---------------- scenarios ---------------- */

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const healthy = (list) => list.filter((n) => !state.faults.has(n.id) && isPowered(n));

export const scenarios = {
  ownedHouse() {
    const house = pick(healthy(state.nodes.filter((n) => n.type === 'house' && n.ownerName)));
    if (!house) throw new Error('No healthy house with an owner is available');
    trip(house.id);
    return house.id;
  },
  anyHouse() {
    const house = pick(healthy(state.nodes.filter((n) => n.type === 'house')));
    if (!house) throw new Error('No healthy house is available');
    trip(house.id);
    return house.id;
  },
  transformer(id) {
    const node = id ? state.byId.get(id) : pick(healthy(state.nodes.filter((n) => n.type === 'transformer')));
    if (!node) throw new Error('No healthy transformer is available');
    trip(node.id);
    return node.id;
  },
  substation(id) {
    const node = id ? state.byId.get(id) : pick(healthy(state.nodes.filter((n) => n.type === 'substation')));
    if (!node) throw new Error('No healthy substation is available');
    trip(node.id);
    return node.id;
  },
  flicker(id) {
    const node = id ? state.byId.get(id) : pick(healthy(state.nodes.filter((n) => n.type === 'house')));
    trip(node.id, 'flicker', 6);
    return node.id;
  },
};
