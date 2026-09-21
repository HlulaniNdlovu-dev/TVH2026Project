import { buildGrid } from './grid.js';
import { buildUsers } from './users.js';
import { buildLoadshedding } from './loadshedding.js';
import { buildHistory } from './history.js';

// Everything the in-memory database starts with (and returns to when the demo is reset).
export function buildSeed() {
  const nodes = buildGrid();
  const users = buildUsers(nodes);
  const loadshedding = buildLoadshedding();
  const history = buildHistory(nodes, users);

  // A few sensors have a history of flickers.
  ['TR-MAM-2', 'H-EER-1-4', 'TR-NEL-1'].forEach((id, i) => {
    const node = nodes.find((n) => n.id === id);
    if (node) node.flickerCount = 3 + i * 2;
  });

  return {
    nodes,
    users,
    loadshedding,
    incidents: history.incidents,
    jobs: history.jobs,
    suppressed: history.suppressed,
    reports: [],
    notifications: [],
    sms: [],
    audit: [
      { id: 'AUD-1001', ts: new Date().toISOString(), actorId: 'system', actorName: 'System', action: 'seed', entity: 'system', entityId: '-', details: 'Demo data loaded', reason: null },
    ],
    commands: [],
    photos: {},
    counters: { ...history.counters, U: 1005, T: 104, REP: 1000, NOT: 1000, SMS: 1000, AUD: 1001, LS: 2000, H: 900, PH: 1000 },
  };
}
