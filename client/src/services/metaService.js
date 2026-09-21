import { api } from './api.js';

let cached = null;

// Dropdown lists (categories, pause reasons...) come from the server so there is one source of truth.
export function getMeta() {
  if (!cached) cached = api.get('/meta').catch((err) => {
    cached = null;
    throw err;
  });
  return cached;
}
