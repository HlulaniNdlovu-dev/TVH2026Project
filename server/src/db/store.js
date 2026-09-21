// The "database": plain in-memory arrays. Only db/stubs.js should touch this object.
import { buildSeed } from './seed/index.js';

export const db = {};

export function resetStore() {
  Object.keys(db).forEach((key) => delete db[key]);
  Object.assign(db, buildSeed());
}

resetStore();
