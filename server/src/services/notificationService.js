import * as stubs from '../db/stubs.js';
import { PAUSE_REASONS } from '../config/constants.js';

const pauseLabel = (value) => PAUSE_REASONS.find((r) => r.value === value)?.label ?? value;

const TEMPLATES = {
  reported: () => ({ title: 'Report received', message: (i) => `We received your outage report (${i.id}) and are checking it against our sensors.` }),
  detected: () => ({ title: 'Outage detected', message: (i) => `Our sensors detected an outage affecting your meter (${i.id}). We are getting it verified and dispatched.` }),
  verified: () => ({ title: 'Outage verified', message: (i) => `Your outage (${i.id}) has been verified. A technician will be assigned shortly.` }),
  dispatched: (x) => ({ title: 'Technician assigned', message: (i) => `${x.techName} (${x.employeeId}) has been assigned to your outage (${i.id}).` }),
  en_route: (x) => ({ title: 'Technician on the way', message: (i) => `${x.techName} is on the way. Estimated arrival in about ${x.eta ?? '?'} min.` }),
  nearby: (x) => ({ title: 'Technician nearby', message: () => `${x.techName} is nearby and will arrive in a few minutes.` }),
  arrived: (x) => ({ title: 'Technician arrived', message: (i) => `${x.techName} has arrived and started work on ${i.id}.` }),
  resumed: (x) => ({ title: 'Work resumed', message: (i) => `${x.techName} has resumed work on ${i.id}.` }),
  paused: (x) => ({ title: 'Repair paused', message: (i) => `Work on ${i.id} is paused: ${pauseLabel(x.reason)}. We will update you when it resumes.` }),
  resolved: () => ({ title: 'Power restored', message: (i) => `Your outage (${i.id}) has been resolved. Thank you for your patience.` }),
  loadshedding: (x) => ({ title: 'Scheduled loadshedding', message: () => `Your area is in scheduled Stage ${x.stage} loadshedding until ${x.until}. This is not a fault, so no technician was dispatched.` }),
};

async function deliver(userId, { incidentId, type, title, message }) {
  const user = await stubs.findUserById(userId);
  if (!user) return null;
  const prefs = user.prefs ?? { inApp: true, sms: true };
  let notification = null;
  if (prefs.inApp !== false) {
    notification = await stubs.createNotification({ userId, incidentId, type, title, message });
  }
  if (prefs.sms) {
    // SMS is simulated: the message is stored in an outbox instead of being sent.
    await stubs.createSms({ to: user.phone, userId, incidentId, body: `PowerLink: ${message}` });
  }
  return notification;
}

// People who care about an incident: owners of affected meters plus anyone who reported it.
export async function recipientsOf(incident) {
  const nodes = await stubs.listNodes();
  const ids = new Set(incident.reporterIds ?? []);
  nodes.filter((n) => incident.affectedNodeIds.includes(n.id) && n.ownerId).forEach((n) => ids.add(n.ownerId));
  return [...ids];
}

// Sends a status update to everybody affected (or to `recipients` when given).
export async function notifyStatus(incident, type, extra = {}, recipients = null) {
  const template = TEMPLATES[type]?.(extra);
  if (!template) return;
  const users = recipients ?? (await recipientsOf(incident));
  await Promise.all(
    users.map((userId) => deliver(userId, { incidentId: incident.id, type, title: template.title, message: template.message(incident) })),
  );
}

export const notifyLoadshedding = (userId, incidentId, window) =>
  deliver(userId, {
    incidentId,
    type: 'loadshedding',
    ...(() => {
      const t = TEMPLATES.loadshedding({ stage: window.stage, until: new Date(window.end).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) });
      return { title: t.title, message: t.message() };
    })(),
  });

export async function listForUser(userId) {
  const list = await stubs.listNotifications({ userId });
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function markRead(userId, id) {
  const all = await stubs.listNotifications({ userId });
  if (!all.some((n) => n.id === id)) return null;
  return stubs.markNotificationRead(id);
}

export const markAllRead = (userId) => stubs.markAllNotificationsRead(userId);

export async function unreadCount(userId) {
  return (await stubs.listNotifications({ userId })).filter((n) => !n.read).length;
}
