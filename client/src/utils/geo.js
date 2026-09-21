const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

// Straight-line distance in metres.
export function distanceMeters(a, b) {
  if (!a || !b) return null;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const TSHWANE_CENTER = { lat: -25.7069, lng: 28.3999 };

export const googleMapsDirections = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
