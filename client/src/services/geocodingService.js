// Turns a typed address into coordinates using OpenStreetMap's free Nominatim search.
// Fair use: one request per click, restricted to South Africa.
export async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=za&q=${encodeURIComponent(address)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('Address search is unavailable right now');
  const results = await response.json();
  if (!results.length) return null;
  return { lat: Number(results[0].lat), lng: Number(results[0].lon), label: results[0].display_name };
}
