// Small web server for the simulator's control panel (public/) and its control API.
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';
import { state, addLog } from './state.js';
import * as engine from './engine.js';
import * as api from './api.js';

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

const wrap = (fn) => async (req, res) => {
  try {
    const result = await fn(req.body ?? {}, req);
    res.json({ ok: true, ...(result ?? {}) });
  } catch (err) {
    addLog(err.message, 'error');
    res.status(400).json({ ok: false, message: err.message });
  }
};

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(express.static(publicDir));

  app.get('/api/state', (req, res) => {
    res.json({
      connected: state.connected,
      lastError: state.lastError,
      lastSync: state.lastSync,
      apiUrl: config.apiUrl,
      autoDrive: state.autoDrive,
      speedMultiplier: state.speedMultiplier,
      faultCount: state.faults.size,
      technicians: state.technicians,
      log: state.log,
      nodes: state.nodes.map((n) => ({
        id: n.id, type: n.type, name: n.name, parentId: n.parentId, area: n.area, meterNumber: n.meterNumber, ownerName: n.ownerName,
        powered: engine.isPowered(n), fault: state.faults.get(n.id)?.kind ?? null,
      })),
    });
  });

  app.post('/api/trip', wrap(({ nodeId }) => engine.trip(nodeId)));
  app.post('/api/restore', wrap(({ nodeId }) => engine.restore(nodeId)));
  app.post('/api/restore-all', wrap(() => engine.restoreAll()));
  app.post('/api/scenario/:name', wrap(({ nodeId }, req) => {
    const fn = engine.scenarios[req.params.name];
    if (!fn) throw new Error('Unknown scenario');
    return { nodeId: fn(nodeId) };
  }));
  app.post('/api/loadshedding', wrap(({ area, minutes, overrun }) => engine.loadshedding(area, Number(minutes) || 2, overrun ? 4 : 0)));
  app.post('/api/technicians', wrap(({ autoDrive, speed }) => {
    if (autoDrive !== undefined) state.autoDrive = Boolean(autoDrive);
    if (speed) state.speedMultiplier = Number(speed);
    addLog(`Technician driving ${state.autoDrive ? `on (${state.speedMultiplier}x speed)` : 'paused'}`);
  }));
  app.post('/api/reset-backend', wrap(async () => {
    await api.resetBackend();
    state.faults.clear();
    state.lastSent.clear();
    await engine.syncTopology();
    addLog('Backend demo data reset to the seed state', 'ok');
  }));

  return app;
}
