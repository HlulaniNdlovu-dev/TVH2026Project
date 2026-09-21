import { api } from './api.js';

export const getDashboard = () => api.get('/citizen/dashboard');
export const getMeters = () => api.get('/citizen/meters').then((r) => r.meters);
export const getIncidents = () => api.get('/citizen/incidents');
export const submitReport = (report) => api.post('/citizen/reports', report);
export const updateProfile = (changes) => api.patch('/citizen/profile', changes).then((r) => r.user);
export const addMeter = (meter) => api.post('/citizen/meters', meter).then((r) => r.user);
export const removeMeter = (meterNumber) => api.delete(`/citizen/meters/${meterNumber}`).then((r) => r.user);
