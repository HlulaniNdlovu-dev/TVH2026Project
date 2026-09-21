// The heart of the system: turns raw sensor states into incidents.
//
//  1. Restored power resolves sensor incidents automatically.
//  2. A node that stays OFF (past the flicker debounce) is grouped upwards to the highest failed node,
//     so 20 dark houses under one dead transformer become ONE incident.
//  3. Scheduled loadshedding is suppressed (no dispatch); overruns become faults.
//  4. Priority is recalculated and waiting incidents are assigned to technicians.
import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { nowIso } from '../utils/time.js';
import { runExclusive } from '../utils/lock.js';
import { housesUnder, descendantsOf, topmostOffAncestor, isAncestor } from './topologyService.js';
import * as incidents from './incidentService.js';
import * as loadshedding from './loadsheddingService.js';
import * as assignment from './assignmentService.js';

const isConfirmed = (node, now) => {
  if (node.state !== 'OFF' || !node.offSince) return false;
  if (node.graceUntil && new Date(node.graceUntil) > now) return false;
  return node.forceConfirm || now - new Date(node.offSince) >= config.debounceSeconds * 1000;
};

// Not exclusive by itself: callers that need the lock wrap it (see tick and reportService).
export async function evaluateNow() {
  const ctx = await incidents.loadContext();
  const { idx } = ctx;
  const now = new Date();
  const open = await stubs.listIncidents({ open: true });
  const sensorOpen = open.filter((i) => i.sensorConfirmed);
  const resolvedNow = new Set();

  // 1. Power came back on its own.
  for (const incident of sensorOpen) {
    const root = idx.byId.get(incident.nodeId);
    if (root && root.state === 'ON') {
      await incidents.resolve(incident, { by: 'System', auto: true });
      resolvedNow.add(incident.id);
    }
  }
  const stillOpen = open.filter((i) => !resolvedNow.has(i.id));

  // 2. Find the root cause of every confirmed outage.
  const roots = new Map();
  idx.nodes.filter((n) => isConfirmed(n, now)).forEach((n) => {
    const root = topmostOffAncestor(idx, n);
    if (isConfirmed(root, now)) roots.set(root.id, root);
  });

  for (const root of roots.values()) {
    const houses = housesUnder(idx, root.id).filter((h) => h.state === 'OFF');
    const classification = await loadshedding.classifyOutage(root.area, root.offSince, now);

    if (classification.suppress) {
      // Scheduled loadshedding: mark it and do not dispatch anyone.
      const affected = [root, ...descendantsOf(idx, root.id).filter((n) => n.state === 'OFF')];
      const fresh = affected.filter((n) => n.offReason !== 'loadshedding');
      if (fresh.length) {
        await stubs.updateNodes(fresh.map((n) => ({ id: n.id, patch: { offReason: 'loadshedding' } })));
        if (root.offReason !== 'loadshedding') await stubs.addSuppressed({ area: root.area, nodeId: root.id });
      }
      continue;
    }

    const existing = stillOpen.find((i) => i.nodeId === root.id);
    if (existing) {
      if (!existing.sensorConfirmed) {
        // A citizen reported it first; now the sensors agree.
        await stubs.recordIncidentEvent(existing.id, { type: 'verified', message: 'Confirmed by sensor data' }, {
          sensorConfirmed: true, source: 'sensor', status: existing.status === 'reported' ? 'verified' : existing.status, verifiedAt: existing.verifiedAt ?? nowIso(),
        });
      }
      continue;
    }
    if (stillOpen.some((i) => isAncestor(idx, i.nodeId, root.id))) continue; // already covered by a bigger incident

    const created = await incidents.createSensorIncident(root, houses, { extended: classification.extended }, ctx);
    for (const child of stillOpen.filter((i) => isAncestor(idx, root.id, i.nodeId))) {
      await incidents.mergeInto(child, created);
    }
    stillOpen.push(created);
  }

  // Loadshedding flag clears once the node is back on.
  const recovered = idx.nodes.filter((n) => n.state === 'ON' && n.offReason);
  if (recovered.length) await stubs.updateNodes(recovered.map((n) => ({ id: n.id, patch: { offReason: null } })));

  // 4a. Keep priorities and descriptions fresh.
  const freshCtx = await incidents.loadContext();
  for (const incident of await stubs.listIncidents({ open: true })) {
    await incidents.refresh(incident, freshCtx);
  }
}

export const evaluate = () => runExclusive(evaluateNow);

export function tick() {
  return runExclusive(async () => {
    await evaluateNow();
    await assignment.expireStaleOffers();
    await assignment.assignPending();
  });
}

let timer = null;
export function startScheduler(intervalMs = 2000) {
  if (timer) return;
  timer = setInterval(() => {
    tick().catch((err) => console.error('[grid tick failed]', err));
  }, intervalMs);
}
