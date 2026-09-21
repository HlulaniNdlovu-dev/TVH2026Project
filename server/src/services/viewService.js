// Shapes stored records into what each kind of user is allowed to see.
// Citizens never receive a technician's location, only their name, stage and ETA.
import * as stubs from '../db/stubs.js';
import { PAUSE_REASONS } from '../config/constants.js';
import { CATEGORY_LABELS } from './incidentService.js';
import { coveringCircle } from '../utils/geo.js';
import { minutesBetween, nowIso } from '../utils/time.js';

const STEP_STATUSES = ['reported', 'verified', 'dispatched', 'en_route', 'arrived', 'working', 'resolved'];
const pauseLabel = (value) => PAUSE_REASONS.find((r) => r.value === value)?.label ?? value ?? null;

export async function loadRefs() {
  const [users, nodes] = await Promise.all([stubs.listUsers(), stubs.listNodes()]);
  return { usersById: new Map(users.map((u) => [u.id, u])), nodesById: new Map(nodes.map((n) => [n.id, n])), nodes };
}

const firstEvent = (incident, type) => incident.timeline.find((e) => e.type === type)?.ts ?? null;

export function citizenIncident(incident, userId, refs) {
  const tech = incident.technicianId ? refs.usersById.get(incident.technicianId) : null;
  const myMeters = incident.affectedNodeIds
    .map((id) => refs.nodesById.get(id))
    .filter((n) => n?.ownerId === userId)
    .map((n) => n.meterNumber);
  return {
    id: incident.id,
    status: incident.status,
    category: CATEGORY_LABELS[incident.category] ?? incident.category,
    area: incident.area,
    danger: incident.danger,
    myMeters,
    reportedByYou: incident.reporterIds.includes(userId),
    createdAt: incident.createdAt,
    resolvedAt: incident.resolvedAt,
    // Citizens only ever see the technician's reference number, never a name (safety).
    technician: tech ? { employeeId: tech.employeeId } : null,
    etaMinutes: incident.status === 'en_route' ? incident.etaMinutes : null,
    departedAt: incident.departedAt,
    pausedReason: incident.status === 'paused' ? pauseLabel(incident.pausedReason) : null,
    steps: STEP_STATUSES.map((status) => ({ status, at: firstEvent(incident, status === 'reported' ? 'created' : status) })),
    resolutionSummary: incident.resolution?.auto ? 'Power was restored automatically.' : incident.resolution?.faultCause ?? null,
  };
}

export function adminIncidentSummary(incident, refs) {
  const node = refs.nodesById.get(incident.nodeId);
  const tech = incident.technicianId ? refs.usersById.get(incident.technicianId) : null;
  return {
    id: incident.id,
    status: incident.status,
    priority: {
      level: incident.priority?.level ?? 'low',
      score: incident.priority?.score ?? 0,
      effective: incident.priority?.effective ?? 0,
      calculatedLevel: incident.priority?.calculatedLevel ?? 'low',
      overridden: Boolean(incident.override),
    },
    area: incident.area,
    nodeId: incident.nodeId,
    nodeName: node ? (node.type === 'house' ? `Meter ${node.meterNumber}` : node.name) : incident.nodeId,
    nodeType: incident.nodeType,
    category: CATEGORY_LABELS[incident.category] ?? incident.category,
    source: incident.source,
    sensorConfirmed: incident.sensorConfirmed,
    danger: incident.danger,
    extendedLoadshedding: incident.extendedLoadshedding,
    affectedCount: incident.affectedCount,
    reportCount: incident.reportCount,
    technician: tech ? { id: tech.id, name: tech.name } : null,
    etaMinutes: incident.etaMinutes,
    createdAt: incident.createdAt,
    resolvedAt: incident.resolvedAt,
    minutesOpen: Math.round(minutesBetween(incident.createdAt, incident.resolvedAt ?? nowIso())),
    lat: node?.lat,
    lng: node?.lng,
  };
}

export async function adminIncidentDetail(incident, refs) {
  const reports = await stubs.listReports({ incidentId: incident.id });
  const job = incident.jobId ? await stubs.findJobById(incident.jobId) : null;
  return {
    ...adminIncidentSummary(incident, refs),
    description: incident.description,
    priorityBreakdown: incident.priority?.breakdown ?? {},
    override: incident.override,
    timeline: incident.timeline,
    resolution: incident.resolution,
    declinedBy: incident.declinedBy.map((id) => refs.usersById.get(id)?.name ?? id),
    pausedReason: pauseLabel(incident.pausedReason),
    criticalFacilities: incident.criticalFacilities,
    reports: reports.map((r) => ({
      id: r.id,
      reporter: refs.usersById.get(r.userId)?.name ?? 'Unknown',
      meterNumber: r.meterNumber,
      category: CATEGORY_LABELS[r.category] ?? r.category,
      description: r.description,
      atProperty: r.trust === 1,
      distanceMeters: r.distanceMeters,
      photoId: r.photoId,
      createdAt: r.createdAt,
    })),
    affectedMeters: incident.affectedNodeIds
      .map((id) => refs.nodesById.get(id))
      .filter(Boolean)
      .map((n) => ({ nodeId: n.id, meterNumber: n.meterNumber, address: n.address, owner: refs.usersById.get(n.ownerId)?.name ?? null, state: n.state, critical: n.critical })),
    job: job ? { id: job.id, state: job.state, assignedBy: job.assignedBy, reasoning: job.reasoning, declineReason: job.declineReason } : null,
  };
}

export async function technicianJob(job, incident, refs) {
  const node = refs.nodesById.get(incident.nodeId);
  const houses = incident.affectedNodeIds.map((id) => refs.nodesById.get(id)).filter(Boolean);
  const reports = await stubs.listReports({ incidentId: incident.id });
  const area = coveringCircle(houses.map((h) => ({ lat: h.lat, lng: h.lng })));
  return {
    id: job.id,
    state: job.state,
    offeredAt: job.offeredAt,
    acceptedAt: job.acceptedAt,
    closure: job.closure,
    cancelReason: job.cancelReason,
    reasoning: job.reasoning,
    incident: {
      id: incident.id,
      status: incident.status,
      priority: { level: incident.priority?.level ?? 'low', score: incident.priority?.score ?? 0, effective: incident.priority?.effective ?? 0 },
      category: CATEGORY_LABELS[incident.category] ?? incident.category,
      nodeType: incident.nodeType,
      area: incident.area,
      description: incident.description,
      danger: incident.danger,
      criticalFacilities: incident.criticalFacilities,
      affectedCount: incident.affectedCount,
      etaMinutes: incident.etaMinutes,
      pausedReason: pauseLabel(incident.pausedReason),
      createdAt: incident.createdAt,
      resolvedAt: incident.resolvedAt,
      timeline: incident.timeline,
    },
    site: node ? { lat: node.lat, lng: node.lng, name: node.type === 'house' ? `Meter ${node.meterNumber}` : node.name, address: node.address ?? `${node.name}, ${node.area}` } : null,
    technicianLocation: refs.usersById.get(job.technicianId)?.tech?.lat != null ? { lat: refs.usersById.get(job.technicianId).tech.lat, lng: refs.usersById.get(job.technicianId).tech.lng } : null,
    affectedArea: area ? { ...area, houses: houses.map((h) => ({ lat: h.lat, lng: h.lng })) } : null,
    reports: reports.slice(0, 5).map((r) => ({ category: CATEGORY_LABELS[r.category] ?? r.category, description: r.description, photoId: r.photoId, at: r.createdAt })),
  };
}

export const technicianSummary = (job, incident) => ({
  id: job.id,
  state: job.state,
  incidentId: incident.id,
  status: incident.status,
  priorityLevel: incident.priority?.level ?? 'low',
  category: CATEGORY_LABELS[incident.category] ?? incident.category,
  area: incident.area,
  affectedCount: incident.affectedCount,
  danger: incident.danger,
  etaMinutes: incident.etaMinutes,
  pausedReason: pauseLabel(incident.pausedReason),
  offeredAt: job.offeredAt,
  closedAt: job.closure?.closedAt ?? null,
  faultCause: job.closure?.faultCause ?? null,
  partsUsed: job.closure?.partsUsed ?? null,
  notes: job.closure?.notes ?? null,
  cancelReason: job.cancelReason ?? null,
  startedAt: incident.startedAt,
  resolvedAt: incident.resolvedAt,
});
