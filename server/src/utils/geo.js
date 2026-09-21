const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

// Straight-line distance in metres between two lat/lng points.
export function haversine(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Road distance is longer than a straight line, so pad it a little.
export function etaMinutes(distanceMeters, speedKmh) {
  if (distanceMeters == null) return null;
  const km = (distanceMeters * 1.3) / 1000;
  return Math.max(1, Math.round((km / speedKmh) * 60));
}

// Circle that covers a set of points (used to highlight affected areas in red).
export function coveringCircle(points, paddingMeters = 80) {
  if (!points.length) return null;
  const center = {
    lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
    lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
  };
  const radius = Math.max(0, ...points.map((p) => haversine(center, p))) + paddingMeters;
  return { center, radiusMeters: Math.round(radius) };
}
