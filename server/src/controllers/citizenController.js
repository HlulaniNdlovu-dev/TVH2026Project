import * as citizen from '../services/citizenService.js';
import * as reports from '../services/reportService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboard = asyncHandler(async (req, res) => res.json(await citizen.dashboard(req.user)));
export const meters = asyncHandler(async (req, res) => res.json({ meters: await citizen.meters(req.user) }));
export const incidents = asyncHandler(async (req, res) => res.json(await citizen.incidents(req.user)));
export const updateProfile = asyncHandler(async (req, res) => res.json({ user: await citizen.updateProfile(req.user, req.body) }));
export const addMeter = asyncHandler(async (req, res) => res.status(201).json({ user: await citizen.addMeter(req.user, req.body) }));
export const removeMeter = asyncHandler(async (req, res) => res.json({ user: await citizen.removeMeter(req.user, req.params.meterNumber) }));
export const submitReport = asyncHandler(async (req, res) => res.status(201).json(await reports.submit(req.user, req.body)));
