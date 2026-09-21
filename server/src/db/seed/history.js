// Generates 30 days of resolved incidents (and their jobs) so analytics and hotspots have something to show.
import { PAUSE_REASONS } from '../../config/constants.js';

function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CAUSES = {
  house: [
    ['Blown fuse in the meter box', 'Fuse 60A, fuse holder'],
    ['Faulty service connection cable', '10m service cable, connectors'],
    ['Overload tripped the main breaker', 'Replacement breaker'],
    ['Meter terminal burnt', 'Meter terminal block'],
  ],
  transformer: [
    ['Transformer overload from illegal connections', 'HV fuses, LV fuses'],
    ['Transformer oil leak and winding fault', 'Transformer oil, gasket kit'],
    ['Cable damaged by vandalism (copper theft)', '25m LV cable, joints'],
    ['Lightning strike on the transformer', 'Surge arrester, HV fuse'],
  ],
  substation: [
    ['Storm damage to overhead line', 'Insulators, 40m conductor'],
    ['Feeder breaker failure', 'Feeder breaker relay'],
  ],
};

export function buildHistory(nodes, users) {
  const rand = rng(7);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const housesUnder = (nodeId) => {
    const n = byId[nodeId];
    if (n.type === 'house') return [n];
    return nodes.filter((h) => h.type === 'house' && (h.parentId === nodeId || byId[h.parentId]?.parentId === nodeId));
  };
  const techs = users.filter((u) => u.role === 'technician');

  const plan = [
    ...Array(8).fill('TR-MAM-2'),
    ...Array(5).fill('TR-EER-1'),
    ...Array(3).fill('H-MAM-1-3'),
  ];
  const houses = nodes.filter((n) => n.type === 'house');
  const transformers = nodes.filter((n) => n.type === 'transformer');
  const subs = nodes.filter((n) => n.type === 'substation');
  while (plan.length < 42) {
    const r = rand();
    plan.push(pick(r < 0.7 ? houses : r < 0.95 ? transformers : subs).id);
  }

  const drafts = plan.map((nodeId) => ({ nodeId, createdAt: Date.now() - (0.3 + rand() * 29.5) * 86400000 }));
  drafts.sort((a, b) => a.createdAt - b.createdAt);

  const incidents = [];
  const jobs = [];
  drafts.forEach((draft, i) => {
    const node = byId[draft.nodeId];
    const affected = housesUnder(node.id);
    const qualified = techs.filter((t) => t.tech.skills.includes(node.type));
    const tech = pick(qualified);
    const [faultCause, partsUsed] = pick(CAUSES[node.type]);
    const min = 60000;
    const created = draft.createdAt;
    const dispatched = created + (1 + rand() * 4) * min;
    const arrived = dispatched + (12 + rand() * (node.type === 'house' ? 25 : 40)) * min;
    const paused = rand() < 0.28;
    const pauseReason = pick(PAUSE_REASONS);
    const pauseLen = paused ? (15 + rand() * 40) * min : 0;
    const workLen = ((node.type === 'house' ? 25 : node.type === 'transformer' ? 70 : 120) + rand() * 50) * min;
    const resolved = arrived + workLen + pauseLen;
    const t = (ms) => new Date(ms).toISOString();
    const score = affected.length * 2 + 20;
    const level = score >= 110 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
    const sensor = rand() < 0.75;
    const id = `INC-${1001 + i}`;
    const jobId = `JOB-${1001 + i}`;

    const timeline = [
      { ts: t(created), type: 'created', actor: 'system', message: sensor ? 'Outage detected by sensors' : 'Citizen report received' },
      { ts: t(created + 30000), type: 'verified', actor: 'system', message: 'Outage verified' },
      { ts: t(dispatched), type: 'dispatched', actor: 'system', message: `Auto-assigned to ${tech.name}` },
      { ts: t(arrived - 8 * min), type: 'en_route', actor: tech.name, message: 'Technician left for the site' },
      { ts: t(arrived), type: 'working', actor: tech.name, message: 'Arrived on site and started work' },
    ];
    if (paused) {
      timeline.push({ ts: t(arrived + 20 * min), type: 'paused', actor: tech.name, message: `Paused: ${pauseReason.label}`, reason: pauseReason.value });
      timeline.push({ ts: t(arrived + 20 * min + pauseLen), type: 'resumed', actor: tech.name, message: 'Work resumed' });
    }
    timeline.push({ ts: t(resolved), type: 'resolved', actor: tech.name, message: 'Job closed and power restored' });

    incidents.push({
      id, nodeId: node.id, nodeType: node.type, area: node.area,
      category: node.type === 'house' ? 'no_power' : node.type === 'transformer' ? 'transformer_fault' : 'substation_fault',
      source: sensor ? 'sensor' : 'citizen', sensorConfirmed: sensor, danger: false, status: 'resolved',
      affectedNodeIds: affected.map((h) => h.id), affectedCount: affected.length,
      criticalFacilities: [], vulnerableCount: 0,
      reportIds: [], reporterIds: [], reportCount: 0,
      technicianId: tech.id, jobId, declinedBy: [],
      etaMinutes: null, departedAt: t(arrived - 8 * min), arrivedAt: t(arrived), startedAt: t(arrived),
      pausedReason: null, pauseCount: paused ? 1 : 0, nearbyNotified: true,
      createdAt: t(created), verifiedAt: t(created + 30000), dispatchedAt: t(dispatched), resolvedAt: t(resolved),
      resolution: { faultCause, partsUsed, notes: 'Supply restored and tested.', resolvedBy: tech.name, auto: false },
      priority: { score, level, breakdown: { customers: affected.length * 2, sensor: 20 } },
      override: null, extendedLoadshedding: false,
      description: `${node.type === 'house' ? 'Meter' : node.name} lost supply. ${affected.length} customer(s) were affected.`,
      timeline, mergedInto: null,
    });
    jobs.push({
      id: jobId, incidentId: id, technicianId: tech.id, state: 'closed',
      offeredAt: t(dispatched), acceptedAt: t(dispatched + 60000), declineReason: null,
      closure: { workDone: true, partsUsed, faultCause, notes: 'Supply restored and tested.', photoIds: [], closedAt: t(resolved) },
      createdAt: t(dispatched),
    });
  });

  const suppressed = [];
  for (let i = 0; i < 14; i += 1) {
    const sub = pick(subs);
    suppressed.push({ id: `SUP-${i + 1}`, ts: new Date(Date.now() - (0.2 + rand() * 29) * 86400000).toISOString(), area: sub.area, nodeId: sub.id });
  }

  return {
    incidents, jobs, suppressed,
    counters: { INC: 1000 + incidents.length, JOB: 1000 + jobs.length, SUP: 100 },
  };
}
