// Insights for the admin: response times, hotspots, recurring faults, delay reasons, technician performance.
import * as stubs from '../db/stubs.js';
import { FAULT_CAUSE_KEYWORDS, PAUSE_REASONS } from '../config/constants.js';
import { minutesBetween } from '../utils/time.js';

const average = (values) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);
const DAY = 86400000;

function causeCategory(text = '') {
  const lower = text.toLowerCase();
  const hit = FAULT_CAUSE_KEYWORDS.find(([, words]) => words.some((w) => lower.includes(w)));
  return hit ? hit[0] : 'Other';
}

const countBy = (items, keyFn) => {
  const map = new Map();
  items.forEach((item) => map.set(keyFn(item), (map.get(keyFn(item)) ?? 0) + 1));
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
};

export async function summary() {
  const [all, nodes, users, suppressed] = await Promise.all([stubs.listIncidents({}), stubs.listNodes(), stubs.listUsers({ role: 'technician' }), stubs.listSuppressed()]);
  const since = Date.now() - 30 * DAY;
  const recent = all.filter((i) => new Date(i.createdAt).getTime() >= since);
  const resolved = recent.filter((i) => i.status === 'resolved');
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const trend = [];
  for (let d = 13; d >= 0; d -= 1) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setTime(start.getTime() - d * DAY);
    const end = start.getTime() + DAY;
    const dayItems = recent.filter((i) => new Date(i.createdAt).getTime() >= start.getTime() && new Date(i.createdAt).getTime() < end);
    const dayResolved = dayItems.filter((i) => i.resolvedAt);
    trend.push({
      date: start.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }),
      incidents: dayItems.length,
      avgResolution: average(dayResolved.map((i) => minutesBetween(i.createdAt, i.resolvedAt))),
      avgResponse: average(dayItems.filter((i) => i.arrivedAt).map((i) => minutesBetween(i.createdAt, i.arrivedAt))),
    });
  }

  const hotspots = countBy(recent, (i) => i.nodeId).slice(0, 6).map((h) => ({
    nodeId: h.name,
    name: nodeById.get(h.name)?.type === 'house' ? `Meter ${nodeById.get(h.name)?.meterNumber}` : nodeById.get(h.name)?.name ?? h.name,
    area: nodeById.get(h.name)?.area,
    incidents: h.value,
    recurring: h.value >= 3,
  }));

  const pauses = recent.flatMap((i) => i.timeline.filter((e) => e.type === 'paused'));
  const delayReasons = countBy(pauses, (e) => PAUSE_REASONS.find((r) => r.value === e.reason)?.label ?? 'Other');

  const technicians = users.map((t) => {
    const mine = resolved.filter((i) => i.technicianId === t.id);
    return {
      name: t.name,
      jobs: mine.length,
      avgResponse: average(mine.filter((i) => i.arrivedAt).map((i) => minutesBetween(i.createdAt, i.arrivedAt))),
      avgRepair: average(mine.filter((i) => i.startedAt && i.resolvedAt).map((i) => minutesBetween(i.startedAt, i.resolvedAt))),
    };
  });

  const recentSuppressed = suppressed.filter((s) => new Date(s.ts).getTime() >= since);

  return {
    kpis: {
      incidents30d: recent.length,
      avgResponseMinutes: average(resolved.filter((i) => i.arrivedAt).map((i) => minutesBetween(i.createdAt, i.arrivedAt))),
      avgResolutionMinutes: average(resolved.map((i) => minutesBetween(i.createdAt, i.resolvedAt))),
      firstTimeFixRate: resolved.length ? Math.round((resolved.filter((i) => !i.pauseCount).length / resolved.length) * 100) : null,
      flickerEvents: nodes.reduce((s, n) => s + (n.flickerCount ?? 0), 0),
    },
    trend,
    causes: countBy(resolved.filter((i) => i.resolution), (i) => causeCategory(i.resolution.faultCause)),
    byType: countBy(recent, (i) => ({ house: 'Household', transformer: 'Transformer', substation: 'Substation' }[i.nodeType] ?? i.nodeType)),
    byArea: countBy(recent, (i) => i.area),
    hotspots,
    delayReasons,
    technicians,
    loadsheddingVsFaults: [
      { name: 'Genuine faults', value: recent.length },
      { name: 'Loadshedding (no dispatch)', value: recentSuppressed.length },
    ],
    flickerSensors: nodes.filter((n) => n.flickerCount > 0).sort((a, b) => b.flickerCount - a.flickerCount).slice(0, 5).map((n) => ({ name: n.type === 'house' ? `Meter ${n.meterNumber}` : n.name, flickers: n.flickerCount })),
  };
}
