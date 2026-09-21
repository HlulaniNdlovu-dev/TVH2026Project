export const STATUS_LABELS = {
  reported: 'Reported',
  verified: 'Verified',
  dispatched: 'Dispatched',
  en_route: 'En route',
  arrived: 'Arrived',
  working: 'Working',
  paused: 'Paused',
  resolved: 'Resolved',
  merged: 'Merged',
};

export const STATUS_TONE = {
  reported: 'grey',
  verified: 'blue',
  dispatched: 'blue',
  en_route: 'amber',
  arrived: 'green',
  working: 'green',
  paused: 'amber',
  resolved: 'green',
  merged: 'grey',
};

export const PRIORITY_TONE = { critical: 'red', high: 'amber', medium: 'blue', low: 'grey' };

// The steps a citizen sees, in order. "paused" is shown inside the "working" step.
export const STEPS = [
  { status: 'reported', label: 'Reported' },
  { status: 'verified', label: 'Verified' },
  { status: 'dispatched', label: 'Dispatched' },
  { status: 'en_route', label: 'En route' },
  { status: 'arrived', label: 'Arrived' },
  { status: 'working', label: 'Working' },
  { status: 'resolved', label: 'Resolved' },
];

export const stepIndex = (status) => {
  const key = status === 'paused' ? 'working' : status;
  return STEPS.findIndex((s) => s.status === key);
};
