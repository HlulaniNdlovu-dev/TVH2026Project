import { api } from './api.js';

// A cheap request that also wakes the hosted server up (Render puts free services to sleep when idle).
export const ping = () => api.get('/health');
