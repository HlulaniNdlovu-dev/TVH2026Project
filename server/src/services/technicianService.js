import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { badRequest } from '../utils/errors.js';
import { haversine, etaMinutes } from '../utils/geo.js';
import { minutesBetween, nowIso } from '../utils/time.js';
import * as notifications from './notificationService.js';

export async function setDuty(techId, dutyStatus) {
  if (!['available', 'unavailable'].includes(dutyStatus)) throw badRequest('Duty status must be "available" or "unavailable"');
  await stubs.updateTechnicianProfile(techId, { dutyStatus });
  return { dutyStatus };
}

export async function stats(techId) {
  const jobs = (await stubs.listJobs({ technicianId: techId, states: ['closed'] })).filter((j) => j.closure);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const incidents = await Promise.all(jobs.map((j) => stubs.findIncidentById(j.incidentId)));
  const durations = incidents.filter((i) => i?.startedAt && i.resolvedAt).map((i) => minutesBetween(i.startedAt, i.resolvedAt));
  return {
    jobsToday: jobs.filter((j) => new Date(j.closure.closedAt) >= startOfDay).length,
    jobsCompleted: jobs.length,
    avgCompletionMinutes: durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null,
  };
}

// Called with GPS pings from the simulator. Keeps the ETA fresh and sends the "nearby" notification.
export async function updateLocation(techId, lat, lng) {
  const tech = await stubs.findUserById(techId);
  if (!tech || tech.role !== 'technician') return;
  await stubs.updateTechnicianProfile(techId, { lat, lng, lastLocationAt: nowIso() });
  const [active] = (await stubs.listIncidents({ technicianId: techId, statuses: ['en_route'] }));
  if (!active) return;
  const site = await stubs.findNodeById(active.nodeId);
  const distance = haversine({ lat, lng }, site);
  const eta = etaMinutes(distance, config.avgSpeedKmh);
  const patch = { etaMinutes: eta };
  if (distance <= 500 && !active.nearbyNotified) {
    patch.nearbyNotified = true;
    await stubs.updateIncident(active.id, patch);
    await notifications.notifyStatus({ ...active, ...patch }, 'nearby', { techName: tech.name });
    return;
  }
  await stubs.updateIncident(active.id, patch);
}
