import { api } from './api.js';

// The built-in sensor simulator that runs inside the API (no login needed).
export const getState = () => api.get('/simulator/state');
export const trip = (nodeId) => api.post('/simulator/trip', { nodeId });
export const restore = (nodeId) => api.post('/simulator/restore', { nodeId });
export const restoreAll = () => api.post('/simulator/restore-all');
export const runScenario = (name, nodeId) => api.post(`/simulator/scenario/${name}`, nodeId ? { nodeId } : {});
export const startLoadshedding = (area, minutes, overrun) => api.post('/simulator/loadshedding', { area, minutes, overrun });
export const setAutoDrive = (autoDrive) => api.post('/simulator/technicians', { autoDrive });
export const resetDemo = () => api.post('/simulator/reset-backend');
