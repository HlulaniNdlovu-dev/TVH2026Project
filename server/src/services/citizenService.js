import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { badRequest, conflict } from '../utils/errors.js';
import { normalizePhone } from '../utils/phone.js';
import { secondsSince } from '../utils/time.js';
import * as loadshedding from './loadsheddingService.js';
import * as notifications from './notificationService.js';
import * as meterService from './meterService.js';
import * as views from './viewService.js';
import { sanitize } from './authService.js';
import { unitsOf } from '../utils/units.js';

// Live state of each of the citizen's meters, straight from the sensors.
export async function meters(user) {
  const refs = await views.loadRefs();
  return user.meters.map((m) => {
    const node = [...refs.nodesById.values()].find((n) => n.meterNumber === m.meterNumber);
    return {
      ...m,
      area: node?.area ?? null,
      state: node?.state ?? 'ON',
      watts: node?.watts ?? 0,
      units: node ? Math.round(unitsOf(node) * 10) / 10 : null,
      offReason: node?.offReason ?? null,
      online: node ? secondsSince(node.lastHeartbeat) <= config.sensorOfflineSeconds : false,
    };
  });
}

async function relevantIncidents(user, refs) {
  const mine = new Set([...refs.nodesById.values()].filter((n) => n.ownerId === user.id).map((n) => n.id));
  const all = await stubs.listIncidents({});
  return all
    .filter((i) => i.reporterIds.includes(user.id) || i.affectedNodeIds.some((id) => mine.has(id)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function incidents(user) {
  const refs = await views.loadRefs();
  const list = await relevantIncidents(user, refs);
  const shape = (i) => views.citizenIncident(i, user.id, refs);
  return {
    current: list.filter((i) => i.status !== 'resolved').map(shape),
    history: list.filter((i) => i.status === 'resolved').map(shape),
  };
}

export async function dashboard(user) {
  const refs = await views.loadRefs();
  const myMeters = await meters(user);
  const area = myMeters[0]?.area ?? null;

  // Area status: loadshedding beats outages, outages beat "all good".
  const window = area ? await loadshedding.windowAt(area) : null;
  const openInArea = (await stubs.listIncidents({ open: true, area })).filter((i) => i.status !== 'reported' || i.sensorConfirmed || i.reportCount > 1);
  const areaStatus = window
    ? { state: 'loadshedding', message: `Scheduled Stage ${window.stage} loadshedding until ${new Date(window.end).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}.` }
    : openInArea.length
      ? { state: 'outage_nearby', message: `${openInArea.length} outage(s) affecting ${openInArea.reduce((s, i) => s + i.affectedCount, 0)} customer(s) in ${area}.` }
      : { state: 'operational', message: `The grid in ${area ?? 'your area'} is fully operational.` };

  // The incident card stays on screen after resolution until the "resolved" notification has been opened.
  const list = await relevantIncidents(user, refs);
  const unreadResolved = new Set((await stubs.listNotifications({ userId: user.id })).filter((n) => n.type === 'resolved' && !n.read).map((n) => n.incidentId));
  const card = list.find((i) => i.status !== 'resolved' || unreadResolved.has(i.id));

  return {
    meters: myMeters,
    area: { name: area, ...areaStatus, incidentCount: openInArea.length },
    incident: card ? views.citizenIncident(card, user.id, refs) : null,
    nextLoadshedding: area ? await loadshedding.nextWindow(area) : null,
    unreadCount: await notifications.unreadCount(user.id),
  };
}

export async function updateProfile(user, body) {
  const patch = {};
  if (body.name !== undefined) {
    if (!String(body.name).trim()) throw badRequest('Name cannot be empty');
    patch.name = String(body.name).trim();
  }
  if (body.phone !== undefined) {
    const phone = normalizePhone(body.phone);
    if (!/^0\d{9}$/.test(phone)) throw badRequest('Enter a valid South African phone number');
    const other = await stubs.findUserByPhone(phone);
    if (other && other.id !== user.id) throw conflict('That phone number is used by another account');
    patch.phone = phone;
  }
  if (body.email !== undefined) {
    if (!/^\S+@\S+\.\S+$/.test(body.email)) throw badRequest('Enter a valid email address');
    patch.email = String(body.email).trim();
  }
  if (body.address !== undefined) patch.address = String(body.address).trim();
  if (body.prefs) patch.prefs = { inApp: Boolean(body.prefs.inApp), sms: Boolean(body.prefs.sms) };
  if (body.medical !== undefined) patch.medical = Boolean(body.medical);
  return sanitize(await stubs.updateUser(user.id, patch));
}

export async function addMeter(user, body) {
  if (user.meters.some((m) => m.meterNumber === String(body.meterNumber).replace(/\s/g, ''))) throw conflict('You have already added this meter');
  const meter = await meterService.linkMeter(user.id, body);
  return sanitize(await stubs.updateUser(user.id, { meters: [...user.meters, meter] }));
}

export async function removeMeter(user, meterNumber) {
  if (user.meters.length <= 1) throw badRequest('You need at least one meter on your account');
  await meterService.unlinkMeter(user.id, meterNumber);
  return sanitize(await stubs.updateUser(user.id, { meters: user.meters.filter((m) => m.meterNumber !== meterNumber) }));
}
