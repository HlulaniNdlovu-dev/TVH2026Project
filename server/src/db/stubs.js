// Data layer: plain in-memory tables, filled with the demo seed every time the server starts.
//
// There is no database on purpose: the prototype only needs to demo the flows, and keeping everything in memory
// makes every request instant. A restart (or "Reset demo data") puts everything back to the seed.
//
// Every other file reaches the data only through the functions exported here, and they all return copies of the
// records (never the live objects), so swapping this file for a real database later does not touch the services.
import { OPEN_STATUSES } from '../config/constants.js';
import { nowIso } from '../utils/time.js';
import { buildSeed } from './seed/index.js';

const TABLE_NAMES = ['users', 'nodes', 'incidents', 'reports', 'jobs', 'notifications', 'sms', 'audit', 'loadshedding', 'suppressed'];

let mem = {};
let photos = new Map();
let counters = {};
let commands = [];

const clone = (value) => (value === undefined ? value : structuredClone(value));

/* ------------------------------ ids ------------------------------ */
function nextId(prefix, start = 1001) {
  counters[prefix] = (counters[prefix] ?? start - 1) + 1;
  return `${prefix}-${counters[prefix]}`;
}

/* ------------------------------ generic helpers ------------------------------ */
const all = (table, predicate = () => true) => {
  const out = [];
  for (const record of mem[table].values()) if (predicate(record)) out.push(clone(record));
  return out;
};
const first = (table, predicate) => {
  for (const record of mem[table].values()) if (predicate(record)) return clone(record);
  return null;
};
const byId = (table, id) => clone(mem[table].get(id) ?? null);

function insert(table, record) {
  mem[table].set(record.id, record);
  return clone(record);
}

// Applies `mutate` to the stored record.
function patch(table, id, mutate) {
  const record = mem[table].get(id);
  if (!record) return null;
  mutate(record);
  return clone(record);
}
const assign = (changes) => (record) => Object.assign(record, changes);

/* ------------------------------ users ------------------------------ */
export const findUserById = async (id) => byId('users', id);
export const findUserByPhone = async (phone) => first('users', (u) => u.phone === phone);
export const findUserByEmail = async (email) => first('users', (u) => u.email?.toLowerCase() === String(email).toLowerCase());
export const listUsers = async (filter = {}) => all('users', (u) => !filter.role || u.role === filter.role);
export const createUser = async (user) => insert('users', { ...user, id: nextId('U'), createdAt: nowIso() });
export const updateUser = async (id, changes) => patch('users', id, assign(changes));
export const updateTechnicianProfile = async (id, changes) =>
  patch('users', id, (user) => {
    user.tech = { ...user.tech, ...changes };
  });

/* ------------------------------ grid nodes ------------------------------ */
export const listNodes = async () => all('nodes');
export const findNodeById = async (id) => byId('nodes', id);
export const findNodeByMeter = async (meterNumber) => first('nodes', (n) => n.meterNumber === meterNumber);
export const createNode = async (node) => insert('nodes', { ...node, id: nextId('H') });
export const updateNode = async (id, changes) => patch('nodes', id, assign(changes));
export const updateNodes = async (updates) => {
  updates.forEach(({ id, patch: changes }) => patch('nodes', id, assign(changes)));
  return true;
};

/* ------------------------------ incidents ------------------------------ */
export const listIncidents = async (filter = {}) =>
  all('incidents', (i) => {
    if (filter.open && !OPEN_STATUSES.includes(i.status)) return false;
    if (filter.statuses && !filter.statuses.includes(i.status)) return false;
    if (filter.technicianId && i.technicianId !== filter.technicianId) return false;
    if (filter.nodeId && i.nodeId !== filter.nodeId) return false;
    if (filter.area && i.area !== filter.area) return false;
    return i.status !== 'merged' || Boolean(filter.includeMerged);
  });
export const findIncidentById = async (id) => byId('incidents', id);
export const createIncident = async (incident) => insert('incidents', { ...incident, id: nextId('INC') });
export const updateIncident = async (id, changes) => patch('incidents', id, assign(changes));
// Adds a timeline entry and applies field changes in one step.
export const recordIncidentEvent = async (id, event, changes = {}) =>
  patch('incidents', id, (incident) => {
    Object.assign(incident, changes);
    incident.timeline.push({ ts: nowIso(), actor: 'system', ...event });
  });
export const attachReportToIncident = async (incidentId, reportId, userId) =>
  patch('incidents', incidentId, (incident) => {
    if (!incident.reportIds.includes(reportId)) incident.reportIds.push(reportId);
    if (!incident.reporterIds.includes(userId)) incident.reporterIds.push(userId);
    incident.reportCount = incident.reportIds.length;
  });

/* ------------------------------ reports ------------------------------ */
export const createReport = async (report) => insert('reports', { ...report, id: nextId('REP'), createdAt: nowIso() });
export const findReportById = async (id) => byId('reports', id);
export const listReports = async (filter = {}) => all('reports', (r) => (!filter.incidentId || r.incidentId === filter.incidentId) && (!filter.userId || r.userId === filter.userId));
export const updateReport = async (id, changes) => patch('reports', id, assign(changes));

/* ------------------------------ jobs ------------------------------ */
export const createJob = async (job) => insert('jobs', { ...job, id: nextId('JOB'), createdAt: nowIso() });
export const findJobById = async (id) => byId('jobs', id);
export const listJobs = async (filter = {}) =>
  all('jobs', (j) => (!filter.technicianId || j.technicianId === filter.technicianId) && (!filter.incidentId || j.incidentId === filter.incidentId) && (!filter.states || filter.states.includes(j.state)));
export const updateJob = async (id, changes) => patch('jobs', id, assign(changes));

/* ------------------------------ notifications and sms ------------------------------ */
export const createNotification = async (notification) => insert('notifications', { ...notification, id: nextId('NOT'), read: false, createdAt: nowIso() });
export const listNotifications = async (filter = {}) => all('notifications', (n) => (!filter.userId || n.userId === filter.userId) && (!filter.incidentId || n.incidentId === filter.incidentId));
export const markNotificationRead = async (id) => patch('notifications', id, assign({ read: true }));
export const markAllNotificationsRead = async (userId) => {
  for (const n of mem.notifications.values()) if (n.userId === userId) patch('notifications', n.id, assign({ read: true }));
  return true;
};
export const createSms = async (sms) => insert('sms', { ...sms, id: nextId('SMS'), createdAt: nowIso() });
export const listSms = async () => all('sms');

/* ------------------------------ audit log ------------------------------ */
export const appendAudit = async (entry) => insert('audit', { reason: null, ...entry, id: nextId('AUD'), ts: nowIso() });
export const listAudit = async () => all('audit');

/* ------------------------------ loadshedding ------------------------------ */
export const listLoadshedding = async () => all('loadshedding');
export async function addLoadshedding(windows, { replace = false } = {}) {
  if (replace) mem.loadshedding = new Map();
  return windows.map((w) => insert('loadshedding', { ...w, id: nextId('LS') }));
}
export const addSuppressed = async (entry) => insert('suppressed', { ...entry, id: nextId('SUP'), ts: nowIso() });
export const listSuppressed = async () => all('suppressed');

/* ------------------------------ simulator commands ------------------------------ */
// The backend asks the simulator to change the "physical" world, e.g. restore power after a repair.
// The queue is short-lived, so it is kept in memory only.
export const pushCommand = async (command) => {
  commands.push({ ...command, ts: nowIso() });
  return true;
};
export const popCommands = async () => {
  const taken = commands;
  commands = [];
  return taken;
};

/* ------------------------------ photos ------------------------------ */
export async function savePhoto(dataUrl) {
  const id = nextId('PH');
  photos.set(id, dataUrl);
  return id;
}
export const getPhoto = async (id) => photos.get(id) ?? null;

/* ------------------------------ start-up and reset ------------------------------ */
function loadSeed() {
  const seed = buildSeed();
  mem = Object.fromEntries(TABLE_NAMES.map((table) => [table, new Map((seed[table] ?? []).map((r) => [r.id, r]))]));
  photos = new Map(Object.entries(seed.photos ?? {}));
  counters = { ...seed.counters };
  commands = [];
}

// Called once at start-up.
export function loadDatabase() {
  loadSeed();
  return true;
}

// Puts every table back to the seeded demo state (the "Reset demo data" button).
export async function resetDatabase() {
  loadSeed();
  return true;
}
