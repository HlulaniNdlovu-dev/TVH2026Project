// Matches verified incidents with technicians: closest, least busy, on duty and qualified.
import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { haversine } from '../utils/geo.js';
import { nowIso, secondsSince } from '../utils/time.js';
import * as notifications from './notificationService.js';
import * as audit from './auditService.js';

const OPEN_JOB_STATES = ['pending', 'accepted'];

async function openJobCounts() {
  const jobs = await stubs.listJobs({ states: OPEN_JOB_STATES });
  const counts = new Map();
  jobs.forEach((j) => counts.set(j.technicianId, (counts.get(j.technicianId) ?? 0) + 1));
  return counts;
}

export async function pickTechnician(incident, node, excludeIds = []) {
  const [techs, counts] = await Promise.all([stubs.listUsers({ role: 'technician' }), openJobCounts()]);
  const scored = techs
    .filter((t) => t.tech.dutyStatus === 'available' && !excludeIds.includes(t.id))
    .map((t) => {
      const open = counts.get(t.id) ?? 0;
      const distanceKm = (haversine(t.tech, node) ?? 0) / 1000;
      const qualified = t.tech.skills.includes(incident.nodeType);
      const score = distanceKm + open * 6 + (qualified ? 0 : 12);
      return { tech: t, open, distanceKm, qualified, score };
    })
    .filter((c) => c.open < config.maxOpenJobsPerTechnician)
    .sort((a, b) => a.score - b.score);
  const best = scored[0];
  if (!best) return null;
  const reasoning = `${best.distanceKm.toFixed(1)} km away, ${best.open} open job(s), ${best.qualified ? `qualified for ${incident.nodeType} faults` : 'no matching skill (best available)'}`;
  return { tech: best.tech, reasoning };
}

export async function assign(incident, tech, { actor = null, reasoning = null, reason = null } = {}) {
  const now = nowIso();
  const job = await stubs.createJob({
    incidentId: incident.id, technicianId: tech.id, state: 'pending', offeredAt: now,
    acceptedAt: null, declineReason: null, closure: null, cancelReason: null,
    assignedBy: actor?.name ?? 'System (auto-assign)', reasoning,
  });
  const message = actor ? `Assigned to ${tech.name} by ${actor.name}` : `Auto-assigned to ${tech.name} (${reasoning})`;
  const updated = await stubs.recordIncidentEvent(
    incident.id,
    { type: 'dispatched', actor: actor?.name ?? 'system', message, reason },
    {
      status: 'dispatched', technicianId: tech.id, jobId: job.id, dispatchedAt: now,
      etaMinutes: null, departedAt: null, arrivedAt: null, startedAt: null, pausedReason: null, nearbyNotified: false,
    },
  );
  await notifications.notifyStatus(updated, 'dispatched', { employeeId: tech.employeeId });
  return job;
}

// Frees the technician from an incident (job cancelled or declined) and clears the incident's assignment.
export async function releaseJob(incident, reason, { cancel = false } = {}) {
  if (incident.jobId) {
    await stubs.updateJob(incident.jobId, { state: cancel ? 'cancelled' : 'declined', cancelReason: reason });
  }
  await stubs.updateIncident(incident.id, { technicianId: null, jobId: null });
}

// Technician declined (or did not answer): put the incident back in the queue and exclude them next time.
export async function returnToQueue(job, incident, reason, actorName) {
  await stubs.updateJob(job.id, { state: 'declined', declineReason: reason });
  const declinedBy = [...new Set([...(incident.declinedBy ?? []), job.technicianId])];
  await stubs.recordIncidentEvent(
    incident.id,
    { type: 'declined', actor: actorName, message: `${actorName} declined the job`, reason },
    { status: 'verified', technicianId: null, jobId: null, declinedBy, etaMinutes: null },
  );
}

// Manual reassignment by an admin, with a reason for the audit trail.
export async function reassign(incident, tech, actor, reason) {
  const previous = incident.technicianId ? await stubs.findUserById(incident.technicianId) : null;
  if (incident.jobId) await stubs.updateJob(incident.jobId, { state: 'cancelled', cancelReason: `Reassigned by ${actor.name}: ${reason}` });
  const fresh = await stubs.findIncidentById(incident.id);
  await stubs.updateIncident(incident.id, { technicianId: null, jobId: null });
  const job = await assign({ ...fresh, technicianId: null, jobId: null }, tech, { actor, reason });
  await audit.log(actor, previous ? 'reassign' : 'manual_assign', 'incident', incident.id, previous ? `${previous.name} -> ${tech.name}` : `Assigned to ${tech.name}`, reason);
  return job;
}

// Works through waiting incidents from most to least urgent.
export async function assignPending() {
  const waiting = (await stubs.listIncidents({ statuses: ['verified'] })).filter((i) => !i.technicianId);
  waiting.sort((a, b) => (b.priority?.effective ?? 0) - (a.priority?.effective ?? 0));
  let assigned = 0;
  for (const incident of waiting) {
    const node = await stubs.findNodeById(incident.nodeId);
    if (!node) continue;
    const match = await pickTechnician(incident, node, incident.declinedBy ?? []);
    if (!match) continue;
    await assign(incident, match.tech, { reasoning: match.reasoning });
    assigned += 1;
  }
  return assigned;
}

// Offers nobody answered go to the next technician.
export async function expireStaleOffers() {
  const pending = await stubs.listJobs({ states: ['pending'] });
  for (const job of pending) {
    if (secondsSince(job.offeredAt) < config.offerTimeoutSeconds) continue;
    const incident = await stubs.findIncidentById(job.incidentId);
    const tech = await stubs.findUserById(job.technicianId);
    if (incident && tech) await returnToQueue(job, incident, 'No response to the job offer', tech.name);
  }
}
