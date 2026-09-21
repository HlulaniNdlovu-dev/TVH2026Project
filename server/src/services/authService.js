// Prototype authentication: phone + password, plain comparison, no tokens.
// The client keeps the returned user in localStorage and sends its id in the x-user-id header.
import * as stubs from '../db/stubs.js';
import { badRequest, conflict, unauthorized } from '../utils/errors.js';
import { normalizePhone } from '../utils/phone.js';
import * as meters from './meterService.js';

export const sanitize = (user) => {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
};

export async function login({ phone, password }) {
  const user = await stubs.findUserByPhone(normalizePhone(phone));
  if (!user || user.password !== password) throw unauthorized('Incorrect phone number or password');
  return sanitize(user);
}

export async function register(body) {
  const name = String(body.name ?? '').trim();
  const phone = normalizePhone(body.phone);
  const email = String(body.email ?? '').trim();
  const password = String(body.password ?? '');
  const address = String(body.address ?? '').trim();
  if (!name) throw badRequest('Please enter your full name');
  if (!/^0\d{9}$/.test(phone)) throw badRequest('Enter a valid South African phone number, e.g. 082 123 4567');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw badRequest('Enter a valid email address');
  if (password.length < 4) throw badRequest('Password must be at least 4 characters');
  if (!address) throw badRequest('Please enter your address');
  if (await stubs.findUserByPhone(phone)) throw conflict('An account with this phone number already exists');
  if (await stubs.findUserByEmail(email)) throw conflict('An account with this email already exists');

  const meterNumber = String(body.meterNumber ?? '').replace(/\s/g, '');
  if (!/^\d{8,13}$/.test(meterNumber)) throw badRequest('Meter number must be 8 to 13 digits');
  const existingMeter = await stubs.findNodeByMeter(meterNumber);
  if (existingMeter?.ownerId) throw conflict('This meter number is already registered to another account');

  const user = await stubs.createUser({
    role: 'citizen', name, phone, email, password, address, lat: null, lng: null,
    meters: [], prefs: { inApp: true, sms: true }, medical: false,
  });
  const meter = await meters.linkMeter(user.id, { meterNumber, label: 'Home', address, lat: body.lat, lng: body.lng });
  return sanitize(await stubs.updateUser(user.id, { meters: [meter], lat: meter.lat, lng: meter.lng }));
}

export async function me(userId) {
  return sanitize(await stubs.findUserById(userId));
}
