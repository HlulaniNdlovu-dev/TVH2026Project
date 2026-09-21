// Receives readings from the sensor simulator (or, later, real devices).
import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { nowIso, secondsSince } from '../utils/time.js';
import * as technicians from './technicianService.js';

export async function ingest(readings) {
  const nodes = await stubs.listNodes();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const updates = [];
  readings.forEach((r) => {
    const node = byId.get(r.sensorId);
    if (!node) return;
    const state = r.state === 'OFF' ? 'OFF' : 'ON';
    const patch = { watts: state === 'OFF' ? 0 : Number(r.watts) || 0, lastHeartbeat: nowIso() };
    if (r.battery != null) patch.battery = r.battery;
    if (state !== node.state) {
      patch.state = state;
      if (state === 'OFF') {
        patch.offSince = nowIso();
      } else {
        // Came back before the debounce: that was a flicker, not an outage.
        if (node.offSince && !node.offReason && secondsSince(node.offSince) < config.debounceSeconds) patch.flickerCount = (node.flickerCount ?? 0) + 1;
        patch.offSince = null;
        patch.offReason = null;
        patch.forceConfirm = false;
      }
    }
    updates.push({ id: node.id, patch });
  });
  await stubs.updateNodes(updates);
  return { accepted: updates.length };
}

// What the simulator needs to know about the grid.
export async function topology() {
  const [nodes, users] = await Promise.all([stubs.listNodes(), stubs.listUsers()]);
  const owners = new Map(users.map((u) => [u.id, u.name]));
  return nodes.map((n) => ({
    id: n.id, type: n.type, name: n.name, parentId: n.parentId, area: n.area, lat: n.lat, lng: n.lng,
    meterNumber: n.meterNumber ?? null, ownerName: n.ownerId ? owners.get(n.ownerId) ?? null : null,
    state: n.state,
  }));
}

export async function technicianTargets() {
  const [techs, incidentsList, nodes] = await Promise.all([stubs.listUsers({ role: 'technician' }), stubs.listIncidents({ open: true }), stubs.listNodes()]);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  return techs.map((t) => {
    const active = incidentsList.find((i) => i.technicianId === t.id && i.status === 'en_route');
    const site = active ? nodeById.get(active.nodeId) : null;
    return {
      id: t.id, name: t.name, dutyStatus: t.tech.dutyStatus, lat: t.tech.lat, lng: t.tech.lng,
      destination: site ? { lat: site.lat, lng: site.lng } : null,
    };
  });
}

export async function updateLocations(locations) {
  for (const loc of locations) await technicians.updateLocation(loc.technicianId, loc.lat, loc.lng);
  return { accepted: locations.length };
}

export const popCommands = () => stubs.popCommands();
