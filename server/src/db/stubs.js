// Database layer (MySQL, with a write-through in-memory cache).
//
// MySQL is the source of truth. At start-up every table is loaded into memory, and reads are answered from
// memory (a hosted MySQL is a network hop away, and the app reads dozens of times a second). Writes change
// memory immediately and are saved to MySQL in the background, batched per table, in order. Only records
// whose stored values really changed are saved, so a sensor heartbeat that only refreshes the watts does no
// database work. Photos are large, so they stay in MySQL only.
//
// This assumes ONE server instance owns the database, which is how the app is deployed. The signatures and the
// return shapes (copies of the records, never live objects) are the same as they have always been.
import { pool } from './pool.js';
import { OPEN_STATUSES } from '../config/constants.js';
import { nowIso } from '../utils/time.js';
import { buildSeed } from './seed/index.js';

/* ------------------------------ table definitions ------------------------------ */
// record -> the indexed columns kept in sync with the record.
const TABLES = {
  users: (u) => ({ role: u.role, phone: u.phone ?? null, email: u.email ? String(u.email).toLowerCase() : null }),
  nodes: (n) => ({ type: n.type, parent_id: n.parentId ?? null, area: n.area ?? null, meter_number: n.meterNumber ?? null }),
  incidents: (i) => ({ status: i.status, node_id: i.nodeId ?? null, technician_id: i.technicianId ?? null, area: i.area ?? null }),
  reports: (r) => ({ user_id: r.userId ?? null, incident_id: r.incidentId ?? null }),
  jobs: (j) => ({ incident_id: j.incidentId ?? null, technician_id: j.technicianId ?? null, state: j.state }),
  notifications: (n) => ({ user_id: n.userId ?? null, incident_id: n.incidentId ?? null, is_read: n.read ? 1 : 0 }),
  sms: () => ({}),
  audit: () => ({}),
  loadshedding: () => ({}),
  suppressed: () => ({}),
};
const TABLE_NAMES = Object.keys(TABLES);
// Id prefix -> table, used to keep the counters ahead of the highest stored id.
const PREFIX_TABLE = { U: 'users', H: 'nodes', INC: 'incidents', REP: 'reports', JOB: 'jobs', NOT: 'notifications', SMS: 'sms', AUD: 'audit', LS: 'loadshedding', SUP: 'suppressed' };

const mem = Object.fromEntries(TABLE_NAMES.map((t) => [t, new Map()]));
let counters = {};
let commands = [];

const clone = (value) => (value === undefined ? value : structuredClone(value));
const rows = async (sql, params = []) => (await pool.query(sql, params))[0];
const parse = (row) => (typeof row.data === 'string' ? JSON.parse(row.data) : row.data);

// Sensors report watts, battery and a heartbeat every few seconds. Those live only in memory.
const fingerprint = (table, record) => JSON.stringify(table === 'nodes' ? { ...record, lastHeartbeat: 0, watts: 0, battery: 0 } : record);

/* ------------------------------ background saving ------------------------------ */
const queues = {};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function upsertRecords(table, records) {
  const built = records.map((record) => {
    const cols = TABLES[table](record);
    return { names: ['id', ...Object.keys(cols), 'data'], values: [record.id, ...Object.values(cols), JSON.stringify(record)] };
  });
  for (let i = 0; i < built.length; i += 200) {
    const chunk = built.slice(i, i + 200);
    const { names } = chunk[0];
    const marks = chunk.map(() => `(${names.map(() => '?').join(',')})`).join(',');
    const update = names.slice(1).map((n) => `${n} = VALUES(${n})`).join(', ');
    await pool.query(`INSERT INTO ${table} (${names.join(',')}) VALUES ${marks} ON DUPLICATE KEY UPDATE ${update}`, chunk.flatMap((b) => b.values));
  }
}

const saveHandlers = {
  ...Object.fromEntries(TABLE_NAMES.map((table) => [table, (ids) => upsertRecords(table, ids.map((id) => mem[table].get(id)).filter(Boolean))])),
  counters: (prefixes) => (prefixes.length ? pool.query('INSERT INTO counters (prefix, value) VALUES ? ON DUPLICATE KEY UPDATE value = VALUES(value)', [prefixes.map((p) => [p, counters[p]])]) : null),
};

function queueFor(name) {
  if (!queues[name]) queues[name] = { dirty: new Set(), running: null };
  return queues[name];
}

function kick(name) {
  const q = queueFor(name);
  if (q.running || !q.dirty.size) return;
  const ids = [...q.dirty];
  q.dirty.clear();
  q.running = (async () => {
    try {
      await saveHandlers[name](ids);
    } catch (err) {
      console.error(`[db] saving ${name} failed, will retry: ${err.message}`);
      ids.forEach((id) => q.dirty.add(id));
      await sleep(5000);
    }
  })().finally(() => {
    q.running = null;
    kick(name);
  });
}

function markDirty(name, id) {
  queueFor(name).dirty.add(id);
  kick(name);
}

// Resolves once everything written so far has reached MySQL (used on shutdown and before a reset).
export async function flush() {
  for (;;) {
    const pending = Object.values(queues).filter((q) => q.running || q.dirty.size);
    if (!pending.length) return;
    await Promise.all(pending.map((q) => q.running ?? Promise.resolve()));
    await sleep(0);
  }
}

/* ------------------------------ ids ------------------------------ */
function nextId(prefix, start = 1001) {
  counters[prefix] = (counters[prefix] ?? start - 1) + 1;
  markDirty('counters', prefix);
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
  markDirty(table, record.id);
  return clone(record);
}

// Applies `mutate` to the stored record and saves it only if something really changed.
function patch(table, id, mutate) {
  const record = mem[table].get(id);
  if (!record) return null;
  const before = fingerprint(table, record);
  mutate(record);
  if (fingerprint(table, record) !== before) markDirty(table, id);
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
  if (replace) {
    await flush();
    mem.loadshedding = new Map();
    await pool.query('DELETE FROM loadshedding');
  }
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

/* ------------------------------ photos (MySQL only) ------------------------------ */
export async function savePhoto(dataUrl) {
  const id = nextId('PH');
  await pool.query('INSERT INTO photos (id, data) VALUES (?, ?)', [id, dataUrl]);
  return id;
}
export async function getPhoto(id) {
  const found = await rows('SELECT data FROM photos WHERE id = ?', [id]);
  return found.length ? found[0].data : null;
}

/* ------------------------------ start-up, seed and reset ------------------------------ */
const suffix = (id) => Number(String(id).split('-').pop()) || 0;

async function loadFromDatabase() {
  for (const table of TABLE_NAMES) {
    mem[table] = new Map((await rows(`SELECT data FROM ${table} ORDER BY seq`)).map((r) => [parse(r).id, parse(r)]));
  }
  counters = Object.fromEntries((await rows('SELECT prefix, value FROM counters')).map((r) => [r.prefix, r.value]));
  // Background saves may not have reached MySQL before a crash: never hand out an id that is already in use.
  Object.entries(PREFIX_TABLE).forEach(([prefix, table]) => {
    const highest = Math.max(0, ...[...mem[table].keys()].map(suffix));
    if (highest > (counters[prefix] ?? 0)) counters[prefix] = highest;
  });
  const photoIds = await rows('SELECT id FROM photos');
  const highestPhoto = Math.max(0, ...photoIds.map((r) => suffix(r.id)));
  if (highestPhoto > (counters.PH ?? 0)) counters.PH = highestPhoto;
}

async function loadSeed() {
  const seed = buildSeed();
  TABLE_NAMES.forEach((table) => {
    mem[table] = new Map((seed[table] ?? []).map((r) => [r.id, r]));
  });
  counters = { ...seed.counters };
  commands = [];
  for (const table of TABLE_NAMES) await upsertRecords(table, [...mem[table].values()]);
  await saveHandlers.counters(Object.keys(counters));
}

// Called once at startup, after the schema exists: loads MySQL into memory, seeding demo data if it is empty.
export async function loadDatabase() {
  await loadFromDatabase();
  if (mem.users.size === 0) {
    await loadSeed();
    return true;
  }
  return false;
}

// Puts every table back to the seeded demo state (the "Reset demo data" button).
export async function resetDatabase() {
  await flush();
  for (const table of [...TABLE_NAMES, 'photos', 'counters']) await pool.query(`TRUNCATE TABLE ${table}`);
  await loadSeed();
  return true;
}
