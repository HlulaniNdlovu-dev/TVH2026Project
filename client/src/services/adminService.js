import { api } from './api.js';

export const getOverview = () => api.get('/admin/overview');
export const getGrid = () => api.get('/admin/grid');
export const getIncidents = (status = 'open') => api.get(`/admin/incidents?status=${status}`).then((r) => r.incidents);
export const getIncident = (id) => api.get(`/admin/incidents/${id}`).then((r) => r.incident);
export const verifyIncident = (id) => api.post(`/admin/incidents/${id}/verify`).then((r) => r.incident);
export const overridePriority = (id, level, reason) => api.post(`/admin/incidents/${id}/priority`, { level, reason }).then((r) => r.incident);
export const assignTechnician = (id, technicianId, reason) => api.post(`/admin/incidents/${id}/assign`, { technicianId, reason }).then((r) => r.incident);
export const getDispatchBoard = () => api.get('/admin/dispatch-board');
export const getTechnicians = () => api.get('/admin/technicians').then((r) => r.technicians);
export const getSensors = () => api.get('/admin/sensors').then((r) => r.sensors);
export const getAnalytics = () => api.get('/admin/analytics');
export const getAuditLog = () => api.get('/admin/audit').then((r) => r.entries);
export const getLoadshedding = () => api.get('/admin/loadshedding').then((r) => r.windows);
export const uploadLoadshedding = (csv, replace) => api.post('/admin/loadshedding/upload', { csv, replace });
export const resetDemo = () => api.post('/demo/reset');
