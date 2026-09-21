export const formatTime = (iso) => (iso ? new Date(iso).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) : '-');

export const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) : '-');

export const formatDateTime = (iso) => (iso ? `${formatDate(iso)}, ${formatTime(iso)}` : '-');

export function timeAgo(iso) {
  if (!iso) return '-';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return formatDate(iso);
}

export function formatDuration(minutes) {
  if (minutes == null) return '-';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

export const formatWatts = (watts) => (watts >= 1000 ? `${(watts / 1000).toFixed(2)} kW` : `${Math.round(watts)} W`);

export const formatDistance = (meters) => (meters == null ? '-' : meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`);

export const capitalize = (text = '') => text.charAt(0).toUpperCase() + text.slice(1);
