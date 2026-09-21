// The only place that talks to the network. Every other service goes through request().
import { clearStoredUser, getStoredUser } from '../utils/storage.js';

// On the same machine or Wi-Fi the API is on port 4000. When hosted, set VITE_API_URL.
export const API_BASE = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:4000/api`;

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  const user = getStoredUser();
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(user ? { 'x-user-id': user.id } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the PowerLink server. Check your connection and try again.', 0);
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && user && !path.startsWith('/auth/login')) {
    // The account no longer exists (for example the demo was reset): send the user back to log in.
    clearStoredUser();
    window.location.assign('/login?expired=1');
  }
  if (!response.ok) throw new ApiError(data.message || 'Something went wrong', response.status);
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body = {}) => request('POST', path, body),
  patch: (path, body = {}) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};

export const photoUrl = (id) => `${API_BASE}/photos/${id}`;
