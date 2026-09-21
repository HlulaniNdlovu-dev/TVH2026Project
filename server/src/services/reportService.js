// Citizen outage reports: validate, weigh, group with related reports and link to an incident.
import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { DANGER_CATEGORIES, REPORT_CATEGORIES } from '../config/constants.js';
import { badRequest } from '../utils/errors.js';
import { haversine } from '../utils/geo.js';
import { runExclusive } from '../utils/lock.js';
import { isAncestor } from './topologyService.js';
import * as incidents from './incidentService.js';
import * as grid from './gridService.js';
import * as loadshedding from './loadsheddingService.js';
import * as notifications from './notificationService.js';
import * as views from './viewService.js';

// An open incident that already covers this meter (its own, or a bigger fault above it).
async function findCovering(node, ctx) {
  const open = await stubs.listIncidents({ open: true });
  return open.find((i) => i.affectedNodeIds.includes(node.id) || i.nodeId === node.id || isAncestor(ctx.idx, i.nodeId, node.id)) ?? null;
}

// Unconfirmed reports from the same transformer are grouped into one incident.
async function findGroupable(node, category, ctx) {
  const open = await stubs.listIncidents({ statuses: ['reported', 'verified'] });
  return open.find((i) => {
    if (i.sensorConfirmed || i.technicianId) return false;
    const other = ctx.idx.byId.get(i.nodeId);
    return other?.parentId === node.parentId && (i.category === category || i.danger);
  }) ?? null;
}

export async function submit(user, body) {
  const category = body.category;
  const description = String(body.description ?? '').trim();
  if (!REPORT_CATEGORIES.some((c) => c.value === category)) throw badRequest('Please choose a category');
  if (!description) throw badRequest('Please describe the problem');
  const meter = user.meters.find((m) => m.meterNumber === body.meterNumber);
  if (!meter) throw badRequest('Please choose one of your meters');
  const node = await stubs.findNodeByMeter(meter.meterNumber);
  if (!node) throw badRequest('That meter is not connected to the grid');

  const danger = DANGER_CATEGORIES.includes(category);
  const here = body.lat != null && body.lng != null ? { lat: Number(body.lat), lng: Number(body.lng) } : null;
  const distanceMeters = here ? Math.round(haversine(here, node)) : null;
  // Someone standing at the property is more credible than someone reporting from elsewhere.
  const trust = distanceMeters != null && distanceMeters <= config.trustRadiusMeters ? 1 : config.remoteReportWeight;
  const photoId = body.photo ? await stubs.savePhoto(body.photo) : null;

  return runExclusive(async () => {
    const report = await stubs.createReport({
      userId: user.id, meterNumber: meter.meterNumber, nodeId: node.id, category, description, photoId,
      lat: here?.lat ?? null, lng: here?.lng ?? null, distanceMeters, trust, incidentId: null, loadshedding: false,
    });

    // Scheduled loadshedding: tell the citizen, do not open an incident (unless it is a safety hazard).
    const window = await loadshedding.windowAt(node.area);
    if (window && !danger) {
      await stubs.updateReport(report.id, { loadshedding: true });
      await notifications.notifyLoadshedding(user.id, null, window);
      return { reportId: report.id, incident: null, loadshedding: window, tip: null };
    }

    let ctx = await incidents.loadContext();
    let incident = await findCovering(node, ctx);

    if (!incident && node.state === 'OFF') {
      // The sensor already agrees with the citizen: skip the flicker debounce.
      await stubs.updateNode(node.id, { forceConfirm: true });
      await grid.evaluateNow();
      await stubs.updateNode(node.id, { forceConfirm: false });
      ctx = await incidents.loadContext();
      incident = await findCovering(node, ctx);
    }

    if (!incident) {
      const group = await findGroupable(node, category, ctx);
      if (group) {
        await stubs.updateIncident(group.id, { affectedNodeIds: [...new Set([...group.affectedNodeIds, node.id])] });
        incident = await stubs.findIncidentById(group.id);
      } else {
        incident = await incidents.createCitizenIncident(node, { category, danger, reporterName: user.name }, ctx);
      }
    }

    await stubs.updateReport(report.id, { incidentId: incident.id });
    incident = await stubs.attachReportToIncident(incident.id, report.id, user.id);
    await stubs.recordIncidentEvent(incident.id, {
      type: 'report',
      actor: user.name,
      message: `Report from ${user.name} (${trust === 1 ? 'at the property' : 'not at the property'}): ${description.slice(0, 80)}`,
    }, danger && !incident.danger ? { danger: true } : {});

    incident = await stubs.findIncidentById(incident.id);
    const distinctReporters = incident.reporterIds.length;
    if (incident.status === 'reported' && (danger || incident.sensorConfirmed || distinctReporters >= 2)) {
      await incidents.verify(incident, null, danger ? 'Safety hazard reported: verified automatically' : 'Verified by multiple independent reports');
    }
    incident = await incidents.refresh(await stubs.findIncidentById(incident.id), await incidents.loadContext());
    await notifications.notifyStatus(incident, 'reported', {}, [user.id]);

    const tip = node.state === 'ON' && !incident.sensorConfirmed
      ? 'Your smart meter still shows power at the property. Please check your distribution board (DB) for a tripped breaker while we look into this.'
      : null;
    return { reportId: report.id, incident: views.citizenIncident(incident, user.id, await views.loadRefs()), loadshedding: null, tip };
  });
}
