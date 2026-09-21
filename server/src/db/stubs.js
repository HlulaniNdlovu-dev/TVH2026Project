// Database stubs.
//
// Every function here is async and returns copies of the data, exactly like a real database driver would.
// Services never touch the in-memory store directly: they call these functions. To move to MySQL later,
// rewrite the bodies of these functions and nothing else needs to change.
import { db, resetStore } from './store.js';
import { config } from '../config/index.js';
import { OPEN_STATUSES } from '../config/constants.js';
import { nextId } from '../utils/id.js';
import { nowIso } from '../utils/time.js';

const wait = () => new Promise((resolve) => setTimeout(resolve, config.dbLatencyMs));
const clone = (value) => (value === undefined ? value : structuredClone(value));

async function run(fn) {
  await wait();
  return clone(fn());
}

const find = (list, id) => list.find((item) => item.id === id);
function patchItem(list, id, patch) {
  const item = find(list, id);
  if (!item) return null;
  Object.assign(item, patch);
  return item;
}

/* ------------------------------ users ------------------------------ */
export const findUserById = (id) => run(() => find(db.users, id) ?? null);
export const findUserByPhone = (phone) => run(() => db.users.find((u) => u.phone === phone) ?? null);
export const findUserByEmail = (email) => run(() => db.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase()) ?? null);
export const listUsers = (filter = {}) => run(() => db.users.filter((u) => !filter.role || u.role === filter.role));
export const createUser = (user) =>
  run(() => {
    const record = { ...user, id: nextId('U'), createdAt: nowIso() };
    db.users.push(record);
    return record;
  });
export const updateUser = (id, patch) => run(() => patchItem(db.users, id, patch));
export const updateTechnicianProfile = (id, patch) =>
  run(() => {
    const user = find(db.users, id);
    if (!user) return null;
    user.tech = { ...user.tech, ...patch };
    return user;
  });

/* ------------------------------ grid nodes ------------------------------ */
export const listNodes = () => run(() => db.nodes);
export const findNodeById = (id) => run(() => find(db.nodes, id) ?? null);
export const findNodeByMeter = (meterNumber) => run(() => db.nodes.find((n) => n.meterNumber === meterNumber) ?? null);
export const createNode = (node) =>
  run(() => {
    const record = { ...node, id: nextId('H') };
    db.nodes.push(record);
    return record;
  });
export const updateNode = (id, patch) => run(() => patchItem(db.nodes, id, patch));
export const updateNodes = (updates) =>
  run(() => {
    updates.forEach(({ id, patch }) => patchItem(db.nodes, id, patch));
    return true;
  });

/* ------------------------------ incidents ------------------------------ */
export const listIncidents = (filter = {}) =>
  run(() =>
    db.incidents.filter((i) => {
      if (filter.open && !OPEN_STATUSES.includes(i.status)) return false;
      if (filter.statuses && !filter.statuses.includes(i.status)) return false;
      if (filter.technicianId && i.technicianId !== filter.technicianId) return false;
      if (filter.nodeId && i.nodeId !== filter.nodeId) return false;
      if (filter.area && i.area !== filter.area) return false;
      return i.status !== 'merged' || filter.includeMerged;
    }),
  );
export const findIncidentById = (id) => run(() => find(db.incidents, id) ?? null);
export const createIncident = (incident) =>
  run(() => {
    const record = { ...incident, id: nextId('INC') };
    db.incidents.push(record);
    return record;
  });
export const updateIncident = (id, patch) => run(() => patchItem(db.incidents, id, patch));
// Adds a timeline entry and applies field changes in one step.
export const recordIncidentEvent = (id, event, patch = {}) =>
  run(() => {
    const incident = find(db.incidents, id);
    if (!incident) return null;
    Object.assign(incident, patch);
    incident.timeline.push({ ts: nowIso(), actor: 'system', ...event });
    return incident;
  });
export const attachReportToIncident = (incidentId, reportId, userId) =>
  run(() => {
    const incident = find(db.incidents, incidentId);
    if (!incident) return null;
    if (!incident.reportIds.includes(reportId)) incident.reportIds.push(reportId);
    if (!incident.reporterIds.includes(userId)) incident.reporterIds.push(userId);
    incident.reportCount = incident.reportIds.length;
    return incident;
  });

/* ------------------------------ reports ------------------------------ */
export const createReport = (report) =>
  run(() => {
    const record = { ...report, id: nextId('REP'), createdAt: nowIso() };
    db.reports.push(record);
    return record;
  });
export const findReportById = (id) => run(() => find(db.reports, id) ?? null);
export const listReports = (filter = {}) =>
  run(() =>
    db.reports.filter((r) => {
      if (filter.incidentId && r.incidentId !== filter.incidentId) return false;
      if (filter.userId && r.userId !== filter.userId) return false;
      return true;
    }),
  );
export const updateReport = (id, patch) => run(() => patchItem(db.reports, id, patch));

/* ------------------------------ jobs ------------------------------ */
export const createJob = (job) =>
  run(() => {
    const record = { ...job, id: nextId('JOB'), createdAt: nowIso() };
    db.jobs.push(record);
    return record;
  });
export const findJobById = (id) => run(() => find(db.jobs, id) ?? null);
export const listJobs = (filter = {}) =>
  run(() =>
    db.jobs.filter((j) => {
      if (filter.technicianId && j.technicianId !== filter.technicianId) return false;
      if (filter.incidentId && j.incidentId !== filter.incidentId) return false;
      if (filter.states && !filter.states.includes(j.state)) return false;
      return true;
    }),
  );
export const updateJob = (id, patch) => run(() => patchItem(db.jobs, id, patch));

/* ------------------------------ notifications and sms ------------------------------ */
export const createNotification = (notification) =>
  run(() => {
    const record = { ...notification, id: nextId('NOT'), read: false, createdAt: nowIso() };
    db.notifications.push(record);
    return record;
  });
export const listNotifications = (filter = {}) =>
  run(() => db.notifications.filter((n) => (!filter.userId || n.userId === filter.userId) && (!filter.incidentId || n.incidentId === filter.incidentId)));
export const markNotificationRead = (id) => run(() => patchItem(db.notifications, id, { read: true }));
export const markAllNotificationsRead = (userId) =>
  run(() => {
    db.notifications.filter((n) => n.userId === userId).forEach((n) => { n.read = true; });
    return true;
  });
export const createSms = (sms) =>
  run(() => {
    const record = { ...sms, id: nextId('SMS'), createdAt: nowIso() };
    db.sms.push(record);
    return record;
  });
export const listSms = () => run(() => db.sms);

/* ------------------------------ audit log ------------------------------ */
export const appendAudit = (entry) =>
  run(() => {
    const record = { reason: null, ...entry, id: nextId('AUD'), ts: nowIso() };
    db.audit.push(record);
    return record;
  });
export const listAudit = () => run(() => db.audit);

/* ------------------------------ loadshedding ------------------------------ */
export const listLoadshedding = () => run(() => db.loadshedding);
export const addLoadshedding = (windows, { replace = false } = {}) =>
  run(() => {
    if (replace) db.loadshedding = [];
    const added = windows.map((w) => ({ ...w, id: nextId('LS') }));
    db.loadshedding.push(...added);
    return added;
  });
export const addSuppressed = (entry) =>
  run(() => {
    const record = { ...entry, id: nextId('SUP'), ts: nowIso() };
    db.suppressed.push(record);
    return record;
  });
export const listSuppressed = () => run(() => db.suppressed);

/* ------------------------------ simulator commands ------------------------------ */
// The backend asks the simulator to change the "physical" world, e.g. restore power after a repair.
export const pushCommand = (command) =>
  run(() => {
    db.commands.push({ ...command, ts: nowIso() });
    return true;
  });
export const popCommands = () =>
  run(() => {
    const commands = db.commands;
    db.commands = [];
    return commands;
  });

/* ------------------------------ photos ------------------------------ */
export const savePhoto = (dataUrl) =>
  run(() => {
    const id = nextId('PH');
    db.photos[id] = dataUrl;
    return id;
  });
export const getPhoto = (id) => run(() => db.photos[id] ?? null);

/* ------------------------------ demo ------------------------------ */
export const resetDatabase = () =>
  run(() => {
    resetStore();
    return true;
  });
