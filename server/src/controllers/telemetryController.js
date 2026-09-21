import * as telemetry from '../services/telemetryService.js';
import * as loadshedding from '../services/loadsheddingService.js';
import * as demo from '../services/demoService.js';
import { badRequest } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const readings = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body.readings)) throw badRequest('readings must be an array');
  res.json(await telemetry.ingest(req.body.readings));
});
export const topology = asyncHandler(async (req, res) => res.json({ nodes: await telemetry.topology() }));
export const technicianTargets = asyncHandler(async (req, res) => res.json({ technicians: await telemetry.technicianTargets() }));
export const technicianLocations = asyncHandler(async (req, res) => res.json(await telemetry.updateLocations(req.body.locations ?? [])));
export const commands = asyncHandler(async (req, res) => res.json({ commands: await telemetry.popCommands() }));
export const startLoadshedding = asyncHandler(async (req, res) => res.status(201).json({ window: await loadshedding.injectWindow(req.body) }));
export const reset = asyncHandler(async (req, res) => res.json(await demo.reset()));
