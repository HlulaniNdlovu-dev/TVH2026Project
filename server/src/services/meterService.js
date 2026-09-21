// Links a meter number to a citizen. Known meters are claimed; unknown ones get a new house sensor
// placed at the citizen's address under the closest transformer.
import * as stubs from '../db/stubs.js';
import { badRequest, conflict } from '../utils/errors.js';
import { nowIso } from '../utils/time.js';
import { nearestNode } from './topologyService.js';

const DEFAULT_POINT = { lat: -25.7069, lng: 28.3999 };

export async function linkMeter(userId, { meterNumber, label, address, lat, lng }) {
  const number = String(meterNumber ?? '').replace(/\s/g, '');
  if (!/^\d{8,13}$/.test(number)) throw badRequest('Meter number must be 8 to 13 digits');
  const existing = await stubs.findNodeByMeter(number);

  if (existing) {
    if (existing.ownerId && existing.ownerId !== userId) throw conflict('This meter number is already registered to another account');
    await stubs.updateNode(existing.id, { ownerId: userId });
    return { meterNumber: number, label: label || 'Home', address: address || existing.address, lat: existing.lat, lng: existing.lng };
  }

  const point = { lat: Number(lat) || DEFAULT_POINT.lat, lng: Number(lng) || DEFAULT_POINT.lng };
  const parent = nearestNode(await stubs.listNodes(), 'transformer', point);
  await stubs.createNode({
    type: 'house', name: 'House', parentId: parent.id, area: parent.area, lat: point.lat, lng: point.lng,
    state: 'ON', watts: 0, voltage: 230, battery: 100, meterNumber: number, address: address || 'Registered address',
    ownerId: userId, critical: null, lastHeartbeat: nowIso(), offSince: null, graceUntil: null, offReason: null, forceConfirm: false, flickerCount: 0,
  });
  return { meterNumber: number, label: label || 'Home', address: address || 'Registered address', lat: point.lat, lng: point.lng };
}

export async function unlinkMeter(userId, meterNumber) {
  const node = await stubs.findNodeByMeter(meterNumber);
  if (node && node.ownerId === userId) await stubs.updateNode(node.id, { ownerId: null });
}
