import * as simulator from '../services/simulatorService.js';
import { badRequest } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Same request and response shapes as the standalone simulator's control API.
const action = (fn) =>
  asyncHandler(async (req, res) => {
    let result;
    try {
      result = await fn(req.body ?? {}, req);
    } catch (err) {
      throw badRequest(err.message);
    }
    res.json({ ok: true, ...(result ?? {}) });
  });

export const state = (req, res) => res.json(simulator.getState());
export const trip = action(simulator.actions.trip);
export const restore = action(simulator.actions.restore);
export const restoreAll = action(simulator.actions.restoreAll);
export const scenario = action((body, req) => simulator.actions.scenario(req.params.name, body));
export const loadshedding = action(simulator.actions.loadshedding);
export const technicians = action(simulator.actions.technicians);
export const resetBackend = action(simulator.actions.resetBackend);
