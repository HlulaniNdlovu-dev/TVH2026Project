import * as stubs from '../db/stubs.js';

// Puts every in-memory table back to the seeded demo state.
export async function reset() {
  await stubs.resetDatabase();
  return { reset: true };
}
