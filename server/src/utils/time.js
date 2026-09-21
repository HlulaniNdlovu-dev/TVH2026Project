export const nowIso = () => new Date().toISOString();
export const minutesBetween = (fromIso, toIso) => (new Date(toIso) - new Date(fromIso)) / 60000;
export const secondsSince = (iso) => (Date.now() - new Date(iso).getTime()) / 1000;
export const addMinutes = (date, minutes) => new Date(new Date(date).getTime() + minutes * 60000);
