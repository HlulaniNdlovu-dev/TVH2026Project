import * as admin from '../services/adminService.js';
import * as analytics from '../services/analyticsService.js';
import * as audit from '../services/auditService.js';
import * as loadshedding from '../services/loadsheddingService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const overview = asyncHandler(async (req, res) => res.json(await admin.overview()));
export const grid = asyncHandler(async (req, res) => res.json(await admin.grid()));
export const incidents = asyncHandler(async (req, res) => res.json({ incidents: await admin.listIncidents({ status: req.query.status }) }));
export const incident = asyncHandler(async (req, res) => res.json({ incident: await admin.incidentDetail(req.params.id) }));
export const verify = asyncHandler(async (req, res) => res.json({ incident: await admin.verifyIncident(req.user, req.params.id) }));
export const priority = asyncHandler(async (req, res) => res.json({ incident: await admin.overridePriority(req.user, req.params.id, req.body) }));
export const assign = asyncHandler(async (req, res) => res.json({ incident: await admin.assignTechnician(req.user, req.params.id, req.body) }));
export const dispatchBoard = asyncHandler(async (req, res) => res.json(await admin.dispatchBoard()));
export const technicians = asyncHandler(async (req, res) => res.json({ technicians: await admin.technicians() }));
export const sensors = asyncHandler(async (req, res) => res.json({ sensors: await admin.sensors() }));
export const analyticsSummary = asyncHandler(async (req, res) => res.json(await analytics.summary()));
export const auditLog = asyncHandler(async (req, res) => res.json({ entries: await audit.list() }));
export const loadsheddingList = asyncHandler(async (req, res) => res.json({ windows: await loadshedding.list() }));
export const loadsheddingUpload = asyncHandler(async (req, res) =>
  res.status(201).json(await loadshedding.uploadCsv(req.body.csv, { replace: Boolean(req.body.replace) }, req.user)),
);
