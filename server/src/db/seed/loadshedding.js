// A believable rolling schedule for today and the next 3 days, offset per area.
import { AREA_NAMES } from './grid.js';

const SLOTS = [
  [6, 8.5],
  [14, 16.5],
  [22, 24.5],
];

export function buildLoadshedding() {
  const windows = [];
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  let seq = 0;
  AREA_NAMES.forEach((area, areaIdx) => {
    for (let day = 0; day < 4; day += 1) {
      const [startH, endH] = SLOTS[(day + areaIdx) % SLOTS.length];
      const start = new Date(midnight.getTime() + (day * 24 + startH) * 3600000);
      const end = new Date(midnight.getTime() + (day * 24 + endH) * 3600000);
      // Keep seeded windows away from "now" so a demo outage is never suppressed by accident.
      // Loadshedding is demonstrated on purpose with the simulator instead.
      const nowMs = Date.now();
      if (end.getTime() > nowMs - 30 * 60000 && start.getTime() < nowMs + 90 * 60000) continue;
      seq += 1;
      windows.push({ id: `LS-${1000 + seq}`, area, stage: 2 + ((day + areaIdx) % 3), start: start.toISOString(), end: end.toISOString(), source: 'seed' });
    }
  });
  return windows;
}
