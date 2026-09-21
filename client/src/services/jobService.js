import { api } from './api.js';

export const getMyJobs = () => api.get('/technician/jobs');
export const getJob = (id) => api.get(`/technician/jobs/${id}`).then((r) => r.job);
export const acceptJob = (id) => api.post(`/technician/jobs/${id}/accept`).then((r) => r.job);
export const declineJob = (id, reason) => api.post(`/technician/jobs/${id}/decline`, { reason });
export const startTravel = (id) => api.post(`/technician/jobs/${id}/travel`).then((r) => r.job);
export const startJob = (id) => api.post(`/technician/jobs/${id}/start`).then((r) => r.job);
export const pauseJob = (id, reason) => api.post(`/technician/jobs/${id}/pause`, { reason }).then((r) => r.job);
export const resumeJob = (id) => api.post(`/technician/jobs/${id}/resume`).then((r) => r.job);
export const closeJob = (id, details) => api.post(`/technician/jobs/${id}/close`, details);
export const setDuty = (dutyStatus) => api.patch('/technician/duty', { dutyStatus });
