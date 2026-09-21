import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { parseCsv } from '../utils/csv.js';
import { badRequest } from '../utils/errors.js';
import { AREA_NAMES } from '../db/seed/grid.js';
import * as audit from './auditService.js';

const forArea = (windows, area) => windows.filter((w) => w.area === area || w.area === 'All');

export async function list() {
  const windows = await stubs.listLoadshedding();
  return windows.sort((a, b) => new Date(a.start) - new Date(b.start));
}

export async function windowAt(area, at = new Date()) {
  const t = new Date(at).getTime();
  const windows = forArea(await stubs.listLoadshedding(), area);
  return windows.find((w) => new Date(w.start).getTime() <= t && t <= new Date(w.end).getTime()) ?? null;
}

export async function nextWindow(area, after = new Date()) {
  const t = new Date(after).getTime();
  const windows = forArea(await stubs.listLoadshedding(), area).filter((w) => new Date(w.end).getTime() > t);
  windows.sort((a, b) => new Date(a.start) - new Date(b.start));
  return windows[0] ?? null;
}

// Decides what to do with a node that went off at `offSince`:
//  - suppress: it is scheduled loadshedding, so do not dispatch anybody
//  - extended: the outage carried on well past the end of the schedule, so treat it as a real fault
export async function classifyOutage(area, offSince, now = new Date()) {
  const windows = forArea(await stubs.listLoadshedding(), area);
  const off = new Date(offSince).getTime();
  const match = windows.find((w) => off >= new Date(w.start).getTime() - 60000 && off <= new Date(w.end).getTime());
  if (!match) return { suppress: false, extended: false, window: null };
  const graceEnd = new Date(match.end).getTime() + config.loadsheddingGraceMinutes * 60000;
  if (now.getTime() <= graceEnd) return { suppress: true, extended: false, window: match };
  return { suppress: false, extended: true, window: match };
}

// Accepts CSV text with the columns: area,stage,start,end
export async function uploadCsv(csvText, { replace = false } = {}, actor) {
  const rows = parseCsv(csvText);
  if (!rows.length) throw badRequest('The file is empty or has no data rows.');
  const windows = [];
  const errors = [];
  rows.forEach((row, i) => {
    const line = i + 2;
    const start = new Date(row.start);
    const end = new Date(row.end);
    if (!row.area) return errors.push(`Line ${line}: area is missing`);
    if (row.area !== 'All' && !AREA_NAMES.includes(row.area)) return errors.push(`Line ${line}: unknown area "${row.area}" (use ${AREA_NAMES.join(', ')} or All)`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return errors.push(`Line ${line}: start or end is not a valid date/time`);
    if (end <= start) return errors.push(`Line ${line}: end must be after start`);
    windows.push({ area: row.area, stage: Number(row.stage) || 2, start: start.toISOString(), end: end.toISOString(), source: 'upload' });
  });
  if (!windows.length) throw badRequest(errors.join('; '));
  await stubs.addLoadshedding(windows, { replace });
  await audit.log(actor, 'loadshedding_upload', 'loadshedding', '-', `${windows.length} slot(s) uploaded${replace ? ' (replaced existing schedule)' : ''}`);
  return { added: windows.length, errors };
}

// Used by the simulator to start a loadshedding window right now.
export async function injectWindow({ area, minutes = 2, stage = 2 }) {
  if (![...AREA_NAMES, 'All'].includes(area)) throw badRequest('Unknown area');
  const start = new Date(Date.now() - 5000);
  const end = new Date(Date.now() + minutes * 60000);
  const [created] = await stubs.addLoadshedding([{ area, stage, start: start.toISOString(), end: end.toISOString(), source: 'simulator' }]);
  return created;
}
