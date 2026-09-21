// Everything a technician does with a job: accept, decline, travel, start, pause, resume, close.
import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { PAUSE_REASONS } from '../config/constants.js';
import { badRequest, forbidden, notFound } from '../utils/errors.js';
import { haversine, etaMinutes } from '../utils/geo.js';
import { nowIso } from '../utils/time.js';
import { runExclusive } from '../utils/lock.js';
import * as assignment from './assignmentService.js';
import * as incidents from './incidentService.js';
import * as notifications from './notificationService.js';
import * as audit from './auditService.js';
import * as views from './viewService.js';
import * as technicians from './technicianService.js';

async function load(user, jobId) {
  const job = await stubs.findJobById(jobId);
  if (!job) throw notFound('Job not found');
  if (job.technicianId !== user.id) throw forbidden('This job is not assigned to you');
  const incident = await stubs.findIncidentById(job.incidentId);
  if (!incident) throw notFound('Incident not found');
  return { job, incident };
}

const requireState = (job, states, action) => {
  if (!states.includes(job.state)) throw badRequest(`You cannot ${action} a job that is ${job.state}`);
};
const requireStatus = (incident, statuses, action) => {
  if (!statuses.includes(incident.status)) throw badRequest(`You cannot ${action} while the incident is ${incident.status.replace('_', ' ')}`);
};

const detail = async (user, jobId) => {
  const { job, incident } = await load(user, jobId);
  return views.technicianJob(job, incident, await views.loadRefs());
};

export async function listMine(user) {
  const jobs = await stubs.listJobs({ technicianId: user.id });
  const rows = await Promise.all(jobs.map(async (job) => ({ job, incident: await stubs.findIncidentById(job.incidentId) })));
  const summaries = rows.filter((r) => r.incident).map((r) => views.technicianSummary(r.job, r.incident));
  const live = summaries.filter((j) => ['pending', 'accepted'].includes(j.state));
  const inProgress = ['en_route', 'arrived', 'working', 'paused'];
  const rank = (j) => (inProgress.includes(j.status) ? 0 : j.state === 'accepted' ? 1 : 2);
  const priorityRank = { critical: 0, high: 1, medium: 2, low: 3 };
  live.sort((a, b) => rank(a) - rank(b) || priorityRank[a.priorityLevel] - priorityRank[b.priorityLevel]);
  const history = summaries
    .filter((j) => ['closed', 'cancelled'].includes(j.state))
    .sort((a, b) => new Date(b.closedAt ?? b.resolvedAt ?? b.offeredAt) - new Date(a.closedAt ?? a.resolvedAt ?? a.offeredAt));
  return { current: live[0] ?? null, queue: live.slice(1), history };
}

export const get = detail;

export async function accept(user, jobId) {
  const { job, incident } = await load(user, jobId);
  requireState(job, ['pending'], 'accept');
  await stubs.updateJob(job.id, { state: 'accepted', acceptedAt: nowIso() });
  await stubs.recordIncidentEvent(incident.id, { type: 'accepted', actor: user.name, message: `${user.name} accepted the job` });
  return detail(user, jobId);
}

export async function decline(user, jobId, reason) {
  const text = String(reason ?? '').trim();
  if (!text) throw badRequest('Please give a reason for declining the job');
  await runExclusive(async () => {
    const { job, incident } = await load(user, jobId);
    requireState(job, ['pending', 'accepted'], 'decline');
    requireStatus(incident, ['dispatched'], 'decline');
    await assignment.returnToQueue(job, incident, text, user.name);
    await audit.log(user, 'decline_job', 'incident', incident.id, `${user.name} declined ${job.id}`, text);
    await assignment.assignPending();
  });
  return { declined: true };
}

export async function startTravel(user, jobId) {
  const { job, incident } = await load(user, jobId);
  requireState(job, ['accepted'], 'start travelling on');
  if (incident.status === 'en_route') return detail(user, jobId);
  requireStatus(incident, ['dispatched'], 'start travelling');
  const [tech, site] = [await stubs.findUserById(user.id), await stubs.findNodeById(incident.nodeId)];
  const eta = etaMinutes(haversine(tech.tech, site), config.avgSpeedKmh);
  const updated = await stubs.recordIncidentEvent(
    incident.id,
    { type: 'en_route', actor: user.name, message: `${user.name} left for the site (ETA ${eta} min)` },
    { status: 'en_route', departedAt: nowIso(), etaMinutes: eta, nearbyNotified: false },
  );
  await notifications.notifyStatus(updated, 'en_route', { techName: user.name, eta });
  return detail(user, jobId);
}

// Arriving and starting work are one step in the prototype.
export async function startJob(user, jobId) {
  const { job, incident } = await load(user, jobId);
  requireState(job, ['accepted'], 'start');
  requireStatus(incident, ['dispatched', 'en_route'], 'start the job');
  const now = nowIso();
  await stubs.recordIncidentEvent(incident.id, { type: 'arrived', actor: user.name, message: `${user.name} arrived on site` }, { arrivedAt: now });
  const updated = await stubs.recordIncidentEvent(
    incident.id,
    { type: 'working', actor: user.name, message: 'Work started' },
    { status: 'working', startedAt: now, etaMinutes: null },
  );
  await notifications.notifyStatus(updated, 'arrived', { techName: user.name });
  return detail(user, jobId);
}

export async function pause(user, jobId, reason) {
  const { job, incident } = await load(user, jobId);
  requireState(job, ['accepted'], 'pause');
  requireStatus(incident, ['working'], 'pause');
  const match = PAUSE_REASONS.find((r) => r.value === reason);
  if (!match) throw badRequest('Please choose a reason for pausing the job');
  const updated = await stubs.recordIncidentEvent(
    incident.id,
    { type: 'paused', actor: user.name, message: `Paused: ${match.label}`, reason: match.value },
    { status: 'paused', pausedReason: match.value, pauseCount: (incident.pauseCount ?? 0) + 1 },
  );
  await notifications.notifyStatus(updated, 'paused', { reason: match.value });
  return detail(user, jobId);
}

export async function resume(user, jobId) {
  const { job, incident } = await load(user, jobId);
  requireState(job, ['accepted'], 'resume');
  requireStatus(incident, ['paused'], 'resume');
  const updated = await stubs.recordIncidentEvent(incident.id, { type: 'resumed', actor: user.name, message: 'Work resumed' }, { status: 'working', pausedReason: null });
  await notifications.notifyStatus(updated, 'resumed', { techName: user.name });
  return detail(user, jobId);
}

export async function close(user, jobId, body) {
  const { job, incident } = await load(user, jobId);
  requireState(job, ['accepted'], 'close');
  requireStatus(incident, ['arrived', 'working', 'paused'], 'close the job');
  if (!body.workDone) throw badRequest('Tick the box to confirm the work is done');
  const faultCause = String(body.faultCause ?? '').trim();
  if (!faultCause) throw badRequest('Please describe the cause of the fault');
  const photoIds = [];
  for (const photo of (body.photos ?? []).slice(0, 6)) photoIds.push(await stubs.savePhoto(photo));
  const closure = {
    workDone: true,
    partsUsed: String(body.partsUsed ?? '').trim(),
    faultCause,
    notes: String(body.notes ?? '').trim(),
    photoIds,
    closedAt: nowIso(),
  };
  await stubs.updateJob(job.id, { state: 'closed', closure });
  await incidents.resolve(incident, {
    by: user.name,
    resolution: { faultCause, partsUsed: closure.partsUsed, notes: closure.notes, resolvedBy: user.name, photoIds, auto: false },
  });
  return { closed: true, stats: await technicians.stats(user.id) };
}
