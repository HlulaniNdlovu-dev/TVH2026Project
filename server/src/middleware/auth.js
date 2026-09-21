// Prototype auth: the client sends the logged-in user's id in the x-user-id header.
// There are no tokens or encryption on purpose; this is NOT production security.
import * as stubs from '../db/stubs.js';
import { config } from '../config/index.js';
import { forbidden, unauthorized } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const userId = req.header('x-user-id');
  const user = userId ? await stubs.findUserById(userId) : null;
  if (!user) throw unauthorized('Your session has expired. Please log in again.');
  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) return next(forbidden());
  return next();
};

// Simulator calls carry a shared key instead of a user.
export const requireDeviceKey = (req, res, next) => {
  if (req.header('x-device-key') !== config.deviceKey) return next(unauthorized('Invalid device key'));
  return next();
};

// Either the simulator (device key) or a logged-in admin.
export const requireDeviceOrAdmin = asyncHandler(async (req, res, next) => {
  if (req.header('x-device-key') === config.deviceKey) return next();
  const user = req.header('x-user-id') ? await stubs.findUserById(req.header('x-user-id')) : null;
  if (user?.role !== 'admin') throw forbidden('Admin or device key required');
  req.user = user;
  return next();
});
