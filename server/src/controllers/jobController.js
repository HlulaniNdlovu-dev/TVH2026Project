import * as jobs from '../services/jobService.js';
import * as technicians from '../services/technicianService.js';
import * as auth from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const mine = asyncHandler(async (req, res) => {
  const data = await jobs.listMine(req.user);
  res.json({ ...data, duty: req.user.tech.dutyStatus, stats: await technicians.stats(req.user.id), technician: auth.sanitize(req.user) });
});
export const get = asyncHandler(async (req, res) => res.json({ job: await jobs.get(req.user, req.params.id) }));
export const accept = asyncHandler(async (req, res) => res.json({ job: await jobs.accept(req.user, req.params.id) }));
export const decline = asyncHandler(async (req, res) => res.json(await jobs.decline(req.user, req.params.id, req.body.reason)));
export const travel = asyncHandler(async (req, res) => res.json({ job: await jobs.startTravel(req.user, req.params.id) }));
export const start = asyncHandler(async (req, res) => res.json({ job: await jobs.startJob(req.user, req.params.id) }));
export const pause = asyncHandler(async (req, res) => res.json({ job: await jobs.pause(req.user, req.params.id, req.body.reason) }));
export const resume = asyncHandler(async (req, res) => res.json({ job: await jobs.resume(req.user, req.params.id) }));
export const close = asyncHandler(async (req, res) => res.json(await jobs.close(req.user, req.params.id, req.body)));
export const setDuty = asyncHandler(async (req, res) => res.json(await technicians.setDuty(req.user.id, req.body.dutyStatus)));
