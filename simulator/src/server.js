// Small web server for the simulator's control panel (public/) and its control API (standalone mode only).
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { addLog } from './state.js';
import { snapshot, actions } from './runner.js';

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

  app.get('/api/state', (req, res) => res.json(snapshot()));
  app.post('/api/trip', wrap(actions.trip));
  app.post('/api/restore', wrap(actions.restore));
  app.post('/api/restore-all', wrap(actions.restoreAll));
  app.post('/api/scenario/:name', wrap((body, req) => actions.scenario(req.params.name, body)));
  app.post('/api/loadshedding', wrap(actions.loadshedding));
  app.post('/api/technicians', wrap(actions.technicians));
  app.post('/api/reset-backend', wrap(actions.resetBackend));

  return app;
}
