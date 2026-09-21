import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { REPORT_CATEGORIES } from '../config/constants.js';
import { nowIso } from '../utils/time.js';
import { indexNodes, housesUnder, descendantsOf } from './topologyService.js';
import { computePriority } from './priorityService.js';
import * as notifications from './notificationService.js';
import * as assignment from './assignmentService.js';
import * as audit from './auditService.js';

export const CATEGORY_LABELS = {
  ...Object.fromEntries(REPORT_CATEGORIES.map((c) => [c.value, c.label.replace(/ \(dangerous\)/, '')])),
  transformer_fault: 'Transformer fault',
  substation_fault: 'Substation fault',
};

// Shared lookups so a whole tick only loads the grid and users once.
export async function loadContext() {
  const [nodes, users] = await Promise.all([stubs.listNodes(), stubs.listUsers()]);
  return { idx: indexNodes(nodes), usersById: new Map(users.map((u) => [u.id, u])) };
}

const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

// The description the technician sees. It is generated from sensor data and citizen reports.
function buildDescription(incident, idx, reports, houses) {
  const root = idx.byId.get(incident.nodeId);
  const parent = root?.parentId ? idx.byId.get(root.parentId) : null;
  const lines = [];
  if (incident.sensorConfirmed && root) {
    const when = incident.timeline?.[0]?.ts ?? incident.createdAt;
    if (root.type === 'substation') {
      lines.push(`Sensors detected loss of supply at ${fmtTime(when)}. ${root.name} is not reporting power and ${houses.length} downstream customer(s) are off. Likely an area-wide supply or feeder fault.`);
    } else if (root.type === 'transformer') {
      lines.push(`Sensors detected loss of supply at ${fmtTime(when)}. ${root.name} is not reporting power while ${parent?.name ?? 'its substation'} is operational. ${houses.length} customer(s) on this block are off. Likely a transformer or low-voltage feeder fault.`);
    } else {
      lines.push(`Sensors detected loss of supply at ${fmtTime(when)}. Meter ${root.meterNumber} is off while its transformer (${parent?.name ?? 'unknown'}) is operational. Likely a fault at the property or its service connection.`);
    }
  } else {
    lines.push('Reported by citizens and not yet confirmed by sensors.');
    if (root?.type === 'house' && root.state === 'ON') {
      lines.push('The meter sensor still shows power at the property, so this may be an internal fault (for example a tripped breaker).');
    }
  }
  if (reports.length) {
    const labels = [...new Set(reports.map((r) => CATEGORY_LABELS[r.category] ?? r.category))];
    lines.push(`${reports.length} citizen report(s) received: ${labels.join(', ')}.`);
  }
  if (incident.criticalFacilities?.length) lines.push(`Critical facility affected: ${incident.criticalFacilities.join(', ')}.`);
  if (incident.danger) lines.push('SAFETY WARNING: a downed line or sparking equipment was reported. Treat the site as live and isolate before approaching.');
  if (incident.extendedLoadshedding) lines.push('This outage continued after the scheduled loadshedding window ended, so it is being treated as a fault.');
  return lines.join(' ');
}

// Recalculates affected customers, priority and description. Called every tick for open incidents.
export async function refresh(incident, ctx) {
  const { idx, usersById } = ctx;
  const root = idx.byId.get(incident.nodeId);
  if (!root) return incident;
  const affected = new Set(incident.affectedNodeIds);
  if (incident.sensorConfirmed) housesUnder(idx, root.id).filter((h) => h.state === 'OFF').forEach((h) => affected.add(h.id));
  const houses = [...affected].map((id) => idx.byId.get(id)).filter(Boolean);
  const reports = await stubs.listReports({ incidentId: incident.id });
  const criticalFacilities = houses.filter((h) => h.critical).map((h) => h.critical);
  const vulnerableCount = houses.filter((h) => usersById.get(h.ownerId)?.medical).length;
  const draft = { ...incident, affectedNodeIds: [...affected], criticalFacilities };
  const priority = computePriority(draft, { customers: houses.length, criticalCount: criticalFacilities.length, vulnerableCount, reports });
  return stubs.updateIncident(incident.id, {
    affectedNodeIds: [...affected],
    affectedCount: houses.length,
    criticalFacilities,
    vulnerableCount,
    reportCount: reports.length,
    priority,
    description: buildDescription(draft, idx, reports, houses),
  });
}

const baseIncident = (extra) => ({
  danger: false, affectedCount: 0, criticalFacilities: [], vulnerableCount: 0,
  reportIds: [], reporterIds: [], reportCount: 0,
  technicianId: null, jobId: null, declinedBy: [],
  etaMinutes: null, departedAt: null, arrivedAt: null, startedAt: null, pausedReason: null, pauseCount: 0, nearbyNotified: false,
  dispatchedAt: null, resolvedAt: null, resolution: null, priority: {}, override: null, extendedLoadshedding: false,
  description: '', mergedInto: null,
  ...extra,
});

export async function createSensorIncident(root, houses, { extended = false } = {}, ctx) {
  const startedAt = root.offSince ?? nowIso();
  const created = await stubs.createIncident(
    baseIncident({
      nodeId: root.id,
      nodeType: root.type,
      area: root.area,
      category: root.type === 'house' ? 'no_power' : `${root.type}_fault`,
      source: 'sensor',
      sensorConfirmed: true,
      status: 'verified',
      affectedNodeIds: houses.map((h) => h.id),
      affectedCount: houses.length,
      extendedLoadshedding: extended,
      createdAt: startedAt,
      verifiedAt: nowIso(),
      timeline: [
        { ts: startedAt, type: 'created', actor: 'system', message: `Outage detected by sensors at ${root.name}` },
        { ts: nowIso(), type: 'verified', actor: 'system', message: extended ? 'Outage extended beyond the loadshedding schedule; treated as a fault' : 'Confirmed by sensor data' },
      ],
    }),
  );
  const refreshed = await refresh(created, ctx);
  await notifications.notifyStatus(refreshed, 'detected');
  return refreshed;
}

export async function createCitizenIncident(node, { category, danger, reporterName }, ctx) {
  const now = nowIso();
  const created = await stubs.createIncident(
    baseIncident({
      nodeId: node.id,
      nodeType: node.type,
      area: node.area,
      category,
      source: 'citizen',
      sensorConfirmed: false,
      danger,
      status: danger ? 'verified' : 'reported',
      affectedNodeIds: [node.id],
      affectedCount: 1,
      createdAt: now,
      verifiedAt: danger ? now : null,
      timeline: [
        { ts: now, type: 'created', actor: reporterName, message: `Citizen report received (${CATEGORY_LABELS[category] ?? category})` },
        ...(danger ? [{ ts: now, type: 'verified', actor: 'system', message: 'Safety hazard reported: verified automatically' }] : []),
      ],
    }),
  );
  return refresh(created, ctx);
}

export async function verify(incident, actor, note = 'Verified by admin') {
  if (incident.status !== 'reported') return incident;
  const updated = await stubs.recordIncidentEvent(incident.id, { type: 'verified', actor: actor?.name ?? 'system', message: note }, { status: 'verified', verifiedAt: nowIso() });
  if (actor) await audit.log(actor, 'verify_incident', 'incident', incident.id, note);
  await notifications.notifyStatus(updated, 'verified');
  return updated;
}

// Closes an incident. `auto` means sensors reported power back before/without a technician closing it.
export async function resolve(incident, { by, auto = false, resolution = null }) {
  const now = nowIso();
  const updated = await stubs.recordIncidentEvent(
    incident.id,
    { type: 'resolved', actor: by, message: auto ? 'Power restored: sensors confirm supply is back' : 'Job closed and power restored' },
    {
      status: 'resolved',
      resolvedAt: now,
      pausedReason: null,
      resolution: resolution ?? { faultCause: 'Power restored without intervention', partsUsed: '', notes: '', resolvedBy: by, auto: true },
    },
  );
  const nodes = await stubs.listNodes();
  const idx = indexNodes(nodes);
  if (auto) {
    await assignment.releaseJob(incident, 'Power restored automatically', { cancel: true });
  } else if (incident.sensorConfirmed) {
    // Ask the simulator to bring the repaired equipment back online and keep sensors from re-raising it meanwhile.
    const grace = new Date(Date.now() + config.graceSeconds * 1000).toISOString();
    const affected = [incident.nodeId, ...descendantsOf(idx, incident.nodeId).map((n) => n.id)];
    await stubs.updateNodes(affected.map((id) => ({ id, patch: { graceUntil: grace } })));
    await stubs.pushCommand({ type: 'restore', nodeId: incident.nodeId, incidentId: incident.id });
  }
  await notifications.notifyStatus(updated, 'resolved');
  return updated;
}

// A bigger fault swallows smaller ones under it (house incident + its transformer fails = one transformer incident).
export async function mergeInto(child, target) {
  const reports = await stubs.listReports({ incidentId: child.id });
  for (const r of reports) {
    await stubs.updateReport(r.id, { incidentId: target.id });
    await stubs.attachReportToIncident(target.id, r.id, r.userId);
  }
  await assignment.releaseJob(child, `Merged into ${target.id}`, { cancel: true });
  await stubs.recordIncidentEvent(child.id, { type: 'merged', message: `Merged into ${target.id}` }, { status: 'merged', mergedInto: target.id });
  await stubs.recordIncidentEvent(target.id, { type: 'note', message: `Incident ${child.id} merged into this one` });
}

export async function setOverride(incident, actor, level, reason) {
  const override = { level, reason, by: actor.name, at: nowIso() };
  await stubs.recordIncidentEvent(incident.id, { type: 'priority_override', actor: actor.name, message: `Priority set to ${level.toUpperCase()}`, reason }, { override });
  await audit.log(actor, 'priority_override', 'incident', incident.id, `Priority overridden to ${level}`, reason);
}

export async function clearOverride(incident, actor, reason) {
  await stubs.recordIncidentEvent(incident.id, { type: 'priority_override', actor: actor.name, message: 'Priority override removed', reason }, { override: null });
  await audit.log(actor, 'priority_override_removed', 'incident', incident.id, 'Priority override removed', reason);
}
