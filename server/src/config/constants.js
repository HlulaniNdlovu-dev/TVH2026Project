export const ROLES = { CITIZEN: 'citizen', TECHNICIAN: 'technician', ADMIN: 'admin' };

// Order matters: the citizen stepper follows this sequence.
export const INCIDENT_STATUS = {
  REPORTED: 'reported',
  VERIFIED: 'verified',
  DISPATCHED: 'dispatched',
  EN_ROUTE: 'en_route',
  ARRIVED: 'arrived',
  WORKING: 'working',
  PAUSED: 'paused',
  RESOLVED: 'resolved',
  MERGED: 'merged',
};

export const OPEN_STATUSES = ['reported', 'verified', 'dispatched', 'en_route', 'arrived', 'working', 'paused'];
// Statuses where a technician is actively on the job.
export const ACTIVE_JOB_STATUSES = ['en_route', 'arrived', 'working', 'paused'];

export const JOB_STATE = { PENDING: 'pending', ACCEPTED: 'accepted', DECLINED: 'declined', CLOSED: 'closed', CANCELLED: 'cancelled' };

export const REPORT_CATEGORIES = [
  { value: 'no_power', label: 'No power at all' },
  { value: 'partial_power', label: 'Partial power / flickering' },
  { value: 'downed_line', label: 'Downed power line (dangerous)' },
  { value: 'sparking', label: 'Sparking or burning smell (dangerous)' },
  { value: 'meter_box', label: 'Meter box problem' },
  { value: 'other', label: 'Other' },
];
export const DANGER_CATEGORIES = ['downed_line', 'sparking'];

export const PAUSE_REASONS = [
  { value: 'weather', label: 'Weather conditions' },
  { value: 'tools', label: 'Waiting for tools or equipment' },
  { value: 'parts', label: 'Waiting for parts / materials' },
  { value: 'unsafe_area', label: 'Unsafe area' },
  { value: 'access', label: 'No access to the site' },
  { value: 'permit', label: 'Awaiting isolation / permit' },
];

export const DECLINE_REASONS = [
  { value: 'too_far', label: 'Too far from my current location' },
  { value: 'lacks_skills', label: 'Not qualified for this type of fault' },
  { value: 'tools', label: 'Do not have the required tools' },
  { value: 'unsafe', label: 'Area is unsafe' },
  { value: 'vehicle', label: 'Vehicle problem' },
  { value: 'shift_ending', label: 'My shift is ending' },
];

export const PRIORITY_LEVELS = ['critical', 'high', 'medium', 'low'];
export const PRIORITY_OVERRIDE_BASE = { critical: 1000, high: 500, medium: 250, low: 0 };

export const NODE_TYPES = { SUBSTATION: 'substation', TRANSFORMER: 'transformer', HOUSE: 'house' };

// Keyword -> category used by analytics to group free-text fault causes.
export const FAULT_CAUSE_KEYWORDS = [
  ['Blown fuse / breaker', ['fuse', 'breaker', 'trip']],
  ['Cable fault', ['cable', 'wire', 'conductor', 'line']],
  ['Transformer failure', ['transformer', 'oil', 'winding']],
  ['Vandalism / theft', ['vandal', 'theft', 'stolen', 'steal', 'copper']],
  ['Overload', ['overload', 'overheat', 'demand']],
  ['Weather / tree damage', ['storm', 'lightning', 'tree', 'wind', 'rain', 'weather']],
  ['Meter / connection', ['meter', 'connection', 'terminal', 'isolator']],
];
