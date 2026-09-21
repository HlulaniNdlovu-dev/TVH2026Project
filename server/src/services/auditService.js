import * as stubs from '../db/stubs.js';

// Every override, reassignment and manual action ends up here so the admin audit page has a full trail.
export function log(actor, action, entity, entityId, details, reason = null) {
  return stubs.appendAudit({
    actorId: actor?.id ?? 'system',
    actorName: actor?.name ?? 'System',
    action,
    entity,
    entityId,
    details,
    reason,
  });
}

export const list = async () => (await stubs.listAudit()).slice().reverse();
