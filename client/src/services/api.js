// The only place that talks to the network. Every other service goes through request().
import { clearStoredUser, getStoredUser } from '../utils/storage.js';

// Where the API lives:
//  - VITE_API_URL, when set, always wins.
//  - Running locally (localhost, 127.0.0.1 or a Wi-Fi address such as 192.168.x.x): the API on port 4000 of that same host.
//  - Anywhere else (the Render site): the hosted backend.
const HOSTED_API = 'https://tvh2026project-backend.onrender.com/api';
const { protocol, hostname } = window.location;
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local') || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);

export const API_BASE = (import.meta.env.VITE_API_URL || (isLocalHost ? `${protocol}//${hostname}:4000/api` : HOSTED_API)).replace(/\/$/, '');

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
