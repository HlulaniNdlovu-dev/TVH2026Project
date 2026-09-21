import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { PRIORITY_LEVELS } from '../config/constants.js';
import { badRequest, notFound } from '../utils/errors.js';
import { minutesBetween, nowIso, secondsSince } from '../utils/time.js';
import { runExclusive } from '../utils/lock.js';
import * as incidentService from './incidentService.js';
import * as assignment from './assignmentService.js';
import * as loadshedding from './loadsheddingService.js';
import * as views from './viewService.js';

const isOnline = (node) => secondsSince(node.lastHeartbeat) <= config.sensorOfflineSeconds;
const average = (values) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);

async function techActivity() {
  const [techs, open, jobs] = await Promise.all([stubs.listUsers({ role: 'technician' }), stubs.listIncidents({ open: true }), stubs.listJobs({ states: ['pending', 'accepted'] })]);
  return techs.map((t) => {
    const mine = open.filter((i) => i.technicianId === t.id);
    const active = mine.find((i) => ['en_route', 'arrived', 'working', 'paused'].includes(i.status));
    const offered = mine.find((i) => i.status === 'dispatched');
    let activity = 'Idle';
    if (active) activity = { en_route: 'En route', arrived: 'On site', working: 'Working', paused: 'Paused' }[active.status];
    else if (offered) activity = 'Job offered';
    else if (t.tech.dutyStatus === 'unavailable') activity = 'Unavailable';
    return { tech: t, active, activity, openJobs: jobs.filter((j) => j.technicianId === t.id).length };
  });
}

export async function overview() {
  const [nodes, open, all, techs] = await Promise.all([stubs.listNodes(), stubs.listIncidents({ open: true }), stubs.listIncidents({ statuses: ['resolved'] }), techActivity()]);
  const refs = await views.loadRefs();
  const houses = nodes.filter((n) => n.type === 'house');
  const off = houses.filter((h) => h.state === 'OFF');
  const dispatchable = open.filter((i) => i.status !== 'reported');
  const unassignedUrgent = dispatchable.filter((i) => !i.technicianId && ['critical', 'high'].includes(i.priority?.level));
  const slaBreaches = open.filter((i) => {
    const waiting = i.verifiedAt ? minutesBetween(i.verifiedAt, nowIso()) : 0;
    return (['critical', 'high'].includes(i.priority?.level) && !i.technicianId && i.status === 'verified' && waiting > 5) || minutesBetween(i.createdAt, nowIso()) > 240;
  });
  const now = new Date();
  const loadsheddingAreas = [];
  for (const area of [...new Set(nodes.map((n) => n.area))]) {
    const w = await loadshedding.windowAt(area, now);
    if (w) loadsheddingAreas.push({ area, stage: w.stage, until: w.end });
  }
  const recentEvents = open
    .flatMap((i) => i.timeline.slice(-3).map((e) => ({ ...e, incidentId: i.id })))
    .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    .slice(0, 8);
  return {
    kpis: {
      activeIncidents: open.filter((i) => i.status !== 'reported' || i.sensorConfirmed).length,
      pendingReports: open.filter((i) => i.status === 'reported' && !i.sensorConfirmed).length,
      customersWithoutPower: off.filter((h) => h.offReason !== 'loadshedding').length,
      customersInLoadshedding: off.filter((h) => h.offReason === 'loadshedding').length,
      totalCustomers: houses.length,
      avgResponseMinutes: average(all.filter((i) => i.arrivedAt).map((i) => minutesBetween(i.createdAt, i.arrivedAt))),
      avgResolutionMinutes: average(all.filter((i) => i.resolvedAt).map((i) => minutesBetween(i.createdAt, i.resolvedAt))),
      slaBreaches: slaBreaches.length,
      unassignedUrgent: unassignedUrgent.length,
      techniciansAvailable: techs.filter((t) => t.activity === 'Idle' || t.activity === 'Job offered').length,
      techniciansBusy: techs.filter((t) => ['En route', 'On site', 'Working', 'Paused'].includes(t.activity)).length,
      techniciansUnavailable: techs.filter((t) => t.activity === 'Unavailable').length,
      sensorsOffline: nodes.filter((n) => !isOnline(n)).length,
      sensorsTotal: nodes.length,
    },
    loadsheddingAreas,
    queue: open
      .filter((i) => i.status !== 'reported' || i.sensorConfirmed || i.danger)
      .sort((a, b) => (b.priority?.effective ?? 0) - (a.priority?.effective ?? 0))
      .slice(0, 6)
      .map((i) => views.adminIncidentSummary(i, refs)),
    recentEvents,
  };
}

export async function grid() {
  const [nodes, open, techs] = await Promise.all([stubs.listNodes(), stubs.listIncidents({ open: true }), techActivity()]);
  const refs = await views.loadRefs();
  return {
    nodes: nodes.map((n) => ({
      id: n.id, type: n.type, name: n.name, parentId: n.parentId, area: n.area, lat: n.lat, lng: n.lng, state: n.state, watts: n.watts,
      offReason: n.offReason, online: isOnline(n), meterNumber: n.meterNumber ?? null, critical: n.critical ?? null, lastHeartbeat: n.lastHeartbeat,
    })),
    incidents: open.map((i) => views.adminIncidentSummary(i, refs)),
    technicians: techs.map(({ tech, activity }) => ({ id: tech.id, name: tech.name, lat: tech.tech.lat, lng: tech.tech.lng, activity })),
  };
}

export async function listIncidents({ status } = {}) {
  const refs = await views.loadRefs();
  const list = await stubs.listIncidents(status === 'open' ? { open: true } : status && status !== 'all' ? { statuses: [status] } : {});
  return list.map((i) => views.adminIncidentSummary(i, refs)).sort((a, b) => b.priority.effective - a.priority.effective || new Date(b.createdAt) - new Date(a.createdAt));
}

async function getIncident(id) {
  const incident = await stubs.findIncidentById(id);
  if (!incident) throw notFound('Incident not found');
  return incident;
}

export async function incidentDetail(id) {
  return views.adminIncidentDetail(await getIncident(id), await views.loadRefs());
}

export async function verifyIncident(actor, id) {
  const incident = await getIncident(id);
  await incidentService.verify(incident, actor, `Verified by ${actor.name}`);
  return incidentDetail(id);
}

export async function overridePriority(actor, id, { level, reason }) {
  const incident = await getIncident(id);
  if (level === 'clear') {
    if (!incident.override) throw badRequest('There is no override to remove');
    await incidentService.clearOverride(incident, actor, String(reason ?? '').trim() || 'Override removed');
  } else {
    if (!PRIORITY_LEVELS.includes(level)) throw badRequest('Choose a priority level');
    if (!String(reason ?? '').trim()) throw badRequest('A reason is required to override the priority');
    await incidentService.setOverride(incident, actor, level, String(reason).trim());
  }
  await incidentService.refresh(await getIncident(id), await incidentService.loadContext());
  return incidentDetail(id);
}

export async function assignTechnician(actor, id, { technicianId, reason }) {
  if (!String(reason ?? '').trim()) throw badRequest('Please give a reason for the assignment');
  await runExclusive(async () => {
    const incident = await getIncident(id);
    if (['resolved', 'merged'].includes(incident.status)) throw badRequest('This incident is already closed');
    const tech = await stubs.findUserById(technicianId);
    if (!tech || tech.role !== 'technician') throw badRequest('Choose a technician');
    if (incident.status === 'reported') await incidentService.verify(incident, actor, `Verified by ${actor.name} when assigning`);
    await assignment.reassign(await getIncident(id), tech, actor, String(reason).trim());
  });
  return incidentDetail(id);
}

export async function dispatchBoard() {
  const refs = await views.loadRefs();
  const open = await stubs.listIncidents({ open: true });
  const techs = await techActivity();
  return {
    unassigned: open
      .filter((i) => !i.technicianId && i.status !== 'reported')
      .sort((a, b) => (b.priority?.effective ?? 0) - (a.priority?.effective ?? 0))
      .map((i) => views.adminIncidentSummary(i, refs)),
    awaitingVerification: open.filter((i) => i.status === 'reported').map((i) => views.adminIncidentSummary(i, refs)),
    technicians: techs.map(({ tech, activity, openJobs, active }) => ({
      id: tech.id, name: tech.name, employeeId: tech.employeeId, dutyStatus: tech.tech.dutyStatus, skills: tech.tech.skills, activity, openJobs, currentIncident: active?.id ?? null,
    })),
  };
}

export async function technicians() {
  const [list, nodes, jobs] = await Promise.all([techActivity(), stubs.listNodes(), stubs.listJobs({ states: ['closed'] })]);
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return list.map(({ tech, active, activity, openJobs }) => {
    const site = active ? nodeById.get(active.nodeId) : null;
    return {
      id: tech.id, name: tech.name, employeeId: tech.employeeId, phone: tech.phone, skills: tech.tech.skills,
      dutyStatus: tech.tech.dutyStatus, activity, openJobs,
      lat: tech.tech.lat, lng: tech.tech.lng, lastLocationAt: tech.tech.lastLocationAt,
      currentIncident: active?.id ?? null,
      route: active && ['en_route'].includes(active.status) && site ? { from: { lat: tech.tech.lat, lng: tech.tech.lng }, to: { lat: site.lat, lng: site.lng }, etaMinutes: active.etaMinutes } : null,
      site: site ? { lat: site.lat, lng: site.lng } : null,
      completedToday: jobs.filter((j) => j.technicianId === tech.id && j.closure && new Date(j.closure.closedAt) >= startOfDay).length,
    };
  });
}

export async function sensors() {
  const [nodes, users] = await Promise.all([stubs.listNodes(), stubs.listUsers()]);
  const owners = new Map(users.map((u) => [u.id, u.name]));
  return nodes.map((n) => ({
    id: n.id, type: n.type, name: n.name, area: n.area, state: n.state, watts: n.watts, battery: n.battery,
    lastHeartbeat: n.lastHeartbeat, online: isOnline(n), flickerCount: n.flickerCount ?? 0, offReason: n.offReason,
    meterNumber: n.meterNumber ?? null, owner: n.ownerId ? owners.get(n.ownerId) ?? null : null,
  }));
}
