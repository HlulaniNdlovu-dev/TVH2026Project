// Sequential, human friendly ids such as INC-1001. Counters live in the store so a reset restarts them.
import { db } from '../db/store.js';

export function nextId(prefix, start = 1001) {
  db.counters[prefix] = (db.counters[prefix] ?? start - 1) + 1;
  return `${prefix}-${db.counters[prefix]}`;
}
