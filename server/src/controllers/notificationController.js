import * as notifications from '../services/notificationService.js';
import * as stubs from '../db/stubs.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => res.json({ notifications: await notifications.listForUser(req.user.id) }));
export const unreadCount = asyncHandler(async (req, res) => res.json({ count: await notifications.unreadCount(req.user.id) }));
export const markRead = asyncHandler(async (req, res) => {
  await notifications.markRead(req.user.id, req.params.id);
  res.json({ ok: true });
});
export const markAllRead = asyncHandler(async (req, res) => {
  await notifications.markAllRead(req.user.id);
  res.json({ ok: true });
});
// The simulated SMS inbox for the logged in citizen.
export const sms = asyncHandler(async (req, res) => {
  const all = await stubs.listSms();
  res.json({ messages: all.filter((m) => m.userId === req.user.id).reverse() });
});
