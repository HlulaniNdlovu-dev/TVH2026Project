// Explainable priority score. The admin can see every component and override the final level.
import { PRIORITY_OVERRIDE_BASE } from '../config/constants.js';
import { minutesBetween, nowIso } from '../utils/time.js';

export const levelFor = (score) => (score >= 100 ? 'critical' : score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low');

export function computePriority(incident, { customers, criticalCount, vulnerableCount, reports }) {
  const waited = minutesBetween(incident.createdAt, nowIso());
  const breakdown = {
    customers: customers * 2,
    criticalFacilities: criticalCount * 50,
    vulnerableCustomers: vulnerableCount * 10,
    dangerReport: incident.danger ? 100 : 0,
    // Reports from people who are at the property count fully; remote reports count less. Sensors are always full weight.
    citizenReports: Math.round(reports.reduce((sum, r) => sum + (r.trust ?? 0.3), 0) * 3),
    sensorConfirmed: incident.sensorConfirmed ? 20 : 0,
    waitingTime: Math.round(Math.min(Math.max(waited, 0) * 0.2, 30)),
    extendedLoadshedding: incident.extendedLoadshedding ? 15 : 0,
  };
  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  const calculatedLevel = levelFor(score);
  const override = incident.override;
  return {
    score,
    calculatedLevel,
    level: override ? override.level : calculatedLevel,
    effective: override ? PRIORITY_OVERRIDE_BASE[override.level] + score : score,
    breakdown,
  };
}
