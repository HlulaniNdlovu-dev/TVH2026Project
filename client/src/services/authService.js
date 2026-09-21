import { api } from './api.js';

export const login = (phone, password) => api.post('/auth/login', { phone, password }).then((r) => r.user);
export const register = (details) => api.post('/auth/register', details).then((r) => r.user);
export const fetchMe = () => api.get('/auth/me').then((r) => r.user);
