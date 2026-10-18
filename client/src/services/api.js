// The only place that talks to the network. Every other service goes through request().
import { userIdFromPath } from '../features/auth/userPaths.js';

// Where the API lives:
//  - VITE_API_URL, when set, always wins.
//  - Running locally (localhost, 127.0.0.1 or a Wi-Fi address such as 192.168.x.x): the API on port 4000 of that same host.
//  - Anywhere else (the Render site): the hosted backend.
const HOSTED_API = 'https://tvh2026project-server.onrender.com/api';
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
  // No sessions: the user is whoever the current address names (see features/auth/userPaths.js).
  const userId = userIdFromPath();
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(userId ? { 'x-user-id': userId } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Cannot reach the PowerLink server. Check your connection and try again.', 0);
  }
  const data = await response.json().catch(() => ({}));
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
