// Database layer (MySQL).
//
// Every function keeps the signature and return shape the services always used: async, returns plain objects.
// Each table stores real columns for the fields we filter on plus the whole record in a JSON `data` column,
// so nested fields (incident timelines, technician skills...) round-trip unchanged.
// Read-modify-write updates run in a transaction with SELECT ... FOR UPDATE so concurrent requests cannot overwrite each other.
import { pool } from './pool.js';
import { OPEN_STATUSES } from '../config/constants.js';
import { nowIso } from '../utils/time.js';
import { buildSeed } from './seed/index.js';

/* ------------------------------ table definitions ------------------------------ */
// record -> the indexed columns kept in sync with the record after every write.
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

const parse = (row) => (typeof row.data === 'string' ? JSON.parse(row.data) : row.data);
const rows = async (sql, params = [], conn = pool) => (await conn.query(sql, params))[0];

async function nextId(prefix, start = 1001) {
  await pool.query('INSERT IGNORE INTO counters (prefix, value) VALUES (?, ?)', [prefix, start - 1]);
  const [result] = await pool.query('UPDATE counters SET value = LAST_INSERT_ID(value + 1) WHERE prefix = ?', [prefix]);
  return `${prefix}-${result.insertId}`;
}

async function transaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/* ------------------------------ generic helpers ------------------------------ */
function rowValues(table, record) {
  const cols = TABLES[table](record);
  return { names: ['id', ...Object.keys(cols), 'data'], values: [record.id, ...Object.values(cols), JSON.stringify(record)] };
}

async function insertMany(table, records, conn = pool) {
  if (!records.length) return;
  const built = records.map((r) => rowValues(table, r));
  const { names } = built[0];
  for (let i = 0; i < built.length; i += 200) {
    const chunk = built.slice(i, i + 200);
    const marks = chunk.map(() => `(${names.map(() => '?').join(',')})`).join(',');
    await conn.query(`INSERT INTO ${table} (${names.join(',')}) VALUES ${marks}`, chunk.flatMap((b) => b.values));
  }
}

const insertOne = async (table, record) => {
  await insertMany(table, [record]);
  return record;
};

// Loads a record, applies `mutate` to it, writes it back. Returns the updated record, or null if it does not exist.
const patch = (table, id, mutate) =>
  transaction(async (conn) => {
    const found = await rows(`SELECT data FROM ${table} WHERE id = ? FOR UPDATE`, [id], conn);
    if (!found.length) return null;
    const record = parse(found[0]);
    mutate(record);
    const { names, values } = rowValues(table, record);
    const sets = names.slice(1).map((n) => `${n} = ?`).join(', ');
    await conn.query(`UPDATE ${table} SET ${sets} WHERE id = ?`, [...values.slice(1), id]);
    return record;
  });

const assign = (changes) => (record) => Object.assign(record, changes);

async function selectAll(table, where = [], params = []) {
  const clause = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  return (await rows(`SELECT data FROM ${table}${clause} ORDER BY seq`, params)).map(parse);
}

async function selectOne(table, column, value) {
  const found = await rows(`SELECT data FROM ${table} WHERE ${column} = ? ORDER BY seq LIMIT 1`, [value]);
  return found.length ? parse(found[0]) : null;
}

/* ------------------------------ users ------------------------------ */
export const findUserById = (id) => selectOne('users', 'id', id);
export const findUserByPhone = (phone) => selectOne('users', 'phone', phone);
export const findUserByEmail = (email) => selectOne('users', 'email', String(email).toLowerCase());
export const listUsers = (filter = {}) => (filter.role ? selectAll('users', ['role = ?'], [filter.role]) : selectAll('users'));
export const createUser = async (user) => insertOne('users', { ...user, id: await nextId('U'), createdAt: nowIso() });
export const updateUser = (id, changes) => patch('users', id, assign(changes));
export const updateTechnicianProfile = (id, changes) =>
  patch('users', id, (user) => {
    user.tech = { ...user.tech, ...changes };
  });

/* ------------------------------ grid nodes ------------------------------ */
export const listNodes = () => selectAll('nodes');
export const findNodeById = (id) => selectOne('nodes', 'id', id);
export const findNodeByMeter = (meterNumber) => selectOne('nodes', 'meter_number', meterNumber);
export const createNode = async (node) => insertOne('nodes', { ...node, id: await nextId('H') });
export const updateNode = (id, changes) => patch('nodes', id, assign(changes));
// Sensor heartbeats update every node at once, so this is one SELECT and one bulk upsert.
export const updateNodes = (updates) =>
  transaction(async (conn) => {
    if (!updates.length) return true;
    const ids = [...new Set(updates.map((u) => u.id))];
    const current = new Map((await rows('SELECT data FROM nodes WHERE id IN (?) FOR UPDATE', [ids], conn)).map((r) => [parse(r).id, parse(r)]));
    updates.forEach(({ id, patch: changes }) => {
      if (current.has(id)) Object.assign(current.get(id), changes);
    });
    const built = [...current.values()].map((n) => rowValues('nodes', n));
    if (!built.length) return true;
    const { names } = built[0];
    const marks = built.map(() => `(${names.map(() => '?').join(',')})`).join(',');
    const dup = names.slice(1).map((n) => `${n} = VALUES(${n})`).join(', ');
    await conn.query(`INSERT INTO nodes (${names.join(',')}) VALUES ${marks} ON DUPLICATE KEY UPDATE ${dup}`, built.flatMap((b) => b.values));
    return true;
  });

/* ------------------------------ incidents ------------------------------ */
export function listIncidents(filter = {}) {
  const where = [];
  const params = [];
  if (filter.open) { where.push('status IN (?)'); params.push(OPEN_STATUSES); }
  if (filter.statuses) { where.push('status IN (?)'); params.push(filter.statuses.length ? filter.statuses : ['']); }
  if (filter.technicianId) { where.push('technician_id = ?'); params.push(filter.technicianId); }
  if (filter.nodeId) { where.push('node_id = ?'); params.push(filter.nodeId); }
  if (filter.area) { where.push('area = ?'); params.push(filter.area); }
  if (!filter.includeMerged) where.push("status <> 'merged'");
  return selectAll('incidents', where, params);
}
export const findIncidentById = (id) => selectOne('incidents', 'id', id);
export const createIncident = async (incident) => insertOne('incidents', { ...incident, id: await nextId('INC') });
export const updateIncident = (id, changes) => patch('incidents', id, assign(changes));
// Adds a timeline entry and applies field changes in one step.
export const recordIncidentEvent = (id, event, changes = {}) =>
  patch('incidents', id, (incident) => {
    Object.assign(incident, changes);
    incident.timeline.push({ ts: nowIso(), actor: 'system', ...event });
  });
export const attachReportToIncident = (incidentId, reportId, userId) =>
  patch('incidents', incidentId, (incident) => {
    if (!incident.reportIds.includes(reportId)) incident.reportIds.push(reportId);
    if (!incident.reporterIds.includes(userId)) incident.reporterIds.push(userId);
    incident.reportCount = incident.reportIds.length;
  });

/* ------------------------------ reports ------------------------------ */
export const createReport = async (report) => insertOne('reports', { ...report, id: await nextId('REP'), createdAt: nowIso() });
export const findReportById = (id) => selectOne('reports', 'id', id);
export function listReports(filter = {}) {
  const where = [];
  const params = [];
  if (filter.incidentId) { where.push('incident_id = ?'); params.push(filter.incidentId); }
  if (filter.userId) { where.push('user_id = ?'); params.push(filter.userId); }
  return selectAll('reports', where, params);
}
export const updateReport = (id, changes) => patch('reports', id, assign(changes));

/* ------------------------------ jobs ------------------------------ */
export const createJob = async (job) => insertOne('jobs', { ...job, id: await nextId('JOB'), createdAt: nowIso() });
export const findJobById = (id) => selectOne('jobs', 'id', id);
export function listJobs(filter = {}) {
  const where = [];
  const params = [];
  if (filter.technicianId) { where.push('technician_id = ?'); params.push(filter.technicianId); }
  if (filter.incidentId) { where.push('incident_id = ?'); params.push(filter.incidentId); }
  if (filter.states) { where.push('state IN (?)'); params.push(filter.states.length ? filter.states : ['']); }
  return selectAll('jobs', where, params);
}
export const updateJob = (id, changes) => patch('jobs', id, assign(changes));

/* ------------------------------ notifications and sms ------------------------------ */
export const createNotification = async (notification) => insertOne('notifications', { ...notification, id: await nextId('NOT'), read: false, createdAt: nowIso() });
export function listNotifications(filter = {}) {
  const where = [];
  const params = [];
  if (filter.userId) { where.push('user_id = ?'); params.push(filter.userId); }
  if (filter.incidentId) { where.push('incident_id = ?'); params.push(filter.incidentId); }
  return selectAll('notifications', where, params);
}
export const markNotificationRead = (id) => patch('notifications', id, assign({ read: true }));
export async function markAllNotificationsRead(userId) {
  const unread = await rows('SELECT id FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);
  await Promise.all(unread.map((r) => markNotificationRead(r.id)));
  return true;
}
export const createSms = async (sms) => insertOne('sms', { ...sms, id: await nextId('SMS'), createdAt: nowIso() });
export const listSms = () => selectAll('sms');

/* ------------------------------ audit log ------------------------------ */
export const appendAudit = async (entry) => insertOne('audit', { reason: null, ...entry, id: await nextId('AUD'), ts: nowIso() });
export const listAudit = () => selectAll('audit');

/* ------------------------------ loadshedding ------------------------------ */
export const listLoadshedding = () => selectAll('loadshedding');
export async function addLoadshedding(windows, { replace = false } = {}) {
  if (replace) await pool.query('DELETE FROM loadshedding');
  const added = [];
  for (const w of windows) added.push({ ...w, id: await nextId('LS') });
  await insertMany('loadshedding', added);
  return added;
}
export const addSuppressed = async (entry) => insertOne('suppressed', { ...entry, id: await nextId('SUP'), ts: nowIso() });
export const listSuppressed = () => selectAll('suppressed');

/* ------------------------------ simulator commands ------------------------------ */
// The backend asks the simulator to change the "physical" world, e.g. restore power after a repair.
export async function pushCommand(command) {
  await pool.query('INSERT INTO commands (data) VALUES (?)', [JSON.stringify({ ...command, ts: nowIso() })]);
  return true;
}
export const popCommands = () =>
  transaction(async (conn) => {
    const found = await rows('SELECT data FROM commands ORDER BY seq FOR UPDATE', [], conn);
    if (found.length) await conn.query('DELETE FROM commands');
    return found.map(parse);
  });

/* ------------------------------ photos ------------------------------ */
export async function savePhoto(dataUrl) {
  const id = await nextId('PH');
  await pool.query('INSERT INTO photos (id, data) VALUES (?, ?)', [id, dataUrl]);
  return id;
}
export async function getPhoto(id) {
  const found = await rows('SELECT data FROM photos WHERE id = ?', [id]);
  return found.length ? found[0].data : null;
}

/* ------------------------------ seed and reset ------------------------------ */
const ALL_TABLES = [...Object.keys(TABLES), 'commands', 'photos', 'counters'];

async function loadSeed() {
  const seed = buildSeed();
  await transaction(async (conn) => {
    for (const table of Object.keys(TABLES)) await insertMany(table, seed[table] ?? [], conn);
    const counters = Object.entries(seed.counters);
    if (counters.length) await conn.query('INSERT INTO counters (prefix, value) VALUES ?', [counters]);
  });
}

// Puts every table back to the seeded demo state (the "Reset demo data" button).
export async function resetDatabase() {
  for (const table of ALL_TABLES) await pool.query(`TRUNCATE TABLE ${table}`);
  await loadSeed();
  return true;
}

// Called once at startup, after the schema exists: loads the demo data into an empty database.
export async function seedIfEmpty() {
  const [{ total }] = await rows('SELECT COUNT(*) AS total FROM users');
  if (Number(total) === 0) {
    await loadSeed();
    return true;
  }
  return false;
}
