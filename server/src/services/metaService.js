import { REPORT_CATEGORIES, PAUSE_REASONS, DECLINE_REASONS, PRIORITY_LEVELS } from '../config/constants.js';
import { AREA_NAMES } from '../db/seed/grid.js';

// Lists the client needs for dropdowns, so the server stays the single source of truth.
export const getMeta = () => ({
  reportCategories: REPORT_CATEGORIES,
  pauseReasons: PAUSE_REASONS,
  declineReasons: DECLINE_REASONS,
  priorityLevels: PRIORITY_LEVELS,
  areas: AREA_NAMES,
});
