import { api } from './api.js';

export const listNotifications = () => api.get('/notifications').then((r) => r.notifications);
export const getUnreadCount = () => api.get('/notifications/unread-count').then((r) => r.count);
export const listSms = () => api.get('/notifications/sms').then((r) => r.messages);
export const markRead = (id) => api.post(`/notifications/${id}/read`);
export const markAllRead = () => api.post('/notifications/read-all');
