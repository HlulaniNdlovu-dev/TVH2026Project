import * as stubs from '../db/stubs.js';

const afterReset = [];

// Lets another part of the app (the built-in simulator) start fresh whenever the data is reset.
export function onReset(fn) {
  afterReset.push(fn);
}

// Puts every in-memory table back to the seeded demo state, without telling anyone.
export async function resetData() {
  await stubs.resetDatabase();
  return { reset: true };
}

// The "Reset demo data" button: the data and everything that depends on it.
export async function reset() {
  await resetData();
  afterReset.forEach((fn) => fn());
  return { reset: true };
}
